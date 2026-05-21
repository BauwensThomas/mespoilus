'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Dog, Cat, Bird, Mouse, Zap, Flame, ShoppingBag, Clipboard, Rocket, CheckCircle2, XCircle, Clock, BookOpen, Mail, Sparkles, Heart, ChevronDown, ChevronUp, Send, Tag, ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { PARTENAIRES } from '@/lib/partenaires';

const ANIMALS = [
  { value: 'auto-smart',  label: 'Auto (moins utilisée)', icon: Sparkles },
  { value: 'chiens',      label: 'Chiens', icon: Dog },
  { value: 'chats',       label: 'Chats', icon: Cat },
  { value: 'oiseaux',     label: 'Oiseaux', icon: Bird },
  { value: 'rongeurs',    label: 'Rongeurs', icon: Mouse },
  { value: 'reptiles',    label: 'Reptiles', icon: Zap },
];

const ARTICLE_TYPES = [
  { value: '',            label: 'Auto (rotation)', icon: RefreshCw },
  { value: 'trending',   label: 'Trending / Actualité', icon: Flame },
  { value: 'affiliation', label: 'Partenaire / Produit', icon: ShoppingBag },
  { value: 'pratique',   label: 'Conseil pratique', icon: Clipboard },
  { value: 'race',       label: 'Fiche de race', icon: BookOpen },
  { value: 'best_of',   label: 'Sélection produits', icon: Rocket },
];

type StepStatus = 'idle' | 'running' | 'done' | 'error';


// ─── Config crons génériques ──────────────────────────────────────────────────

interface CronConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  color: string;
  borderColor: string;
  steps: Array<{ key: string; label: string; waitAfterMs?: number; }>;
}

const CRONS: CronConfig[] = [
  {
    id: 'content',
    label: 'SEO + Blog + Réseaux',
    description: 'Lucas (mots-clés) → Marie (article) → Emma (post Facebook)',
    icon: BookOpen,
    color: 'text-purple-600',
    borderColor: 'border-purple-400/30',
    steps: [
      { key: 'blog',   label: 'Blog (Lucas + Marie)', waitAfterMs: 35000 },
      { key: 'social', label: 'Réseaux (Emma → Facebook)' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Antoine génère le rapport financier mensuel',
    icon: Clipboard,
    color: 'text-teal-600',
    borderColor: 'border-teal-400/30',
    steps: [{ key: 'finance', label: 'Rapport financier (Antoine)' }],
  },
  {
    id: 'security',
    label: 'Sécurité & Maintenance',
    description: 'Nathalie (audit sécurité) + Maxime (audit technique)',
    icon: Zap,
    color: 'text-red-500',
    borderColor: 'border-red-400/30',
    steps: [{ key: 'security', label: 'Audit sécurité + technique (Nathalie + Maxime)' }],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Sofia crée la newsletter avec les derniers articles',
    icon: Mail,
    color: 'text-rose-600',
    borderColor: 'border-rose-400/30',
    steps: [{ key: 'newsletter', label: 'Newsletter (Sofia)' }],
  },
  {
    id: 'prenoms',
    label: 'Prénoms animaux',
    description: 'Thomas génère les 50 meilleurs prénoms par catégorie (Haiku)',
    icon: Sparkles,
    color: 'text-orange-500',
    borderColor: 'border-orange-400/30',
    steps: [{ key: 'prenoms', label: 'Génération prénoms (Thomas × 5 animaux)' }],
  },
  {
    id: 'adoption-social',
    label: 'Adoption — Réseaux',
    description: 'Emma publie un post sur les dernières annonces d\'adoption',
    icon: Heart,
    color: 'text-rose-500',
    borderColor: 'border-rose-400/30',
    steps: [{ key: 'adoption-social', label: 'Post adoption (Emma → Facebook + Instagram)' }],
  },
  {
    id: 'breeds',
    label: 'Fiches races',
    description: 'Génère les 10 prochaines fiches races (Haiku) — à relancer jusqu\'à 120 fiches',
    icon: Sparkles,
    color: 'text-teal-600',
    borderColor: 'border-teal-400/30',
    steps: [{ key: 'breeds', label: 'Génération fiches races (Haiku × 10)' }],
  },
  {
    id: 'daily-recap',
    label: 'Récap quotidien',
    description: 'Envoie le récap du jour par email à contact@mespoilus.com',
    icon: Send,
    color: 'text-sky-600',
    borderColor: 'border-sky-400/30',
    steps: [{ key: 'daily-recap', label: 'Email récap (tous les logs du jour)' }],
  },
];

// ─── Hook crons génériques ────────────────────────────────────────────────────

interface CronState {
  status: StepStatus;
  currentStep: number;
  countdown: number;
  error: string;
}

function useCronRunner() {
  const [states, setStates] = useState<Record<string, CronState>>({});

  function getState(id: string): CronState {
    return states[id] ?? { status: 'idle', currentStep: 0, countdown: 0, error: '' };
  }

  function setState(id: string, patch: Partial<CronState>) {
    setStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? { status: 'idle', currentStep: 0, countdown: 0, error: '' }), ...patch } }));
  }

  async function run(cron: CronConfig, selectedAnimal: string, selectedType: string, selectedPartner: string, selectedPromo: string, selectedProductName: string, selectedProductUrl: string, selectedImage: string) {
    const id = cron.id;
    if (getState(id).status === 'running') return;
    setState(id, { status: 'running', currentStep: 0, error: '' });

    for (let i = 0; i < cron.steps.length; i++) {
      const step = cron.steps[i];
      setState(id, { currentStep: i });

      try {
        const body: Record<string, string> = { step: step.key };
        if (step.key === 'blog') {
          if (selectedAnimal === 'auto-smart') body.auto = 'true';
          else if (selectedAnimal) body.animal = selectedAnimal;
          if (selectedType) body.type = selectedType;
          if (selectedPartner) {
            const p = PARTENAIRES.find(p => p.id === selectedPartner);
            if (p) body.partner = p.nom;
          }
          if (selectedProductName) body.productName = selectedProductName;
          if (selectedProductUrl) body.productUrl = selectedProductUrl;
          if (selectedPromo) body.promo = selectedPromo;
          if (selectedImage) body.forcedImage = selectedImage;
        }
        if (step.key === 'newsletter') {
          body.bypass = 'true';
        }
        const r = await fetch('/api/admin/run-cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      } catch (err) {
        setState(id, { status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' });
        return;
      }

      if (step.waitAfterMs && i < cron.steps.length - 1) {
        let remaining = Math.ceil(step.waitAfterMs / 1000);
        setState(id, { countdown: remaining });
        await new Promise<void>(resolve => {
          const interval = setInterval(() => {
            remaining--;
            setState(id, { countdown: remaining });
            if (remaining <= 0) { clearInterval(interval); resolve(); }
          }, 1000);
        });
      }
    }
    setState(id, { status: 'done' });
  }

  function reset(id: string) {
    setState(id, { status: 'idle', currentStep: 0, countdown: 0, error: '' });
  }

  return { getState, run: (cron: CronConfig, animal: string, type: string, partner: string, promo: string, productName: string, productUrl: string, image: string) => run(cron, animal, type, partner, promo, productName, productUrl, image), reset };
}


// ─── Composant ForcedPartnerPanel ────────────────────────────────────────────

interface ForcedPartnerPanelProps {
  partner: string;
  productName: string;
  productUrl: string;
  promo: string;
  forcedImage: string;
  onPartnerChange: (v: string) => void;
  onProductChange: (name: string, url: string) => void;
  onPromoChange: (v: string) => void;
  onForcedImageChange: (v: string) => void;
  disabled: boolean;
}

interface ProductRow {
  name: string;
  affiliate_url: string;
  price: number;
  category: string;
  merchant_name: string;
}

function ForcedPartnerPanel({ partner, productName, productUrl, promo, forcedImage, onPartnerChange, onProductChange, onPromoChange, onForcedImageChange, disabled }: ForcedPartnerPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const selectedPartenaire = PARTENAIRES.find(p => p.id === partner);
  const merchantKeyword = selectedPartenaire?.merchantKeyword ?? '';

  useEffect(() => {
    if (!merchantKeyword) { setProducts([]); return; }
    setLoadingProducts(true);
    fetch('/api/admin/run-cron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'partner-products', partner: merchantKeyword }),
    })
      .then(r => r.json())
      .then(data => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [merchantKeyword]);

  const handlePartnerChange = (id: string) => {
    onPartnerChange(id);
    onProductChange('', '');
    onPromoChange('');
    setProducts([]);
    setSearch('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await r.json();
      if (data.url) { onForcedImageChange(data.url); setImageUrlInput(''); }
    } catch {}
    finally { setUploadingImage(false); e.target.value = ''; }
  };

  const handleImageUrlConfirm = () => {
    if (imageUrlInput.trim()) { onForcedImageChange(imageUrlInput.trim()); setImageUrlInput(''); }
  };

  const filteredProducts = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const active = !!partner;

  return (
    <div className={clsx('border rounded-lg overflow-hidden', active ? 'border-purple-300' : 'border-gray-200')}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={clsx(
          'w-full flex items-center justify-between px-2.5 py-2 transition-colors',
          active ? 'bg-purple-50 hover:bg-purple-100' : 'bg-gray-50 hover:bg-gray-100'
        )}
      >
        <span className={clsx('text-xs font-medium flex items-center gap-1.5 min-w-0 flex-1', active ? 'text-purple-700' : 'text-gray-500')}>
          <Tag size={12} strokeWidth={1.5} className="flex-shrink-0" />
          {active && selectedPartenaire ? (
            <span className="truncate">
              {selectedPartenaire.emoji} {selectedPartenaire.nom}
              {productName ? ` — ${productName}` : ''}
              {promo ? ' + promo' : ''}
            </span>
          ) : 'Forcer un partenaire (optionnel)'}
        </span>
        {expanded
          ? <ChevronUp size={13} className={clsx('flex-shrink-0', active ? 'text-purple-400' : 'text-gray-400')} />
          : <ChevronDown size={13} className={clsx('flex-shrink-0', active ? 'text-purple-400' : 'text-gray-400')} />}
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 pt-2 flex flex-col gap-2 bg-white">
          {/* Sélecteur partenaire */}
          <select
            value={partner}
            onChange={e => handlePartnerChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50"
          >
            <option value="">Aucun (auto)</option>
            {PARTENAIRES.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.nom}</option>
            ))}
          </select>

          {/* Liste produits sélectionnable */}
          {partner && (
            loadingProducts ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                Chargement produits…
              </div>
            ) : products.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {products.length} produit{products.length > 1 ? 's' : ''} — choisir un à mettre en avant :
                  </p>
                </div>
                {/* Recherche */}
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-400 placeholder-gray-400"
                />
                <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {/* Option "aucun produit spécifique" */}
                  {!search && (
                    <button
                      type="button"
                      onClick={() => onProductChange('', '')}
                      disabled={disabled}
                      className={clsx(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors',
                        !productName ? 'bg-purple-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <span className={clsx('w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center',
                        !productName ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      )}>
                        {!productName && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-xs text-gray-500 italic">Aucun produit spécifique</span>
                    </button>
                  )}
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2.5 py-2">Aucun résultat</p>
                  ) : filteredProducts.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onProductChange(p.name, p.affiliate_url)}
                      disabled={disabled}
                      className={clsx(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors',
                        productUrl === p.affiliate_url ? 'bg-purple-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <span className={clsx('w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center',
                        productUrl === p.affiliate_url ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      )}>
                        {productUrl === p.affiliate_url && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-xs text-gray-700 flex-1" style={{ wordBreak: 'break-word' }}>{p.name}</span>
                      {p.price > 0 && <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{p.price}€</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Aucun produit en boutique pour ce partenaire</p>
            )
          )}

          {/* Codes promo */}
          <input
            type="text"
            value={promo}
            onChange={e => onPromoChange(e.target.value)}
            disabled={disabled}
            placeholder="Codes promo (ex: ESSENTIALS20 -20% litière, NEWHOME25 -25% meubles)"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50 placeholder-gray-400"
          />

          {/* Image forcée */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-400">Image de l'article (optionnel)</p>
            {forcedImage ? (
              <div className="flex items-center gap-2">
                <img
                  src={forcedImage}
                  alt=""
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0 bg-gray-100"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.add('!flex'); }}
                />
                <div className="hidden items-center justify-center w-12 h-12 rounded-lg border border-red-200 bg-red-50 flex-shrink-0 text-red-400 text-[10px] text-center leading-tight px-1">
                  URL invalide
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{forcedImage.split('/').pop()}</p>
                  <button
                    type="button"
                    onClick={() => onForcedImageChange('')}
                    className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleImageUrlConfirm()}
                    disabled={disabled || uploadingImage}
                    placeholder="Coller une URL d'image…"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-400 disabled:opacity-50 placeholder-gray-400"
                  />
                  {imageUrlInput && (
                    <button
                      type="button"
                      onClick={handleImageUrlConfirm}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 flex-shrink-0"
                    >
                      OK
                    </button>
                  )}
                </div>
                <label className={clsx(
                  'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed text-xs transition-colors cursor-pointer',
                  uploadingImage ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                )}>
                  {uploadingImage
                    ? <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />Upload…</>
                    : <>Importer depuis l'ordinateur</>}
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={disabled || uploadingImage} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant ContentCronPanel ──────────────────────────────────────────────

type RunFn = (cron: CronConfig, animal: string, type: string, partner: string, promo: string, productName: string, productUrl: string, image: string) => void;

interface ContentCronPanelProps {
  cron: CronConfig;
  state: CronState;
  run: RunFn;
  onReset: () => void;
}

function ContentCronPanel({ cron, state, run, onReset }: ContentCronPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('auto-smart');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [selectedProductUrl, setSelectedProductUrl] = useState('');
  const [selectedPromo, setSelectedPromo] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  const isRunning = state.status === 'running';
  const isWaiting = isRunning && state.countdown > 0;
  const step = cron.steps[state.currentStep];

  const handleRun = () => {
    if (state.status === 'idle' || state.status === 'error') {
      run(cron, selectedAnimal, selectedType, selectedPartner, selectedPromo, selectedProductName, selectedProductUrl, selectedImage);
    }
  };

  return (
    <div className="px-4 py-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <cron.icon size={18} strokeWidth={1.5} className={clsx('mt-0.5 flex-shrink-0', cron.color)} />
          <div className="min-w-0">
            <p className={clsx('text-sm font-semibold', cron.color)}>{cron.label}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{cron.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
              state.status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-default'
                : state.status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
                : isRunning ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            )}
          >
            {state.status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />OK</>}
            {state.status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
            {isRunning && isWaiting && <><Clock size={14} strokeWidth={1.5} />{state.countdown}s</>}
            {isRunning && !isWaiting && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
            {state.status === 'idle' && 'Lancer'}
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Statut */}
      {isRunning && (
        <p className="text-xs text-amber-600 mt-1.5 ml-7">
          {isWaiting ? `Pause ${state.countdown}s avant la prochaine étape…` : `${step?.label ?? '…'}`}
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-xs text-red-500 mt-1.5 ml-7 truncate" title={state.error}>{state.error}</p>
      )}
      {state.status === 'done' && (
        <div className="flex items-center gap-3 mt-1 ml-7">
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-700">Réinitialiser</button>
        </div>
      )}

      {/* Options (replié par défaut) */}
      {expanded && (
        <div className="mt-2.5 ml-7 flex flex-col gap-2">
          <select
            value={selectedAnimal}
            onChange={e => setSelectedAnimal(e.target.value)}
            disabled={isRunning}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          >
            {ANIMALS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            disabled={isRunning}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          >
            {ARTICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ForcedPartnerPanel
            partner={selectedPartner}
            productName={selectedProductName}
            productUrl={selectedProductUrl}
            promo={selectedPromo}
            forcedImage={selectedImage}
            onPartnerChange={setSelectedPartner}
            onProductChange={(name, url) => { setSelectedProductName(name); setSelectedProductUrl(url); }}
            onPromoChange={setSelectedPromo}
            onForcedImageChange={setSelectedImage}
            disabled={isRunning}
          />
        </div>
      )}
    </div>
  );
}


// ─── Translate Catalog Panel ─────────────────────────────────────────────────

function TranslatePanel() {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [result, setResult] = useState<string>('');

  const launch = async () => {
    if (status === 'running') return;
    setStatus('running');
    setResult('');
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'catalog-sync-translate' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      setResult(`${(data.translatedNames ?? 0)} noms + ${data.translatedDescs ?? 0} desc traduits`);
      setStatus('done');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur');
      setStatus('error');
    }
  };

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Sparkles size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-violet-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-violet-600">Traduction EN→FR (Haiku)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {status === 'running' ? 'Traduction en cours (Claude Haiku)…'
                : status === 'done' ? `✓ ${result}`
                : status === 'error' ? result
                : 'Traduit les noms EN des produits Tuft & Paw / CanadaPetCare'}
            </p>
          </div>
        </div>
        <button
          onClick={status === 'done' ? () => { setStatus('idle'); setResult(''); } : launch}
          disabled={status === 'running'}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
            status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-pointer'
              : status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
              : status === 'running' ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer'
          )}
        >
          {status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />Reset</>}
          {status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
          {status === 'running' && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
          {status === 'idle' && 'Lancer'}
        </button>
      </div>
    </div>
  );
}

// ─── Dedup EAN Panel ─────────────────────────────────────────────────────────

function DedupEanPanel() {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [result, setResult] = useState<string>('');

  const launch = async () => {
    if (status === 'running') return;
    setStatus('running');
    setResult('');
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'catalog-dedup-ean' }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
      const merged = data.merged ?? 0;
      const deleted = data.deleted ?? 0;
      const groups = data.eanGroups ?? 0;
      if (merged === 0) {
        setResult('Aucun doublon EAN trouve');
      } else {
        setResult(`${groups} EAN dupliques — ${deleted} fiches supprimees`);
      }
      setStatus('done');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur');
      setStatus('error');
    }
  };

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Tag size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-sky-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sky-600">Dedup EAN (Phase 3)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {status === 'running' ? 'Recherche et fusion des doublons EAN…'
                : status === 'done' ? `✓ ${result}`
                : status === 'error' ? result
                : 'Fusionne les fiches catalog avec le meme EAN'}
            </p>
          </div>
        </div>
        <button
          onClick={status === 'done' ? () => { setStatus('idle'); setResult(''); } : launch}
          disabled={status === 'running'}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
            status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-pointer'
              : status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
              : status === 'running' ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer'
          )}
        >
          {status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />Reset</>}
          {status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
          {status === 'running' && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
          {status === 'idle' && 'Lancer'}
        </button>
      </div>
    </div>
  );
}

// ─── Dedup Title Panel ───────────────────────────────────────────────────────

function DedupTitlePanel() {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [result, setResult] = useState<string>('');

  const launch = async () => {
    if (status === 'running') return;
    setStatus('running');
    setResult('');
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'catalog-dedup-title' }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
      const deleted = data.deleted ?? 0;
      const groups = data.groups ?? 0;
      if (deleted === 0) {
        setResult('Aucun doublon titre+marque+poids trouve');
      } else {
        setResult(`${groups} groupes — ${deleted} fiches supprimees`);
      }
      setStatus('done');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur');
      setStatus('error');
    }
  };

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Tag size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-indigo-600">Dedup Titre (Phase 3)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {status === 'running' ? 'Recherche des doublons titre+marque+poids…'
                : status === 'done' ? `✓ ${result}`
                : status === 'error' ? result
                : 'Fusionne les fiches avec titre + marque + poids identiques'}
            </p>
          </div>
        </div>
        <button
          onClick={status === 'done' ? () => { setStatus('idle'); setResult(''); } : launch}
          disabled={status === 'running'}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
            status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-pointer'
              : status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
              : status === 'running' ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer'
          )}
        >
          {status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />Reset</>}
          {status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
          {status === 'running' && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
          {status === 'idle' && 'Lancer'}
        </button>
      </div>
    </div>
  );
}

// ─── Compress Hero Images Panel ──────────────────────────────────────────────

function CompressHeroImagesPanel() {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [result, setResult] = useState<string>('');

  const launch = async () => {
    if (status === 'running') return;
    setStatus('running');
    setResult('');
    try {
      const r = await fetch('/api/admin/compress-hero-images');
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      setResult(`${data.compressed}/${data.total} compressées — ${data.saved}`);
      setStatus('done');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur');
      setStatus('error');
    }
  };

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <ImageIcon size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-sky-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sky-600">Compression images hero</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {status === 'running' ? 'Compression en cours (~2 min)…'
                : status === 'done' ? `✓ ${result}`
                : status === 'error' ? result
                : 'Sharp · max 1200px · JPEG 80% · À relancer après ajout de photos'}
            </p>
          </div>
        </div>
        <button
          onClick={status === 'done' ? () => { setStatus('idle'); setResult(''); } : launch}
          disabled={status === 'running'}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
            status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-pointer'
              : status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
              : status === 'running' ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer'
          )}
        >
          {status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />Reset</>}
          {status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
          {status === 'running' && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
          {status === 'idle' && 'Lancer'}
        </button>
      </div>
    </div>
  );
}

// ─── Catalog Sync V2 Panel ───────────────────────────────────────────────────

const CATALOG_CATEGORIES = [
  { key: 'chiens',           label: 'Chiens',   icon: '🐶' },
  { key: 'chats',            label: 'Chats',    icon: '🐱' },
  { key: 'oiseaux',          label: 'Oiseaux',  icon: '🐦' },
  { key: 'rongeurs',         label: 'Rongeurs', icon: '🐹' },
  { key: 'reptiles',         label: 'Reptiles', icon: '🦎' },
  { key: 'livres',           label: 'Livres',   icon: '📚' },
  { key: 'general',          label: 'Général',  icon: '🐾' },
  { key: 'canada-pet-care',  label: 'CPC',      icon: '🇨🇦' },
] as const;

type CatalogCategory = typeof CATALOG_CATEGORIES[number]['key'];

interface CatalogCatState {
  status: 'idle' | 'running' | 'done' | 'error';
  inserted: number;
  updated: number;
  error: string | null;
}

function CatalogSyncPanel() {
  const [states, setStates] = useState<Record<CatalogCategory, CatalogCatState>>(
    () => Object.fromEntries(
      CATALOG_CATEGORIES.map(c => [c.key, { status: 'idle', inserted: 0, updated: 0, error: null }])
    ) as Record<CatalogCategory, CatalogCatState>
  );
  const [expanded, setExpanded] = useState(false);

  const anyRunning = Object.values(states).some(s => s.status === 'running');
  const doneCount  = CATALOG_CATEGORIES.filter(c => states[c.key].status === 'done').length;
  const allDone    = doneCount === CATALOG_CATEGORIES.length;
  const totalInserted = Object.values(states).reduce((s, v) => s + v.inserted, 0);
  const totalUpdated  = Object.values(states).reduce((s, v) => s + v.updated, 0);

  const launchCategory = async (key: CatalogCategory) => {
    if (states[key].status === 'running') return;
    setStates(prev => ({ ...prev, [key]: { ...prev[key], status: 'running', error: null } }));
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: `catalog-sync-${key}` }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      setStates(prev => ({
        ...prev,
        [key]: { status: 'done', inserted: data.inserted ?? 0, updated: data.updated ?? 0, error: null },
      }));
    } catch (err) {
      setStates(prev => ({
        ...prev,
        [key]: { ...prev[key], status: 'error', error: err instanceof Error ? err.message : 'Erreur' },
      }));
    }
  };

  const launchAll = async () => {
    for (const cat of CATALOG_CATEGORIES) {
      await launchCategory(cat.key);
    }
  };

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <ShoppingBag size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-orange-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-orange-600">Catalog Sync V2</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {anyRunning
                ? 'Sync en cours…'
                : allDone
                ? `✓ ${totalInserted} nouvelles fiches · ${totalUpdated} offres màj`
                : 'Lit Awin/CPC directement → products_catalog + product_offers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={launchAll}
            disabled={anyRunning}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
              allDone
                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                : anyRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer'
            )}
          >
            {allDone
              ? <><CheckCircle2 size={14} strokeWidth={1.5} />OK</>
              : anyRunning
              ? <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>
              : 'Tout lancer'}
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {(anyRunning || doneCount > 0) && (
        <div className="mt-2 ml-7">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / CATALOG_CATEGORIES.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{doneCount}/{CATALOG_CATEGORIES.length}</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-2 ml-7 space-y-1.5">
          {CATALOG_CATEGORIES.map(cat => {
            const s = states[cat.key];
            return (
              <div key={cat.key} className="flex items-center gap-2">
                <span className="text-sm w-5">{cat.icon}</span>
                <span className="text-xs text-gray-600 w-16 flex-shrink-0">{cat.label}</span>
                <div className="flex-1 text-xs">
                  {s.status === 'running' && <span className="text-amber-600 flex items-center gap-1"><span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />En cours</span>}
                  {s.status === 'done' && <span className="text-emerald-600">+{s.inserted} fiches · {s.updated} màj</span>}
                  {s.status === 'error' && <span className="text-red-500 truncate" title={s.error ?? ''}>{s.error?.slice(0, 30)}</span>}
                  {s.status === 'idle' && <span className="text-gray-300">En attente</span>}
                </div>
                {(s.status === 'idle' || s.status === 'error') && (
                  <button
                    onClick={() => launchCategory(cat.key)}
                    className="text-xs text-gray-400 hover:text-orange-600 px-1.5 py-0.5 rounded hover:bg-orange-50 transition-colors flex-shrink-0"
                  >
                    {s.status === 'error' ? 'Retry' : 'Lancer'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CronLauncher() {
  const [open, setOpen] = useState(false);
  const { getState, run, reset } = useCronRunner();
  const contentCron = CRONS.find(c => c.id === 'content')!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
      >
        <Rocket size={16} strokeWidth={1.5} />
        Lancer un cron
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Pipelines manuels</p>
            <p className="text-xs text-gray-500 mt-0.5">Déclenche un pipeline immédiatement</p>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Cron SEO + Blog (composant dédié avec options repliables) */}
            <ContentCronPanel
              cron={contentCron}
              state={getState('content')}
              run={run}
              onReset={() => reset('content')}
            />

            {/* Autres crons génériques */}
            {CRONS.filter(c => c.id !== 'content').map(cron => {
              const state = getState(cron.id);
              const isRunning = state.status === 'running';
              const step = cron.steps[state.currentStep];
              const isWaiting = isRunning && state.countdown > 0;

              return (
                <div key={cron.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <cron.icon size={18} strokeWidth={1.5} className={clsx('mt-0.5 flex-shrink-0', cron.color)} />
                      <div className="min-w-0">
                        <p className={clsx('text-sm font-semibold', cron.color)}>{cron.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{cron.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => (state.status === 'idle' || state.status === 'error') ? run(cron, '', '', '', '', '', '', '') : undefined}
                      disabled={isRunning}
                      className={clsx(
                        'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                        state.status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-default'
                          : state.status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
                          : isRunning ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                      )}
                    >
                      {state.status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />OK</>}
                      {state.status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
                      {isRunning && isWaiting && <><Clock size={14} strokeWidth={1.5} />{state.countdown}s</>}
                      {isRunning && !isWaiting && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
                      {state.status === 'idle' && 'Lancer'}
                    </button>
                  </div>

                  {isRunning && (
                    <p className="text-xs text-amber-600 mt-1.5 ml-7">
                      {isWaiting ? `Pause ${state.countdown}s avant la prochaine étape…` : `${step?.label ?? '…'}`}
                    </p>
                  )}
                  {state.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1.5 ml-7 truncate" title={state.error}>{state.error}</p>
                  )}
                  {state.status === 'done' && (
                    <div className="flex items-center gap-3 mt-1 ml-7">
                      <button onClick={() => reset(cron.id)} className="text-xs text-gray-400 hover:text-gray-700">Réinitialiser</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Catalog Sync */}
            <CatalogSyncPanel />

            {/* Dedup EAN — fusion doublons catalog */}
            <DedupEanPanel />

            {/* Dedup titre — fusion doublons titre+marque+poids */}
            <DedupTitlePanel />

            {/* Traduction EN→FR (Haiku) */}
            <TranslatePanel />

            {/* Compression images hero (Sharp) */}
            <CompressHeroImagesPanel />
          </div>

          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-start gap-2">
            <Rocket size={14} strokeWidth={1.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Support client : pas de cron — Léa répond à la demande depuis sa page agent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
