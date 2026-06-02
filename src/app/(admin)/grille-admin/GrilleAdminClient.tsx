'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trophy, Users, Wallet, Euro, Gift, Lock, Download, Calendar, BarChart3, ChevronDown, ChevronUp, Plus, Layers, Archive } from 'lucide-react';
import type { AchatRow } from './page';

interface Buyer { prenom: string; email: string; pixels: number; }
interface Scheduled { id: string; animal: string; race_secrete: string; ordre: number; }

interface Props {
  grille: {
    id: string;
    animal: string;
    race_secrete: string;
    statut: string;
    total_pixels: number;
    created_at: string;
    ends_at: string | null;
    montant_reverse_cents: number | null;
    preuve_don_url: string | null;
  };
  rows: AchatRow[];
  classement: Buyer[];
  gagnantDevinette: { prenom: string; email: string } | null;
  scheduled: Scheduled[];
}

function eur(cents: number) {
  return (cents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });
}

export default function GrilleAdminClient({ grille, rows, classement, gagnantDevinette, scheduled }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [achatsOpen, setAchatsOpen] = useState(false);
  const [backupsOpen, setBackupsOpen] = useState(false);

  // Formulaire d'ajout d'une grille en file
  const [newAnimal, setNewAnimal] = useState('');
  const [newRace, setNewRace] = useState('');
  const [imgMode, setImgMode] = useState<'file' | 'url'>('file');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  const hasImage = imgMode === 'file' ? !!newFile : !!newImageUrl.trim();

  // Aperçu de l'image sélectionnée
  const [filePreview, setFilePreview] = useState('');
  useEffect(() => {
    if (newFile) {
      const url = URL.createObjectURL(newFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview('');
  }, [newFile]);
  const previewSrc = imgMode === 'file' ? filePreview : newImageUrl.trim();

  // ── Actions admin (modifier race, terminer, don) ──────
  const [raceEdit, setRaceEdit] = useState(grille.race_secrete);
  const [donMontant, setDonMontant] = useState(grille.montant_reverse_cents ? (grille.montant_reverse_cents / 100).toString() : '');
  const [donPreuve, setDonPreuve] = useState(grille.preuve_don_url ?? '');
  const [actionMsg, setActionMsg] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  async function callManage(body: Record<string, unknown>, okMsg: string) {
    setActionBusy(true); setActionMsg('');
    try {
      const r = await fetch('/api/admin/grille/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grilleId: grille.id, ...body }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Erreur ${r.status}`);
      setActionMsg(okMsg);
      router.refresh();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Erreur');
    } finally { setActionBusy(false); }
  }

  // Projection de remplissage (vitesse moyenne depuis le 1er achat)
  const projection = (() => {
    const confirmed = rows.filter(r => r.created_at);
    if (confirmed.length === 0) return null;
    const totalVendusP = confirmed.reduce((s, r) => s + r.pixels, 0);
    if (totalVendusP === 0 || totalVendusP >= grille.total_pixels) return null;
    const first = Math.min(...confirmed.map(r => new Date(r.created_at).getTime()));
    const joursEcoules = Math.max(0.5, (Date.now() - first) / 86400000);
    const parJour = totalVendusP / joursEcoules;
    if (parJour <= 0) return null;
    const joursRestants = Math.ceil((grille.total_pixels - totalVendusP) / parJour);
    return `~${Math.round(parJour)} px/jour → grille pleine dans ~${joursRestants} jours`;
  })();

  // Compte à rebours de la grille en cours
  const [tempsRestant, setTempsRestant] = useState('');
  useEffect(() => {
    if (grille.statut === 'active' && !grille.ends_at) { setTempsRestant('en attente du 1er achat'); return; }
    if (grille.statut !== 'active' || !grille.ends_at) { setTempsRestant(''); return; }
    const end = new Date(grille.ends_at).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setTempsRestant('terminé'); return; }
      const j = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTempsRestant(`${j}j ${h}h ${m}min`);
    };
    tick();
    const i = setInterval(tick, 30000);
    return () => clearInterval(i);
  }, [grille.statut, grille.ends_at]);

  // Sauvegardes CSV des grilles terminées
  const [backups, setBackups] = useState<{ name: string; created_at: string | null; url: string | null }[]>([]);
  useEffect(() => {
    fetch('/api/admin/grille/backups')
      .then(r => r.json())
      .then(d => setBackups(d.backups ?? []))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!hasImage || !newAnimal.trim() || !newRace.trim()) return;
    setCreating(true);
    setCreateMsg('');
    try {
      const fd = new FormData();
      if (imgMode === 'file' && newFile) fd.append('file', newFile);
      if (imgMode === 'url' && newImageUrl.trim()) fd.append('image_url', newImageUrl.trim());
      fd.append('animal', newAnimal.trim());
      fd.append('race_secrete', newRace.trim());
      const r = await fetch('/api/admin/grille/create', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      setCreateMsg(`Grille ajoutée en file (position ${data.ordre}).`);
      setNewAnimal(''); setNewRace(''); setNewFile(null); setNewImageUrl('');
      router.refresh();
    } catch (err) {
      setCreateMsg(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  }

  // ─── Calculs financiers ───────────────────────────────
  const brutCents = rows.reduce((s, r) => s + r.montant_cents, 0);
  const nbTransactions = rows.length;
  // Stripe Belgique : ~1.5% + 0.25€ par transaction
  const stripeCents = Math.round(brutCents * 0.015 + nbTransactions * 25);
  const netCents = brutCents - stripeCents;
  const taPartCents = Math.round(netCents * 0.4);
  const refugeCents = netCents - taPartCents;
  const cagnotteCents = Math.round(taPartCents * 0.25);

  // Cadeaux avec plafonds (100€ / 50€ / 25€)
  const cadeau1 = Math.min(Math.round(cagnotteCents * 0.5), 10000);
  const cadeau2 = Math.min(Math.round(cagnotteCents * 0.3), 5000);
  const cadeau3 = Math.min(Math.round(cagnotteCents * 0.2), 2500);

  const totalPixelsVendus = rows.reduce((s, r) => s + r.pixels, 0);
  const pourcentageExact = (totalPixelsVendus / grille.total_pixels) * 100;
  const pourcentage = Math.round(pourcentageExact);
  // Affichage : 1 décimale si < 1% pour ne pas afficher "0%" alors qu'il y a des ventes
  const pourcentageLabel = totalPixelsVendus > 0 && pourcentageExact < 1
    ? pourcentageExact.toFixed(2).replace('.', ',')
    : String(pourcentage);
  const acheteursUniques = classement.length;

  // ─── Gagnants ─────────────────────────────────────────
  const winners = useMemo(() => {
    const result: { rang: number; prenom: string; email: string; raison: string; montant: number }[] = [];
    const used = new Set<string>();

    if (gagnantDevinette) {
      result.push({ rang: 1, prenom: gagnantDevinette.prenom, email: gagnantDevinette.email, raison: 'A trouvé la race', montant: cadeau1 });
      used.add(gagnantDevinette.email);
    } else if (classement[0]) {
      result.push({ rang: 1, prenom: classement[0].prenom, email: classement[0].email, raison: 'Plus gros acheteur', montant: cadeau1 });
      used.add(classement[0].email);
    }

    const restants = classement.filter(b => !used.has(b.email));
    if (restants[0]) result.push({ rang: 2, prenom: restants[0].prenom, email: restants[0].email, raison: 'Top acheteur', montant: cadeau2 });
    if (restants[1]) result.push({ rang: 3, prenom: restants[1].prenom, email: restants[1].email, raison: 'Top acheteur', montant: cadeau3 });

    return result;
  }, [gagnantDevinette, classement, cadeau1, cadeau2, cadeau3]);

  // ─── Recherche ────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => r.prenom.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [rows, query]);

  // ─── Date de fin (3 mois après le départ) ─────────────
  const endDate = (() => {
    const start = new Date(process.env.NEXT_PUBLIC_GRILLE_START_DATE ?? grille.created_at);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);
    return end.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
      + ' à ' + end.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  })();

  // ─── Classement des devinettes tentées ────────────────
  const devinetteStats = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      if (!r.devinette) return;
      const key = r.devinette.trim();
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  // ─── Export CSV (délimiteur ; pour Excel FR) ──────────
  function exportCSV() {
    const SEP = ';';
    const header = ['Prénom', 'Email', 'Pixels', 'Montant (€)', 'Devinette', 'Correcte', 'Date'];
    const lines = rows.map(r => [
      r.prenom,
      r.email,
      String(r.pixels),
      (r.montant_cents / 100).toFixed(2).replace('.', ','),
      r.devinette ?? '',
      r.devinette_correcte ? 'oui' : '',
      new Date(r.created_at).toLocaleString('fr-BE'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(SEP));
    const csv = [header.join(SEP), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grille-${grille.animal}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-8">
      <div className="w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grille Mystère</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Animal : <span className="font-medium capitalize">{grille.animal}</span>
              {' · '}Race secrète : <span className="font-medium text-orange-600">{grille.race_secrete}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${grille.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {grille.statut === 'active' ? 'En cours' : 'Terminée'}
          </span>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={<Euro className="w-4 h-4" />} label="Total collecté" value={eur(brutCents)} sub={`${nbTransactions} transactions`} />
          <StatCard icon={<Wallet className="w-4 h-4" />} label="Ta part (40%)" value={eur(taPartCents)} sub={`net après Stripe : ${eur(netCents)}`} />
          <StatCard icon={<Gift className="w-4 h-4" />} label="Part refuge (60%)" value={eur(refugeCents)} sub="à reverser" />
          <StatCard icon={<Users className="w-4 h-4" />} label="Acheteurs uniques" value={String(acheteursUniques)} sub={`${totalPixelsVendus} / ${grille.total_pixels} pixels (${pourcentageLabel}%)`} />
        </div>

        {/* Progression + date de fin */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-900">{pourcentageLabel}% révélé</span>
            <span className="text-xs text-gray-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Fin le {endDate}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pourcentage, 0.5)}%` }}
            />
          </div>
          {projection && <p className="text-xs text-gray-500 mt-2">📈 Projection : {projection}</p>}
        </div>

        {/* Détail frais + cagnotte cadeaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Cagnotte cadeaux <span className="text-gray-400 font-normal">(25% de ta part)</span></h2>
            <p className="text-2xl font-bold text-gray-900 mb-4">{eur(cagnotteCents)}</p>
            <div className="space-y-2">
              {[
                { rang: '🥇', label: 'Cadeau #1 (50%, max 100€)', val: cadeau1 },
                { rang: '🥈', label: 'Cadeau #2 (30%, max 50€)', val: cadeau2 },
                { rang: '🥉', label: 'Cadeau #3 (20%, max 25€)', val: cadeau3 },
              ].map(c => (
                <div key={c.label} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="text-gray-600">{c.rang} {c.label}</span>
                  <span className="font-bold text-gray-900">{eur(c.val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gagnants */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Gagnants actuels
            </h2>
            {winners.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun acheteur pour l&apos;instant.</p>
            ) : (
              <div className="space-y-2">
                {winners.map(w => (
                  <div key={w.rang} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{['🥇', '🥈', '🥉'][w.rang - 1]}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{w.prenom} <span className="text-gray-400 font-normal">· {w.email}</span></p>
                        <p className="text-xs text-orange-500">{w.raison}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">{eur(w.montant)}</span>
                  </div>
                ))}
              </div>
            )}
            {!gagnantDevinette && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Personne n&apos;a encore trouvé la race.
              </p>
            )}
          </div>
        </div>

        {/* Devinettes les plus tentées */}
        {devinetteStats.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" /> Devinettes les plus tentées
            </h2>
            <div className="flex flex-wrap gap-2">
              {devinetteStats.map(([reponse, count]) => (
                <span key={reponse} className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  {reponse} <span className="font-bold text-gray-900">× {count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* File d'attente + ajout d'une grille */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* File d'attente */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" /> Grilles ({scheduled.length + 1})
            </h2>
            <ul className="space-y-2">
              {/* Grille en cours / affichée */}
              <li className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">●</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm capitalize">{grille.animal}</p>
                    <p className="text-xs text-gray-500">Race : {grille.race_secrete}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-700 text-right">
                  {grille.statut === 'active' ? 'En cours' : grille.statut === 'completed' ? 'Terminée' : grille.statut}
                  {grille.statut === 'active' && tempsRestant && (
                    <span className="block text-[11px] font-normal text-gray-500">{tempsRestant}</span>
                  )}
                </span>
              </li>
              {/* File d'attente */}
              {scheduled.map(s => (
                <li key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">{s.ordre}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm capitalize">{s.animal}</p>
                      <p className="text-xs text-gray-500">Race : {s.race_secrete}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">En attente</span>
                </li>
              ))}
            </ul>
            {scheduled.length === 0 && (
              <p className="text-gray-500 text-xs mt-3">Aucune grille en file. Ajoute-en une pour assurer la rotation.</p>
            )}
          </div>

          {/* Formulaire d'ajout */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" /> Ajouter une grille en file
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Animal (ex: chat)</label>
                <input
                  type="text" value={newAnimal} onChange={e => setNewAnimal(e.target.value)} required maxLength={50}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  placeholder="chat"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Race secrète (réponse à deviner)</label>
                <input
                  type="text" value={newRace} onChange={e => setNewRace(e.target.value)} required maxLength={100}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  placeholder="Maine Coon"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image (recadrée en carré 1500×1500)</label>
                <div className="flex gap-1 mb-2">
                  <button type="button" onClick={() => setImgMode('file')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${imgMode === 'file' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    Fichier
                  </button>
                  <button type="button" onClick={() => setImgMode('url')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${imgMode === 'url' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    URL
                  </button>
                </div>
                {imgMode === 'file' ? (
                  <input
                    type="file" accept="image/*" onChange={e => setNewFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:text-sm file:font-medium hover:file:bg-orange-100"
                  />
                ) : (
                  <input
                    type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  />
                )}
                {previewSrc && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt="Aperçu"
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
              <button
                type="submit" disabled={creating || !hasImage || !newAnimal.trim() || !newRace.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {creating ? 'Ajout…' : 'Ajouter à la file'}
              </button>
              {createMsg && <p className="text-xs text-gray-600">{createMsg}</p>}
            </form>
          </div>
        </div>

        {/* Sauvegardes CSV des grilles terminées (repliable) */}
        {backups.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <button
              onClick={() => setBackupsOpen(o => !o)}
              className="flex items-center gap-2 font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors"
            >
              {backupsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <Archive className="w-4 h-4 text-orange-500" /> Sauvegardes CSV ({backups.length})
            </button>
            {backupsOpen && (
            <ul className="space-y-2 mt-4">
              {backups.map(b => (
                <li key={b.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{b.name}</p>
                    {b.created_at && (
                      <p className="text-xs text-gray-500">{new Date(b.created_at).toLocaleString('fr-BE')}</p>
                    )}
                  </div>
                  {b.url && (
                    <a
                      href={b.url}
                      download={b.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </a>
                  )}
                </li>
              ))}
            </ul>
            )}
          </div>
        )}

        {/* Actions admin */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Actions admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modifier la race */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Race secrète {gagnantDevinette && <span className="text-gray-400">(déjà devinée, verrouillée)</span>}</label>
              <div className="flex gap-2">
                <input
                  type="text" value={raceEdit} onChange={e => setRaceEdit(e.target.value)}
                  disabled={!!gagnantDevinette || actionBusy}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={() => callManage({ action: 'set-race', race: raceEdit }, 'Race mise à jour.')}
                  disabled={!!gagnantDevinette || actionBusy || !raceEdit.trim()}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-40"
                >Enregistrer</button>
              </div>
            </div>

            {/* Terminer la grille */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Clôturer la grille</label>
              <button
                onClick={() => { if (confirm('Terminer définitivement cette grille maintenant ? Les gagnants seront calculés et les emails envoyés.')) callManage({ action: 'terminate' }, 'Grille terminée.'); }}
                disabled={grille.statut !== 'active' || actionBusy}
                className="w-full px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium disabled:opacity-40"
              >
                {grille.statut === 'active' ? 'Terminer maintenant' : 'Grille déjà terminée'}
              </button>
            </div>

            {/* Don reversé (grille terminée) */}
            {grille.statut === 'completed' && (
              <div className="md:col-span-2 border-t border-gray-100 pt-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Don reversé au refuge (preuve de transparence)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number" value={donMontant} onChange={e => setDonMontant(e.target.value)} placeholder="Montant en €"
                    className="sm:w-40 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <input
                    type="url" value={donPreuve} onChange={e => setDonPreuve(e.target.value)} placeholder="URL de la preuve (capture du virement)"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <button
                    onClick={() => callManage({ action: 'set-don', montantReverseCents: donMontant ? Math.round(parseFloat(donMontant) * 100) : null, preuveUrl: donPreuve.trim() || null }, 'Don enregistré.')}
                    disabled={actionBusy}
                    className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 whitespace-nowrap"
                  >Enregistrer</button>
                </div>
              </div>
            )}
          </div>
          {actionMsg && <p className="text-xs text-gray-600 mt-3">{actionMsg}</p>}
        </div>

        {/* Liste des acheteurs (repliable) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => setAchatsOpen(o => !o)}
              className="flex items-center gap-2 font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors"
            >
              {achatsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Achats ({rows.length})
            </button>
            {achatsOpen && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Rechercher prénom ou email…"
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 w-56 max-w-full"
                  />
                </div>
                <button
                  onClick={exportCSV}
                  disabled={rows.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            )}
          </div>

          {achatsOpen && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Prénom</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium text-right">Pixels</th>
                  <th className="py-2 pr-4 font-medium text-right">Montant</th>
                  <th className="py-2 pr-4 font-medium">Devinette</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aucun résultat.</td></tr>
                ) : filteredRows.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{r.prenom}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{r.email}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-900">{r.pixels}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-900">{eur(r.montant_cents)}</td>
                    <td className="py-2.5 pr-4">
                      {r.devinette ? (
                        <span className={r.devinette_correcte ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          {r.devinette}{r.devinette_correcte && ' ✓'}
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      {' '}
                      {new Date(r.created_at).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium mb-1.5">
        <span className="text-orange-500">{icon}</span> {label}
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
