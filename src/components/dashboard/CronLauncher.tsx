'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Dog, Cat, Bird, Mouse, Zap, Flame, ShoppingBag, Clipboard,
  Rocket, CheckCircle2, XCircle, BookOpen, Mail, Sparkles, Heart,
  ChevronDown, ChevronUp, Send, Tag, ImageIcon, X, Play, RotateCcw, MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';
import { PARTENAIRES } from '@/lib/partenaires';

// ─── Constants ────────────────────────────────────────────────────────────────

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

interface CronConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  group: string;
  steps: Array<{ key: string; label: string; waitAfterMs?: number }>;
}

const CRONS: CronConfig[] = [
  {
    id: 'content',
    label: 'SEO + Blog + Réseaux',
    description: 'Lucas analyse les mots-clés, Marie rédige l\'article, Emma publie sur Facebook.',
    icon: BookOpen,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    accentColor: 'border-purple-200',
    group: 'Contenu',
    steps: [
      { key: 'blog',   label: 'Blog (Lucas + Marie)', waitAfterMs: 70000 },
      { key: 'social', label: 'Réseaux (Emma → Facebook)' },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Sofia crée la newsletter avec les derniers articles publiés.',
    icon: Mail,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    accentColor: 'border-purple-200',
    group: 'Contenu',
    steps: [{ key: 'newsletter', label: 'Newsletter (Sofia)' }],
  },
  {
    id: 'prenoms',
    label: 'Prénoms animaux',
    description: 'Thomas génère les 50 meilleurs prénoms par catégorie via Claude Haiku.',
    icon: Sparkles,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accentColor: 'border-teal-200',
    group: 'Données',
    steps: [{ key: 'prenoms', label: 'Génération prénoms (Thomas × 5 animaux)' }],
  },
  {
    id: 'adoption-social',
    label: 'Adoption - Réseaux',
    description: 'Emma publie un post sur les dernières annonces d\'adoption (Facebook + Instagram).',
    icon: Heart,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    accentColor: 'border-purple-200',
    group: 'Contenu',
    steps: [{ key: 'adoption-social', label: 'Post adoption (Emma → Facebook + Instagram)' }],
  },
  {
    id: 'grille-social',
    label: 'Grille mystère - Réseaux',
    description: 'Emma publie l\'état actuel de la grille mystère (image + %) sur Facebook + Instagram.',
    icon: ImageIcon,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    accentColor: 'border-purple-200',
    group: 'Contenu',
    steps: [{ key: 'grille-social', label: 'Post grille (Emma → Facebook + Instagram)' }],
  },
  {
    id: 'grille-rotation',
    label: 'Grille mystère - Rotation',
    description: 'Termine les grilles expirées (compte à rebours) et active la suivante. Tourne automatiquement 1×/jour.',
    icon: RotateCcw,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    accentColor: 'border-slate-200',
    group: 'Maintenance',
    steps: [{ key: 'grille-rotation', label: 'Rotation des grilles' }],
  },
  {
    id: 'breeds',
    label: 'Fiches races',
    description: 'Génère les 10 prochaines fiches races via Claude Haiku. Relancer jusqu\'à 120 fiches.',
    icon: Sparkles,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accentColor: 'border-teal-200',
    group: 'Données',
    steps: [{ key: 'breeds', label: 'Génération fiches races (Haiku × 10)' }],
  },
  {
    id: 'security',
    label: 'Sécurité & Maintenance',
    description: 'Nathalie effectue l\'audit sécurité, Maxime l\'audit technique.',
    icon: Zap,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    accentColor: 'border-slate-200',
    group: 'Maintenance',
    steps: [{ key: 'security', label: 'Audit sécurité + technique (Nathalie + Maxime)' }],
  },
  {
    id: 'daily-recap',
    label: 'Récap quotidien',
    description: 'Envoie le récap du jour par email à contact@mespoilus.com.',
    icon: Send,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    accentColor: 'border-slate-200',
    group: 'Maintenance',
    steps: [{ key: 'daily-recap', label: 'Email récap (tous les logs du jour)' }],
  },
];

// ─── Hook crons ───────────────────────────────────────────────────────────────

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

  async function run(
    cron: CronConfig,
    selectedAnimal: string,
    selectedType: string,
    selectedPartner: string,
    selectedPromo: string,
    selectedProductName: string,
    selectedProductUrl: string,
    selectedImage: string,
  ) {
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
        if (step.key === 'newsletter') body.bypass = 'true';

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

  return {
    getState,
    run: (cron: CronConfig, animal: string, type: string, partner: string, promo: string, productName: string, productUrl: string, image: string) =>
      run(cron, animal, type, partner, promo, productName, productUrl, image),
    reset,
  };
}

// ─── ForcedPartnerPanel ───────────────────────────────────────────────────────

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
    <div className={clsx('border rounded-xl overflow-hidden', active ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200 bg-gray-50/50')}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-black/5"
      >
        <span className={clsx('text-xs font-medium flex items-center gap-1.5 min-w-0 flex-1', active ? 'text-purple-700' : 'text-gray-500')}>
          <Tag size={12} strokeWidth={1.5} className="flex-shrink-0" />
          {active && selectedPartenaire
            ? <span className="truncate">{selectedPartenaire.emoji} {selectedPartenaire.nom}{productName ? ` - ${productName}` : ''}{promo ? ' + promo' : ''}</span>
            : 'Forcer un partenaire (optionnel)'}
        </span>
        {expanded
          ? <ChevronUp size={13} className={clsx('flex-shrink-0', active ? 'text-purple-400' : 'text-gray-400')} />
          : <ChevronDown size={13} className={clsx('flex-shrink-0', active ? 'text-purple-400' : 'text-gray-400')} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 bg-white border-t border-gray-100">
          <select
            value={partner}
            onChange={e => handlePartnerChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50"
          >
            <option value="">Aucun (auto)</option>
            {PARTENAIRES.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.nom}</option>)}
          </select>

          {partner && (
            loadingProducts ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                Chargement produits…
              </div>
            ) : products.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-400 placeholder-gray-400"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {!search && (
                    <button type="button" onClick={() => onProductChange('', '')} disabled={disabled}
                      className={clsx('w-full flex items-center gap-2 px-2.5 py-1.5 text-left', !productName ? 'bg-purple-50' : 'hover:bg-gray-50')}>
                      <span className={clsx('w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center', !productName ? 'border-purple-500 bg-purple-500' : 'border-gray-300')}>
                        {!productName && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-xs text-gray-500 italic">Aucun produit spécifique</span>
                    </button>
                  )}
                  {filteredProducts.length === 0
                    ? <p className="text-xs text-gray-400 px-2.5 py-2">Aucun résultat</p>
                    : filteredProducts.map((p, i) => (
                      <button key={i} type="button" onClick={() => onProductChange(p.name, p.affiliate_url)} disabled={disabled}
                        className={clsx('w-full flex items-center gap-2 px-2.5 py-1.5 text-left', productUrl === p.affiliate_url ? 'bg-purple-50' : 'hover:bg-gray-50')}>
                        <span className={clsx('w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center', productUrl === p.affiliate_url ? 'border-purple-500 bg-purple-500' : 'border-gray-300')}>
                          {productUrl === p.affiliate_url && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-xs text-gray-700 flex-1">{p.name}</span>
                        {p.price > 0 && <span className="text-xs text-gray-400 flex-shrink-0">{p.price}€</span>}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Aucun produit pour ce partenaire</p>
            )
          )}

          <input
            type="text" value={promo} onChange={e => onPromoChange(e.target.value)} disabled={disabled}
            placeholder="Codes promo (ex: ESSENTIALS20 -20%)"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50 placeholder-gray-400"
          />

          <div className="space-y-1.5">
            {forcedImage ? (
              <div className="flex items-center gap-2">
                <img src={forcedImage} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0 bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{forcedImage.split('/').pop()}</p>
                  <button type="button" onClick={() => onForcedImageChange('')} className="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleImageUrlConfirm()}
                    disabled={disabled || uploadingImage}
                    placeholder="URL d'image…"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-purple-400 disabled:opacity-50 placeholder-gray-400"
                  />
                  {imageUrlInput && (
                    <button type="button" onClick={handleImageUrlConfirm} className="px-2 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200">OK</button>
                  )}
                </div>
                <label className={clsx('flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed text-xs transition-colors cursor-pointer',
                  uploadingImage ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-purple-200 text-purple-600 hover:bg-purple-50')}>
                  {uploadingImage
                    ? <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />Upload…</>
                    : 'Importer depuis l\'ordinateur'}
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

// ─── CronCard ─────────────────────────────────────────────────────────────────

type RunFn = (cron: CronConfig, animal: string, type: string, partner: string, promo: string, productName: string, productUrl: string, image: string) => void;

interface CronCardProps {
  cron: CronConfig;
  state: CronState;
  run: RunFn;
  onReset: () => void;
  exportHref?: string;
}

function CronCard({ cron, state, run, onReset, exportHref }: CronCardProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('auto-smart');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [selectedProductUrl, setSelectedProductUrl] = useState('');
  const [selectedPromo, setSelectedPromo] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  const isContent = cron.id === 'content';
  const isRunning = state.status === 'running';
  const isWaiting = isRunning && state.countdown > 0;
  const step = cron.steps[state.currentStep];
  const stepProgress = cron.steps.length > 1
    ? Math.round(((state.currentStep + (isWaiting ? 0.5 : 0)) / cron.steps.length) * 100)
    : isRunning ? 60 : 0;

  const handleRun = () => {
    if (state.status !== 'idle' && state.status !== 'error') return;
    run(cron, selectedAnimal, selectedType, selectedPartner, selectedPromo, selectedProductName, selectedProductUrl, selectedImage);
  };

  return (
    <div className={clsx(
      'bg-white border-2 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200',
      state.status === 'done' ? 'border-emerald-200 bg-emerald-50/30'
        : state.status === 'error' ? 'border-red-200 bg-red-50/20'
        : isRunning ? 'border-amber-200 bg-amber-50/20'
        : `${cron.accentColor} hover:shadow-md`,
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cron.iconBg)}>
          <cron.icon size={20} strokeWidth={1.5} className={cron.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm leading-snug">{cron.label}</p>
            {exportHref && (
              <a href={exportHref} download className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors flex-shrink-0">↓ CSV</a>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{cron.description}</p>
        </div>
      </div>

      {/* Progression */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs text-amber-700 font-medium truncate">
              {isWaiting ? `Pause ${state.countdown}s avant la prochaine étape…` : (step?.label ?? 'En cours…')}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
          {cron.steps.length > 1 && (
            <div className="flex gap-1.5">
              {cron.steps.map((s, i) => (
                <div key={s.key} className={clsx(
                  'flex-1 h-1 rounded-full transition-colors',
                  i < state.currentStep ? 'bg-emerald-400'
                    : i === state.currentStep ? 'bg-amber-400 animate-pulse'
                    : 'bg-gray-200',
                )} />
              ))}
            </div>
          )}
        </div>
      )}

      {state.status === 'done' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium">Terminé avec succès</span>
          </div>
          <button onClick={onReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            <RotateCcw size={12} strokeWidth={1.5} />
            Réinitialiser
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
          <XCircle size={15} strokeWidth={1.5} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">{state.error}</p>
        </div>
      )}

      {/* Options (content cron only) */}
      {isContent && (state.status === 'idle' || state.status === 'error') && (
        <div>
          <button
            type="button"
            onClick={() => setOptionsOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            {optionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Options avancées
          </button>
          {optionsOpen && (
            <div className="mt-2 flex flex-col gap-2">
              <select value={selectedAnimal} onChange={e => setSelectedAnimal(e.target.value)} disabled={isRunning}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50">
                {ANIMALS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={isRunning}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500 disabled:opacity-50">
                {ARTICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ForcedPartnerPanel
                partner={selectedPartner} productName={selectedProductName} productUrl={selectedProductUrl}
                promo={selectedPromo} forcedImage={selectedImage}
                onPartnerChange={setSelectedPartner}
                onProductChange={(name, url) => { setSelectedProductName(name); setSelectedProductUrl(url); }}
                onPromoChange={setSelectedPromo}
                onForcedImageChange={setSelectedImage}
                disabled={isRunning}
              />
            </div>
          )}
        </div>
      )}

      {/* Launch button */}
      {state.status !== 'done' && (
        <button
          onClick={state.status === 'error' ? handleRun : handleRun}
          disabled={isRunning}
          className={clsx(
            'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-auto',
            isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : state.status === 'error'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : `${cron.iconBg} ${cron.iconColor} hover:brightness-95 cursor-pointer`,
          )}
        >
          {isRunning
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />En cours…</>
            : state.status === 'error'
            ? <><RotateCcw size={15} strokeWidth={2} />Réessayer</>
            : <><Play size={15} strokeWidth={2} />Lancer</>}
        </button>
      )}
    </div>
  );
}

// ─── CatalogSyncCard ──────────────────────────────────────────────────────────

const CATALOG_CATEGORIES = [
  { key: 'chiens',          label: 'Chiens',   icon: '🐶' },
  { key: 'chats',           label: 'Chats',    icon: '🐱' },
  { key: 'oiseaux',         label: 'Oiseaux',  icon: '🐦' },
  { key: 'rongeurs',        label: 'Rongeurs', icon: '🐹' },
  { key: 'reptiles',        label: 'Reptiles', icon: '🦎' },
  { key: 'livres',          label: 'Livres',   icon: '📚' },
  { key: 'general',         label: 'Général',  icon: '🐾' },
  { key: 'canada-pet-care', label: 'CPC',      icon: '🇨🇦' },
] as const;

type CatalogCategory = typeof CATALOG_CATEGORIES[number]['key'];

interface CatalogCatState {
  status: 'idle' | 'running' | 'done' | 'error';
  inserted: number;
  updated: number;
  error: string | null;
}

function CatalogSyncCard() {
  const router = useRouter();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [states, setStates] = useState<Record<CatalogCategory, CatalogCatState>>(
    () => Object.fromEntries(
      CATALOG_CATEGORIES.map(c => [c.key, { status: 'idle', inserted: 0, updated: 0, error: null }])
    ) as Record<CatalogCategory, CatalogCatState>,
  );

  const anyRunning  = Object.values(states).some(s => s.status === 'running');
  const doneCount   = CATALOG_CATEGORIES.filter(c => states[c.key].status === 'done').length;
  const allDone     = doneCount === CATALOG_CATEGORIES.length;
  const totalInserted = Object.values(states).reduce((s, v) => s + v.inserted, 0);
  const totalUpdated  = Object.values(states).reduce((s, v) => s + v.updated, 0);

  const launchCategory = async (key: CatalogCategory): Promise<{ inserted: number; updated: number }> => {
    if (states[key].status === 'running') return { inserted: 0, updated: 0 };
    setStates(prev => ({ ...prev, [key]: { ...prev[key], status: 'running', error: null } }));
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: `catalog-sync-${key}` }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      const inserted = data.inserted ?? 0;
      const updated = data.updated ?? 0;
      setStates(prev => ({ ...prev, [key]: { status: 'done', inserted, updated, error: null } }));
      return { inserted, updated };
    } catch (err) {
      setStates(prev => ({ ...prev, [key]: { ...prev[key], status: 'error', error: err instanceof Error ? err.message : 'Erreur' } }));
      return { inserted: 0, updated: 0 };
    }
  };

  const launchAll = async () => {
    const results: Array<{ label: string; inserted: number; updated: number }> = [];
    for (const cat of CATALOG_CATEGORIES) {
      const res = await launchCategory(cat.key);
      results.push({ label: cat.label, ...res });
    }
    const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
    const totalUpdated  = results.reduce((s, r) => s + r.updated,  0);
    fetch('/api/admin/catalog-sync-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: results, totalInserted, totalUpdated }),
    }).catch(() => {});
    router.refresh();
  };

  const resetAll = () => {
    setStates(
      Object.fromEntries(
        CATALOG_CATEGORIES.map(c => [c.key, { status: 'idle', inserted: 0, updated: 0, error: null }])
      ) as Record<CatalogCategory, CatalogCatState>,
    );
  };

  return (
    <div className={clsx(
      'bg-white border-2 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 h-full',
      allDone ? 'border-emerald-200 bg-emerald-50/30' : anyRunning ? 'border-amber-200 bg-amber-50/20' : 'border-orange-200 hover:shadow-md',
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-100">
          <ShoppingBag size={20} strokeWidth={1.5} className="text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">Catalog Sync V2</p>
              <a href="/api/admin/export-catalog" download className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors flex-shrink-0">↓ CSV</a>
            </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {allDone
              ? `✓ ${totalInserted} nouvelles fiches · ${totalUpdated} offres màj`
              : anyRunning ? 'Synchronisation en cours…'
          : 'Lit Awin/CPC directement → products_catalog + product_offers'}
          </p>
        </div>
      </div>

      {/* Progress bar globale */}
      {(anyRunning || doneCount > 0) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{doneCount}/{CATALOG_CATEGORIES.length} catégories</span>
            <span>{Math.round((doneCount / CATALOG_CATEGORIES.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / CATALOG_CATEGORIES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Options avancées toggle */}
      <button
        type="button"
        onClick={() => setOptionsOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        {optionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Options avancées
      </button>

      {/* Catégories */}
      {optionsOpen && <div className="grid grid-cols-2 gap-1.5">
        {CATALOG_CATEGORIES.map(cat => {
          const s = states[cat.key];
          const isIdle = s.status === 'idle';
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => (isIdle || s.status === 'error') && launchCategory(cat.key)}
              disabled={s.status === 'running' || s.status === 'done'}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left w-full',
                s.status === 'done'    ? 'bg-emerald-50 border border-emerald-200 cursor-default'
                  : s.status === 'running' ? 'bg-amber-50 border border-amber-200 cursor-default'
                  : s.status === 'error'   ? 'bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer'
                  : 'bg-gray-50 border border-gray-100 hover:bg-orange-50 hover:border-orange-200 cursor-pointer',
              )}
            >
              <span className={clsx('font-medium',
                s.status === 'done' ? 'text-emerald-700' : s.status === 'error' ? 'text-red-600' : 'text-gray-700'
              )}>{cat.label}</span>
              {s.status === 'running' && <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0 ml-auto" />}
              {s.status === 'done' && (
                <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                  {s.inserted > 0 && <span className="text-xs font-semibold text-emerald-600">+{s.inserted}</span>}
                  {s.updated > 0 && <span className="text-xs font-semibold text-sky-600">↻{s.updated}</span>}
                  {s.inserted === 0 && s.updated === 0 && <span className="text-xs text-gray-400">-</span>}
                  <CheckCircle2 size={12} strokeWidth={2} className="text-emerald-500" />
                </span>
              )}
              {s.status === 'error' && <RotateCcw size={12} strokeWidth={2} className="text-red-400 flex-shrink-0 ml-auto" />}
              {isIdle && <Play size={11} strokeWidth={2} className="text-gray-300 flex-shrink-0 ml-auto" />}
            </button>
          );
        })}
      </div>}

      {allDone ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={16} strokeWidth={1.5} />
              <span className="text-sm font-medium">Terminé avec succès</span>
            </div>
            <button onClick={resetAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <RotateCcw size={12} strokeWidth={1.5} />
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Nouvelles fiches</span>
              <span className="text-xs font-semibold text-emerald-700">{totalInserted}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Offres màj</span>
              <span className="text-xs font-semibold text-emerald-700">{totalUpdated}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={launchAll}
          disabled={anyRunning}
          className={clsx(
            'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
            anyRunning ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:brightness-95 cursor-pointer',
          )}
        >
          {anyRunning
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />En cours…</>
            : <><Play size={15} strokeWidth={2} />Tout lancer</>}
        </button>
      )}
    </div>
  );
}

// ─── UtilCard (panels génériques) ────────────────────────────────────────────

interface StatRow { label: string; value: string | number; danger?: boolean }

interface UtilCardProps {
  icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  label: string;
  idleDesc: string;
  exportHref?: string;
  refreshOnDone?: boolean;
  onLaunch: () => Promise<{ result: string; stats?: StatRow[] }>;
}

function UtilCard({ icon: Icon, iconBg, iconColor, accentColor, label, idleDesc, exportHref, refreshOnDone, onLaunch }: UtilCardProps) {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [result, setResult] = useState('');
  const [stats, setStats] = useState<StatRow[]>([]);
  const router = useRouter();

  const launch = async () => {
    if (status === 'running') return;
    setStatus('running');
    setResult('');
    setStats([]);
    try {
      const { result: res, stats: s } = await onLaunch();
      setResult(res);
      setStats(s ?? []);
      setStatus('done');
      if (refreshOnDone) router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur');
      setStatus('error');
    }
  };

  const reset = () => { setStatus('idle'); setResult(''); setStats([]); };

  return (
    <div className={clsx(
      'bg-white border-2 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 h-full',
      status === 'done' ? 'border-emerald-200 bg-emerald-50/30'
        : status === 'error' ? 'border-red-200 bg-red-50/20'
        : status === 'running' ? 'border-amber-200 bg-amber-50/20'
        : `${accentColor} hover:shadow-md`,
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon size={20} strokeWidth={1.5} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">{label}</p>
            {exportHref && (
              <a
                href={exportHref}
                download
                className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors"
                title="Télécharger CSV"
              >
                ↓ CSV
              </a>
            )}
          </div>
          <p className={clsx('text-xs mt-0.5 leading-relaxed line-clamp-2',
            status === 'done' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-gray-500'
          )}>
            {status === 'running' ? 'En cours…' : status === 'error' ? result : idleDesc}
          </p>
        </div>
      </div>

      {status === 'running' && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: '65%' }} />
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={15} strokeWidth={1.5} />
              <span className="text-xs font-medium">{result}</span>
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <RotateCcw size={12} strokeWidth={1.5} />
              Réinitialiser
            </button>
          </div>
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              {stats.map((s, i) => {
                const isRed = s.danger && Number(s.value) > 0;
                return (
                  <div key={i} className={clsx('border rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2', isRed ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100')}>
                    <span className="text-xs text-gray-500 truncate">{s.label}</span>
                    <span className={clsx('text-xs font-semibold flex-shrink-0', isRed ? 'text-red-600' : 'text-emerald-700')}>{s.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {status !== 'done' && (
        <button
          onClick={status === 'error' ? reset : launch}
          disabled={status === 'running'}
          className={clsx(
            'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-auto',
            status === 'running' ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : status === 'error' ? 'bg-red-600 text-white hover:bg-red-500 cursor-pointer'
              : `${iconBg} ${iconColor} hover:brightness-95 cursor-pointer`,
          )}
        >
          {status === 'running' && <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />En cours…</>}
          {status === 'error' && <><RotateCcw size={15} strokeWidth={2} />Réessayer</>}
          {status === 'idle' && <><Play size={15} strokeWidth={2} />Lancer</>}
        </button>
      )}
    </div>
  );
}

const STEP_COLORS: Record<number, string> = {
  1: 'bg-orange-500',
  2: 'bg-blue-500',
  3: 'bg-violet-500',
  4: 'bg-teal-500',
  5: 'bg-rose-500',
};

function StepBadge({ n }: { n: number }) {
  return (
    <span className={`absolute -top-2 right-2.5 z-10 w-5 h-5 rounded-full ${STEP_COLORS[n]} text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none`}>
      {n}
    </span>
  );
}

function StepFlow() {
  return (
    <span className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as const).map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          <span className={`w-4 h-4 rounded-full ${STEP_COLORS[n]} text-white text-[9px] font-bold flex items-center justify-center`}>{n}</span>
          {i < 4 && <span className="text-gray-300 text-[10px]">→</span>}
        </span>
      ))}
    </span>
  );
}

// ─── CronLauncher principal ───────────────────────────────────────────────────

export default function CronLauncher({ floating = false }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropStyle, setDropStyle] = useState<{ top: number; right: number }>({ top: 0, right: 16 });
  const { getState, run, reset } = useCronRunner();

  const handleOpen = () => {
    if (!floating && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropStyle({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
    setOpen(true);
  };

  const groups = [
    { id: 'Contenu',     label: 'Contenu & Communication', color: 'text-purple-700' },
    { id: 'Données',     label: 'Données',          color: 'text-teal-700'   },
    { id: 'Maintenance', label: 'Opérations & Maintenance', color: 'text-gray-700'   },
  ];

  if (floating) {
    return (
      <>
        {/* Tab vertical collé à droite */}
        <button
          onClick={() => setOpen(v => !v)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 px-2 py-4 bg-orange-600 hover:bg-orange-500 text-white shadow-lg transition-colors rounded-l-xl"
          title="Lancer un cron"
        >
          <Rocket size={16} strokeWidth={1.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
            Crons
          </span>
        </button>

        {open && (
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
        )}
        <div
          className={clsx(
            'fixed right-0 top-0 z-50 h-full bg-white shadow-2xl border-l border-gray-100 flex flex-col transition-transform duration-300',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
          style={{ width: 'min(calc(100vw - 48px), 780px)' }}
          role="dialog"
          aria-modal="true"
        >
              {/* Header drawer */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Rocket size={18} strokeWidth={1.5} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Pipelines manuels</h2>
                    <p className="text-xs text-gray-500">Déclenche un pipeline immédiatement</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              {/* Body scrollable */}
              <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
                {groups.map(group => {
                  const cronItems = CRONS.filter(c => c.group === group.id);
                  return (
                    <div key={group.id}>
                      <h3 className={clsx('text-xs font-bold uppercase tracking-widest mb-3', group.color)}>
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {cronItems.map(cron => (
                          <CronCard
                            key={cron.id}
                            cron={cron}
                            state={getState(cron.id)}
                            run={run}
                            onReset={() => reset(cron.id)}
                            exportHref={
                              cron.id === 'prenoms' ? '/api/admin/export-prenoms' :
                              cron.id === 'breeds'  ? '/api/admin/export-breeds'  :
                              undefined
                            }
                          />
                        ))}
                        {group.id === 'Contenu' && (
                          <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <MessageSquare size={20} strokeWidth={1.5} className="text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">Support client</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                  Léa répond à la demande depuis sa page agent - pas de cron dédié.
                                </p>
                              </div>
                            </div>
                            <div className="mt-auto px-3 py-2 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-700 font-medium text-center">
                              Géré en temps réel · Page agent Léa
                            </div>
                          </div>
                        )}
                        {group.id === 'Maintenance' && (
                          <UtilCard
                            icon={ImageIcon} iconBg="bg-slate-100" iconColor="text-slate-600"
                            accentColor="border-slate-200"
                            label="Compression images (blog + races)"
                            idleDesc="Sharp · blog-images 1200px + hero-photos 600px · JPEG 80% · les 2 buckets en 1 passage"
                            exportHref="/api/admin/export-operations?type=compression"
                            onLaunch={async () => {
                              const r = await fetch('/api/admin/compress-hero-images');
                              const data = await r.json();
                              if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                              return {
                                result: `${data.compressed} image${data.compressed !== 1 ? 's' : ''} compressée${data.compressed !== 1 ? 's' : ''}`,
                                stats: [
                                  { label: 'Compressées', value: `${data.compressed}/${data.total}` },
                                  { label: 'Espace gagné', value: data.saved ?? '-' },
                                ],
                              };
                            }}
                          />
                        )}
                        {group.id === 'Maintenance' && (
                          <UtilCard
                            icon={MessageSquare} iconBg="bg-slate-100" iconColor="text-slate-600"
                            accentColor="border-slate-200"
                            label="Backfill FAQ articles"
                            idleDesc="Génère la FAQ (Haiku) des articles sans FAQ · 10 par lot · relancer jusqu'à terminé"
                            onLaunch={async () => {
                              const r = await fetch('/api/admin/backfill-faq');
                              const data = await r.json();
                              if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                              return {
                                result: data.done ? 'Tous les articles ont une FAQ' : `${data.processed} traité(s) · ${data.remaining} restant(s) - relancer`,
                                stats: [
                                  { label: 'Traités', value: `${data.processed ?? 0}` },
                                  { label: 'Restants', value: `${data.remaining ?? 0}` },
                                ],
                              };
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-700">Boutique & Outils</h3>
                    <StepFlow />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative h-full"><StepBadge n={1} /><CatalogSyncCard /></div>
                    <div className="relative h-full">
                      <StepBadge n={2} />
                      <UtilCard
                        icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600" accentColor="border-orange-200"
                        exportHref="/api/admin/export-operations?type=dedup"
                        label="Fusion doublons EAN"
                        refreshOnDone
                        idleDesc="Fusionne les fiches catalog avec le même EAN"
                        onLaunch={async () => {
                          const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-ean' }) });
                          const data = await r.json();
                          if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                          return { result: data.merged === 0 ? 'Aucun doublon EAN' : `${data.deleted} fiches fusionnées`, stats: [{ label: 'Groupes EAN', value: data.eanGroups ?? 0 }, { label: 'Fiches supprimées', value: data.deleted ?? 0 }] };
                        }}
                      />
                    </div>
                    <div className="relative h-full">
                      <StepBadge n={3} />
                      <UtilCard
                        icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600" accentColor="border-orange-200"
                        exportHref="/api/admin/export-operations?type=dedup-nl"
                        label="Fusion doublons image"
                        refreshOnDone
                        idleDesc="Fusionne toutes les fiches avec la même image : Maxi Zoo BE/FR, versions NL/FR, même marchand x2. Offres déplacées vers la fiche la plus ancienne."
                        onLaunch={async () => {
                          const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-image' }) });
                          const data = await r.json();
                          if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                          return { result: data.deleted === 0 ? 'Aucun doublon image' : `${data.deleted} fiches fusionnées`, stats: [{ label: 'Paires', value: data.pairs ?? 0 }, { label: 'Orphelins NL', value: data.orphans ?? 0 }, { label: 'Offres dedoublonnees', value: data.offersDeduped ?? 0 }] };
                        }}
                      />
                    </div>
                    <div className="relative h-full">
                      <StepBadge n={4} />
                      <UtilCard
                        icon={Sparkles} iconBg="bg-orange-100" iconColor="text-orange-600" accentColor="border-orange-200"
                        exportHref="/api/admin/export-translations"
                        label="Traduction EN/NL→FR (Haiku)"
                        refreshOnDone
                        idleDesc="Noms + descriptions sans traduction FR. Claude détecte la langue. Max 500 noms / 200 desc. par run."
                        onLaunch={async () => {
                          const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-sync-translate' }) });
                          const data = await r.json();
                          if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                          const done = (data.translatedNames ?? 0) + (data.translatedDescs ?? 0);
                          const remN = data.remainingNames ?? 0;
                          const remD = data.remainingDescs ?? 0;
                          return {
                            result: done === 0 ? (remN === 0 && remD === 0 ? 'Tout est traduit ✓' : 'Rien de nouveau') : `${done} traductions`,
                            stats: [
                              { label: 'Noms traduits', value: data.translatedNames ?? 0 },
                              { label: 'Desc. traduites', value: data.translatedDescs ?? 0 },
                              { label: 'Noms restants', value: remN, danger: true },
                              { label: 'Desc. restantes', value: remD, danger: true },
                            ],
                          };
                        }}
                      />
                    </div>
                    <div className="relative h-full">
                      <StepBadge n={5} />
                      <UtilCard
                        icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600" accentColor="border-orange-200"
                        exportHref="/api/admin/export-operations?type=dedup"
                        label="Fusion doublons titre"
                        refreshOnDone
                        idleDesc="Fusionne les fiches avec titre + marque + poids identiques"
                        onLaunch={async () => {
                          const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-title' }) });
                          const data = await r.json();
                          if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                          return { result: data.deleted === 0 ? 'Aucun doublon titre' : `${data.deleted} fiches fusionnées`, stats: [{ label: 'Groupes', value: data.groups ?? 0 }, { label: 'Fiches supprimées', value: data.deleted ?? 0 }] };
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center gap-2 flex-shrink-0">
                <Rocket size={13} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">Les pipelines s'exécutent immédiatement - surveille les logs pour suivre la progression.</p>
              </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
        >
          <Rocket size={16} strokeWidth={1.5} />
          Lancer un cron
        </button>
      </div>

      {open && (
        <>
          {/* Backdrop léger */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel ancré sous le bouton */}
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100"
            style={{
              top: dropStyle.top,
              right: dropStyle.right,
              width: 'min(calc(100vw - 32px), 1400px)',
              maxHeight: 'calc(100vh - 80px)',
              display: 'flex',
              flexDirection: 'column',
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Encoche de connexion au bouton */}
            <div
              className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45"
              style={{ boxShadow: '-2px -2px 4px rgba(0,0,0,0.04)' }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Rocket size={20} strokeWidth={1.5} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Pipelines manuels</h2>
                  <p className="text-sm text-gray-500">Déclenche un pipeline immédiatement</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="px-8 py-6 space-y-8 overflow-y-auto flex-1">

              {/* Groupes de crons */}
              {groups.map(group => {
                const cronItems = CRONS.filter(c => c.group === group.id);
                return (
                  <div key={group.id}>
                    <h3 className={clsx('text-xs font-bold uppercase tracking-widest mb-3', group.color)}>
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {cronItems.map(cron => (
                        <CronCard
                          key={cron.id}
                          cron={cron}
                          state={getState(cron.id)}
                          run={run}
                          onReset={() => reset(cron.id)}
                          exportHref={
                            cron.id === 'prenoms' ? '/api/admin/export-prenoms' :
                            cron.id === 'breeds'  ? '/api/admin/export-breeds'  :
                            undefined
                          }
                        />
                      ))}
                      {group.id === 'Contenu' && (
                        <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <MessageSquare size={20} strokeWidth={1.5} className="text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">Support client</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Léa répond à la demande depuis sa page agent - pas de cron dédié.
                              </p>
                            </div>
                          </div>
                          <div className="mt-auto px-3 py-2 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-700 font-medium text-center">
                            Géré en temps réel · Page agent Léa
                          </div>
                        </div>
                      )}
                      {group.id === 'Maintenance' && (
                        <UtilCard
                          icon={ImageIcon} iconBg="bg-slate-100" iconColor="text-slate-600"
                          accentColor="border-slate-200"
                          label="Compression images (blog + races)"
                          idleDesc="Sharp · blog-images 1200px + hero-photos 600px · JPEG 80% · les 2 buckets en 1 passage"
                          exportHref="/api/admin/export-operations?type=compression"
                          onLaunch={async () => {
                            const r = await fetch('/api/admin/compress-hero-images');
                            const data = await r.json();
                            if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                            return {
                              result: `${data.compressed} image${data.compressed !== 1 ? 's' : ''} compressée${data.compressed !== 1 ? 's' : ''}`,
                              stats: [
                                { label: 'Compressées', value: `${data.compressed}/${data.total}` },
                                { label: 'Espace gagné', value: data.saved ?? '-' },
                              ],
                            };
                          }}
                        />
                      )}
                      {group.id === 'Maintenance' && (
                        <UtilCard
                          icon={MessageSquare} iconBg="bg-slate-100" iconColor="text-slate-600"
                          accentColor="border-slate-200"
                          label="Backfill FAQ articles"
                          idleDesc="Génère la FAQ (Haiku) des articles sans FAQ · 10 par lot · relancer jusqu'à terminé"
                          onLaunch={async () => {
                            const r = await fetch('/api/admin/backfill-faq');
                            const data = await r.json();
                            if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                            return {
                              result: data.done ? 'Tous les articles ont une FAQ' : `${data.processed} traité(s) · ${data.remaining} restant(s) - relancer`,
                              stats: [
                                { label: 'Traités', value: `${data.processed ?? 0}` },
                                { label: 'Restants', value: `${data.remaining ?? 0}` },
                              ],
                            };
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Boutique & Outils */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-orange-700">Boutique & Outils</h3>
                  <StepFlow />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative h-full"><StepBadge n={1} /><CatalogSyncCard /></div>

                  <div className="relative">
                    <StepBadge n={2} />
                    <UtilCard
                      icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600"
                      accentColor="border-orange-200"
                      exportHref="/api/admin/export-operations?type=dedup"
                      label="Fusion doublons EAN"
                      idleDesc="Fusionne les fiches catalog avec le même EAN"
                      onLaunch={async () => {
                        const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-ean' }) });
                        const data = await r.json();
                        if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                        return {
                          result: data.merged === 0 ? 'Aucun doublon EAN' : `${data.deleted} fiches fusionnées`,
                          stats: [
                            { label: 'Groupes EAN',       value: data.eanGroups ?? 0 },
                            { label: 'Fiches supprimées', value: data.deleted    ?? 0 },
                          ],
                        };
                      }}
                    />
                  </div>

                  <div className="relative">
                    <StepBadge n={3} />
                    <UtilCard
                      icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600"
                      accentColor="border-orange-200"
                      exportHref="/api/admin/export-operations?type=dedup-nl"
                      label="Fusion doublons image"
                      idleDesc="Fusionne toutes les fiches avec la même image : Maxi Zoo BE/FR, NL/FR, même marchand x2. Offres déplacées vers la fiche la plus ancienne."
                      onLaunch={async () => {
                        const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-image' }) });
                        const data = await r.json();
                        if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                        return {
                          result: data.deleted === 0 ? 'Aucun doublon image' : `${data.deleted} fiches fusionnées`,
                          stats: [
                            { label: 'Paires',              value: data.pairs        ?? 0 },
                            { label: 'Orphelins NL',        value: data.orphans      ?? 0 },
                            { label: 'Offres dedoublonnees', value: data.offersDeduped ?? 0 },
                          ],
                        };
                      }}
                    />
                  </div>

                  <div className="relative">
                    <StepBadge n={4} />
                    <UtilCard
                      icon={Sparkles} iconBg="bg-orange-100" iconColor="text-orange-600"
                      accentColor="border-orange-200"
                      exportHref="/api/admin/export-translations"
                      label="Traduction EN/NL→FR (Haiku)"
                      idleDesc="Noms + descriptions sans traduction FR. Claude détecte la langue. Max 500 noms / 200 desc. par run."
                      onLaunch={async () => {
                        const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-sync-translate' }) });
                        const data = await r.json();
                        if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
                        const done = (data.translatedNames ?? 0) + (data.translatedDescs ?? 0);
                        const remN = data.remainingNames ?? 0;
                        const remD = data.remainingDescs ?? 0;
                        return {
                          result: done === 0 ? (remN === 0 && remD === 0 ? 'Tout est traduit ✓' : 'Rien de nouveau') : `${done} traductions`,
                          stats: [
                            { label: 'Noms traduits',  value: data.translatedNames ?? 0 },
                            { label: 'Desc. traduites', value: data.translatedDescs ?? 0 },
                            { label: 'Noms restants',  value: remN, danger: true },
                            { label: 'Desc. restantes', value: remD, danger: true },
                          ],
                        };
                      }}
                    />
                  </div>

                  <div className="relative">
                    <StepBadge n={5} />
                    <UtilCard
                      icon={Tag} iconBg="bg-orange-100" iconColor="text-orange-600"
                      accentColor="border-orange-200"
                      exportHref="/api/admin/export-operations?type=dedup"
                      label="Fusion doublons Titre"
                      refreshOnDone
                      idleDesc="Fusionne les fiches avec titre + marque + poids identiques"
                      onLaunch={async () => {
                        const r = await fetch('/api/admin/run-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'catalog-dedup-title' }) });
                        const data = await r.json();
                        if (!r.ok || data.error) throw new Error(data.error ?? `Erreur ${r.status}`);
                        return {
                          result: data.deleted === 0 ? 'Aucun doublon titre' : `${data.deleted} fiches fusionnées`,
                          stats: [
                            { label: 'Groupes détectés', value: data.groups  ?? 0 },
                            { label: 'Fiches supprimées', value: data.deleted ?? 0 },
                          ],
                        };
                      }}
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center gap-2 flex-shrink-0">
              <Rocket size={14} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-900 font-medium">Les pipelines s'exécutent immédiatement - surveille les logs pour suivre la progression.</p>
            </div>

          </div>
        </>
      )}
    </>
  );
}
