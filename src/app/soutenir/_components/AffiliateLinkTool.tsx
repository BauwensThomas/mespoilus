'use client';

import { useState } from 'react';
import { Sparkles, Copy, ExternalLink, Check, AlertCircle, Heart } from 'lucide-react';
import { buildAwinDeepLink } from '@/lib/awin-link';

// Compte France uniquement : le compte amazon.com.be a été fermé le 27/11/2026 pour inactivité.
// Les liens Amazon Belgique sont convertis vers amazon.fr (même code produit, livraison en Belgique).
const AMAZON_TAG_FR = 'mespoilus-21';
const CPC_PUBLISHER_SID = '101746286';
const CPC_ADVERTISER_ID = '17287368';

type Result = { url: string; merchant: string } | { error: string };

function generate(rawUrl: string): Result {
  let host = '';
  try { host = new URL(rawUrl).hostname.toLowerCase(); }
  catch { return { error: "Ce n'est pas un lien valide. Copiez l'adresse complète depuis votre navigateur." }; }

  // Amazon
  if (host.includes('amazon.')) {
    const match = rawUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/) ||
                  rawUrl.match(/amazon\.[a-z.]+\/([A-Z0-9]{10})(?:[/?]|$)/);
    if (match) return { url: `https://www.amazon.fr/dp/${match[1]}?tag=${AMAZON_TAG_FR}`, merchant: 'Amazon France' };
    if (!host.endsWith('amazon.fr')) return { error: 'Lien Amazon non reconnu. Ouvrez la page du produit et copiez son adresse.' };
    try {
      const u = new URL(rawUrl);
      u.searchParams.set('tag', AMAZON_TAG_FR);
      return { url: u.toString(), merchant: 'Amazon France' };
    } catch { return { error: 'Lien Amazon non reconnu.' }; }
  }

  // CanadaPetCare
  if (host.includes('canadapetcare.com')) {
    return { url: `https://www.jdoqocy.com/click-${CPC_PUBLISHER_SID}-${CPC_ADVERTISER_ID}?url=${encodeURIComponent(rawUrl)}`, merchant: 'CanadaPetCare' };
  }

  // Partenaires Awin (Maxi Zoo, Zooplus, Tuft & Paw, Dogfy Diet) : vrai lien de suivi Awin
  const awin = buildAwinDeepLink(rawUrl);
  if (awin) return { url: awin.url, merchant: awin.merchant.label };

  return { error: "Ce marchand n'est pas encore partenaire de Mes Poilus. Marchands pris en charge : Amazon, Maxi Zoo, Zooplus Belgique, Dogfy Diet, CanadaPetCare, Tuft & Paw." };
}

export default function AffiliateLinkTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    if (!input.trim()) return;
    setResult(generate(input.trim()));
    setCopied(false);
  }

  async function copy() {
    if (!result || 'error' in result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 sm:p-6">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Collez le lien du produit (Amazon, Maxi Zoo, Zooplus Belgique, Dogfy Diet, CanadaPetCare, Tuft & Paw)
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
          placeholder="https://www.amazon.fr/dp/..."
          className="flex-1 h-11 px-4 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
        />
        <button
          onClick={handleGenerate}
          disabled={!input.trim()}
          className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Sparkles size={15} />
          Générer le lien
        </button>
      </div>

      {result && 'error' in result && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}

      {result && !('error' in result) && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
              <Check size={13} /> Lien {result.merchant} prêt
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={copy}
                className="h-8 px-3 rounded-lg bg-white border border-orange-200 text-gray-700 text-xs font-medium hover:border-orange-400 transition-colors flex items-center gap-1.5"
              >
                {copied ? <><Check size={12} className="text-green-600" /> Copié !</> : <><Copy size={12} /> Copier</>}
              </button>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={12} /> Ouvrir
              </a>
            </div>
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-xs text-blue-600 break-all hover:underline font-mono"
          >
            {result.url}
          </a>
          <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
            <Heart size={12} className="text-orange-400 shrink-0" />
            En achetant via ce lien, une petite commission revient à Mes Poilus - sans aucun surcoût pour vous. Merci !
          </p>
        </div>
      )}
    </div>
  );
}
