import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { findAwinMerchant } from '@/lib/awin-link';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, sectionBlock } from '@/lib/cron-email';

/**
 * Vérification hebdomadaire des offres ajoutées à la main (source = 'manual'), que les synchros
 * Awin ne mettent jamais à jour : stock, prix et code-barres lus sur la page du marchand.
 *
 * - La page est ouverte DIRECTEMENT (destination extraite du lien), jamais via awin1.com :
 *   ouvrir un lien de suivi créerait de faux clics.
 * - Rupture ou page supprimée : in_stock = false, l'offre disparaît de la boutique.
 *   Retour en stock : elle réapparaît.
 * - Prix mis à jour, sauf écart de plus de 50 % (signalé, pas appliqué : mauvais produit probable).
 * - Code-barres différent de la fiche : signalé, jamais appliqué automatiquement.
 * - Page illisible ou bloquée : aucun changement.
 */
export const runtime = 'nodejs';
export const maxDuration = 300;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';
const IN_STOCK = new Set(['InStock', 'LimitedAvailability', 'OnlineOnly', 'InStoreOnly']);
const OUT_OF_STOCK = new Set(['OutOfStock', 'SoldOut', 'Discontinued']);
const MAX_PRICE_CHANGE = 0.5;

interface OfferRow {
  id: string;
  price: number | string;
  in_stock: boolean;
  affiliate_url: string;
  merchant_name: string;
  products_catalog: { name: string; name_fr: string | null; ean: string | null; status: string } | null;
}

/** Page du marchand derrière le lien, uniquement pour les partenaires Awin connus. */
function merchantPage(affiliateUrl: string): string | null {
  try {
    const u = new URL(affiliateUrl);
    const page = u.hostname === 'www.awin1.com' ? u.searchParams.get('ued') : affiliateUrl;
    return page && findAwinMerchant(page) ? page : null;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown>;
const toArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '').replace(/^0+/, '');

function readProduct(html: string): { price: number | null; availability: string; gtin: string } | null {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed: unknown;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    const nodes = toArray(parsed).flatMap(n => toArray((n as Json)?.['@graph'] ?? n)) as Json[];
    const product = nodes.find(n => toArray(n?.['@type']).includes('Product'));
    if (!product) continue;
    const offers = toArray(product.offers) as Json[];
    // Plusieurs offres = plusieurs variantes : impossible de savoir laquelle est la nôtre
    if (offers.length !== 1) return null;
    const price = Number(offers[0].price);
    return {
      price: Number.isFinite(price) && price > 0 ? price : null,
      availability: String(offers[0].availability ?? '').split('/').pop() ?? '',
      gtin: digits(product.gtin13 ?? product.gtin ?? product.gtin12 ?? product.gtin8),
    };
  }
  return null;
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ?dry=1 : lit et compare sans rien écrire ni envoyer
  const dry = new URL(req.url).searchParams.get('dry') === '1';
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('product_offers')
    .select('id, price, in_stock, affiliate_url, merchant_name, products_catalog!inner(name, name_fr, ean, status)')
    .eq('source', 'manual')
    .in('products_catalog.status', ['active', 'pinned'])
    .limit(200);
  if (error) {
    console.error('[manual-offers] lecture:', error.message);
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 500 });
  }

  const changes: string[] = [];
  const alerts: string[] = [];
  const unreadable: string[] = [];
  let checked = 0;
  const deadline = Date.now() + (maxDuration - 40) * 1000;

  for (const offer of (data ?? []) as unknown as OfferRow[]) {
    if (Date.now() > deadline) { alerts.push('Temps dépassé : les offres restantes seront vérifiées la semaine prochaine.'); break; }
    const label = `${offer.products_catalog?.name_fr ?? offer.products_catalog?.name ?? offer.id} (${offer.merchant_name})`;
    const page = merchantPage(offer.affiliate_url);
    if (!page) { unreadable.push(`${label} : marchand non vérifiable`); continue; }

    const update: { in_stock?: boolean; price?: number; last_synced_at?: string } = {};
    try {
      const res = await fetch(page, {
        headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'fr-BE,fr;q=0.9' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 404 || res.status === 410) {
        if (offer.in_stock) { update.in_stock = false; changes.push(`${label} : page supprimée, retirée de la boutique`); }
      } else if (!res.ok) {
        unreadable.push(`${label} : réponse ${res.status}`);
        continue;
      } else {
        const product = readProduct(await res.text());
        if (!product) { unreadable.push(`${label} : page illisible`); continue; }
        if (OUT_OF_STOCK.has(product.availability) && offer.in_stock) {
          update.in_stock = false;
          changes.push(`${label} : en rupture, retirée de la boutique`);
        } else if (IN_STOCK.has(product.availability) && !offer.in_stock) {
          update.in_stock = true;
          changes.push(`${label} : de nouveau en stock`);
        }
        const oldPrice = Number(offer.price);
        if (product.price && product.price !== oldPrice) {
          if (oldPrice > 0 && Math.abs(product.price - oldPrice) / oldPrice > MAX_PRICE_CHANGE) {
            alerts.push(`${label} : prix ${oldPrice} -> ${product.price}, écart trop grand, non appliqué`);
          } else {
            update.price = product.price;
            changes.push(`${label} : prix ${oldPrice} -> ${product.price}`);
          }
        }
        const ean = digits(offer.products_catalog?.ean);
        if (ean && product.gtin && ean !== product.gtin) {
          alerts.push(`${label} : code-barres différent (fiche ${ean}, marchand ${product.gtin})`);
        }
      }
      checked++;
      if (!dry) {
        update.last_synced_at = new Date().toISOString();
        const { error: upErr } = await supabase.from('product_offers').update(update).eq('id', offer.id);
        if (upErr) alerts.push(`${label} : enregistrement impossible (${upErr.message})`);
      }
    } catch (e) {
      unreadable.push(`${label} : ${e instanceof Error ? e.name : 'erreur'}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const total = data?.length ?? 0;
  // Email seulement s'il y a du nouveau, ou si la moitié des pages ne se lit plus (marchand qui bloque)
  const blocked = total > 0 && unreadable.length * 2 >= total;
  if (!dry && (changes.length > 0 || blocked)) {
    const list = (items: string[]) => `<ul>${items.map(i => `<li>${i.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</li>`).join('')}</ul>`;
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Offres manuelles - ${changes.length} changement${changes.length > 1 ? 's' : ''}`,
      html: cronEmailWrapper('Offres ajoutées à la main', 'Boutique', [
        changes.length ? sectionBlock('Changements', list(changes)) : '',
        alerts.length ? sectionBlock('À vérifier', list(alerts)) : '',
        unreadable.length ? sectionBlock('Non vérifiées', list(unreadable)) : '',
      ].join('')),
    }).catch(e => console.error('[manual-offers] email:', e));
  }
  if (!dry) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: `[Boutique V2] Offres manuelles vérifiées : ${checked}/${total}, ${changes.length} changement(s)`,
      details: { changes, alerts, unreadable },
      status: blocked ? 'error' : 'success',
    });
  }

  return NextResponse.json({ success: !blocked, dry, total, checked, changes, alerts, unreadable });
}
