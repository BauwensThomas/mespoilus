'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, CheckCircle, Sparkles } from 'lucide-react';

const CPC_PUBLISHER_SID = '101746286';
const CPC_ADVERTISER_ID = '17287368';
const AMAZON_TAG = 'mespoilus-21';

function randHex(len = 32) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const MERCHANT_CONFIGS: Record<string, { params: Record<string, string>; awcChannel: string }> = {
  'Maxi Zoo BE': {
    awcChannel: '68696',
    params: {
      utm_medium: 'public_affiliates', utm_source: 'awin',
      utm_campaign: 'www.mespoilus.com', 'utm_placement': 'Content+Tier',
      'utm_term': '2885973-', sv1: 'affiliate', sv_campaign_id: '2885973!',
    },
  },
  'Maxi Zoo FR': {
    awcChannel: '68698',
    params: {
      utm_medium: 'public_affiliates', utm_source: 'awin',
      utm_campaign: 'www.mespoilus.com', utm_content: '0',
      utm_placement: 'ContentTier', utm_term: '2885973-',
      sv1: 'affiliate', sv_campaign_id: '2885973',
    },
  },
  'Tuft & Paw': {
    awcChannel: '59149',
    params: {
      sv1: 'affiliate', sv_campaign_id: '2885973',
      utm_source: 'shareasale', utm_medium: 'affiliate',
      utm_campaign: '2885973_0',
    },
  },
};

function buildAffiliateUrl(rawUrl: string, merchantName: string, awinTemplates: Record<string, string>): string {
  if (!rawUrl) return rawUrl;
  if (isAffiliateUrl(rawUrl)) return rawUrl;

  const lm = merchantName.toLowerCase();
  const lu = rawUrl.toLowerCase();

  // Amazon - détecte FR vs BE
  if (lm.includes('amazon') || lu.includes('amazon.')) {
    const isBE = lm.includes(' be') || lu.includes('amazon.be') || lu.includes('amazon.com.be');
    const tag = isBE ? 'mespoilusbe-21' : AMAZON_TAG;
    const domain = isBE ? 'amazon.be' : 'amazon.fr';
    const match = rawUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/) ||
                  rawUrl.match(/amazon\.[a-z.]+\/([A-Z0-9]{10})(?:[/?]|$)/);
    if (match) return `https://www.${domain}/dp/${match[1]}?tag=${tag}`;
    try {
      const u = new URL(rawUrl);
      u.searchParams.set('tag', tag);
      return u.toString();
    } catch { return rawUrl; }
  }

  // CanadaPetCare → CJ deep link
  if (lm.includes('canada')) {
    return `https://www.jdoqocy.com/click-${CPC_PUBLISHER_SID}-${CPC_ADVERTISER_ID}?url=${encodeURIComponent(rawUrl)}`;
  }

  // Marchands avec config hardcodée (Maxi Zoo BE/FR, Tuft & Paw)
  const config = MERCHANT_CONFIGS[merchantName];
  if (config) {
    try {
      const dest = new URL(rawUrl);
      Object.entries(config.params).forEach(([k, v]) => dest.searchParams.set(k, v));
      const ts = Math.floor(Date.now() / 1000).toString();
      dest.searchParams.set('awc', `${config.awcChannel}_${ts}_${randHex()}`);
      if (merchantName === 'Tuft & Paw') {
        dest.searchParams.set('sscid', `${config.awcChannel}_${ts}_${randHex()}`);
      }
      return dest.toString();
    } catch { /* fall through */ }
  }

  // Fallback : template Awin depuis la base
  const template = awinTemplates[merchantName];
  if (template?.includes('awin1.com')) {
    const mid = template.match(/awinmid=(\d+)/)?.[1];
    const affid = template.match(/awinaffid=(\d+)/)?.[1];
    if (mid && affid) {
      return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${affid}&ued=${encodeURIComponent(rawUrl)}`;
    }
  }

  return rawUrl;
}

function isAffiliateUrl(url: string): boolean {
  return url.includes('awin1.com') || url.includes('jdoqocy.com') ||
    url.includes('tag=mespoilus') || url.includes('utm_source=awin') ||
    url.includes('utm_source=shareasale') || url.includes('awc=');
}

export default function AddOfferButton({
  catalogId, merchants, awinTemplates,
}: {
  catalogId: string;
  merchants: string[];
  awinTemplates: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ affiliate_url: '', price: '', currency: 'EUR', merchant_name: '' });
  const [error, setError] = useState('');

  function applyAffiliation(url: string, merchant: string) {
    if (!url || !merchant || isAffiliateUrl(url)) return url;
    return buildAffiliateUrl(url, merchant, awinTemplates);
  }

  function handleUrlBlur() {
    if (!form.affiliate_url || !form.merchant_name) return;
    setError('');
    const lm = form.merchant_name.toLowerCase();
    const hasConfig = !!MERCHANT_CONFIGS[form.merchant_name];
    const hasTemplate = !!awinTemplates[form.merchant_name];
    const isKnown = hasConfig || hasTemplate || lm.includes('amazon') || lm.includes('canada');
    if (!isKnown) {
      setError(`Marchand non configuré : "${form.merchant_name}"`);
      return;
    }
    const built = applyAffiliation(form.affiliate_url, form.merchant_name);
    if (built !== form.affiliate_url) {
      setForm(f => ({ ...f, affiliate_url: built }));
    } else {
      setError(`Transformation échouée - URL inchangée`);
    }
  }

  function handleMerchantChange(merchant: string) {
    setForm(f => ({
      ...f,
      merchant_name: merchant,
      affiliate_url: isAffiliateUrl(f.affiliate_url) ? '' : f.affiliate_url,
    }));
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.affiliate_url || !form.merchant_name) { setError('URL et marchand requis'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/boutique/add-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalog_id: catalogId,
        affiliate_url: form.affiliate_url,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        merchant_name: form.merchant_name,
      }),
    });
    if (res.ok) {
      setOpen(false);
      setForm({ affiliate_url: '', price: '', currency: 'EUR', merchant_name: '' });
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Erreur');
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Ajouter une offre manuellement"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
      >
        <Plus size={12} />
        Ajouter URL
      </button>
    );
  }

  const affiliated = isAffiliateUrl(form.affiliate_url);

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl min-w-80">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-blue-800">Offre manuelle</span>
        <button type="button" onClick={() => setOpen(false)} className="text-blue-400 hover:text-blue-700">
          <X size={14} />
        </button>
      </div>

      <select
        value={form.merchant_name}
        onChange={e => handleMerchantChange(e.target.value)}
        className="w-full text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
        required
      >
        <option value="">-- Marchand --</option>
        {merchants.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <div className="flex gap-1.5">
        <input
          type="url"
          placeholder="https://... (colle l'URL directe)"
          value={form.affiliate_url}
          onChange={e => setForm(f => ({ ...f, affiliate_url: e.target.value }))}
          className={`flex-1 min-w-0 text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none ${
            affiliated ? 'border-green-400 bg-green-50' : 'border-blue-200 focus:border-blue-500'
          }`}
          required
        />
        {affiliated
          ? <CheckCircle size={22} className="shrink-0 text-green-500 self-center" />
          : (
            <button
              type="button"
              onClick={handleUrlBlur}
              disabled={!form.affiliate_url || !form.merchant_name}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Sparkles size={11} />
              Générer
            </button>
          )
        }
      </div>

      {affiliated && (
        <p className="text-[10px] text-green-700">✓ Lien affilié prêt</p>
      )}
      {form.affiliate_url && !affiliated && form.merchant_name && (
        <p className="text-[10px] text-amber-700">⚠ Marchand non reconnu - lien sans affiliation</p>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Prix (optionnel)"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          step="0.01" min="0"
          className="flex-1 text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
        />
        <select
          value={form.currency}
          onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
          className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
        >
          <option>EUR</option><option>USD</option><option>GBP</option><option>CAD</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Ajouter et épingler
      </button>
    </form>
  );
}
