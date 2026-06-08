'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, Heart, ArrowLeft, Mail, ChevronLeft, ChevronRight, User, Trash2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AdoptionPost } from '@/types';

const ANIMAL_TYPES = [
  { id: 'chien',   label: 'Chien',   icon: Dog   },
  { id: 'chat',    label: 'Chat',    icon: Cat   },
  { id: 'oiseau',  label: 'Oiseau',  icon: Bird  },
  { id: 'rongeur', label: 'Rongeur', icon: Mouse },
  { id: 'reptile', label: 'Reptile', icon: Zap   },
  { id: 'autre',   label: 'Autre',   icon: Heart },
];

const TYPE_COLOR: Record<string, { border: string; badge: string; bg: string }> = {
  chien:   { border: 'border-orange-200', badge: 'text-orange-700', bg: 'bg-orange-50'  },
  chat:    { border: 'border-pink-200',   badge: 'text-pink-700',   bg: 'bg-pink-50'    },
  oiseau:  { border: 'border-blue-200',   badge: 'text-blue-700',   bg: 'bg-blue-50'    },
  rongeur: { border: 'border-teal-200',   badge: 'text-teal-700',   bg: 'bg-teal-50'    },
  reptile: { border: 'border-green-200',  badge: 'text-green-700',  bg: 'bg-green-50'   },
  autre:   { border: 'border-gray-200',   badge: 'text-gray-700',   bg: 'bg-gray-50'    },
};

export default function AdoptionDetailClient({ post }: { post: AdoptionPost }) {
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [contactOpen, setContactOpen]         = useState(false);
  const [contactName, setContactName]         = useState('');
  const [contactEmail, setContactEmail]       = useState('');
  const [contactMsg, setContactMsg]           = useState('');
  const [contactLoading, setContactLoading]   = useState(false);
  const [contactSent, setContactSent]         = useState(false);
  const [contactError, setContactError]       = useState('');
  const [deleteOpen, setDeleteOpen]       = useState(false);
  const [deleteCode, setDeleteCode]       = useState('');
  const [deleteReason, setDeleteReason]   = useState<'adopted' | 'error' | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState('');
  const [deleted, setDeleted]             = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]       = useState(false);

  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
  const photos = post.photo_urls ?? [];

  async function handleForgot() {
    setForgotLoading(true);
    setForgotSent(false);
    setDeleteError('');
    try {
      await fetch('/api/adoption/forgot-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id }),
      });
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/adoption/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, token: deleteCode, reason: deleteReason ?? 'error' }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error ?? 'Erreur'); setDeleteLoading(false); return; }
      setDeleted(true);
      setTimeout(() => router.push('/adoption'), 2000);
    } catch {
      setDeleteError('Erreur inattendue');
      setDeleteLoading(false);
    }
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    try {
      const res = await fetch('/api/adoption/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, name: contactName, from_email: contactEmail, message: contactMsg }),
      });
      const data = await res.json();
      if (!res.ok) { setContactError(data.error ?? 'Erreur'); setContactLoading(false); return; }
      setContactSent(true);
    } catch {
      setContactError('Erreur inattendue. Réessayez.');
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Breadcrumb avec animation */}
        <div className="flex items-center gap-2 text-sm text-gray-500 fade-up">
          <Link href="/adoption" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors font-medium">
            <ArrowLeft size={15} strokeWidth={2} />
            Retour aux annonces
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">
            {typeInfo?.label ?? post.animal_type}{post.breed ? ` · ${post.breed}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Galerie photos avec animations */}
          <div className="space-y-3 fade-up">
            {photos.length > 0 ? (
              <>
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] group">
                  <Image
                    src={photos[photoIndex]}
                    alt={`${typeInfo?.label ?? post.animal_type} à adopter${post.breed ? ` - ${post.breed}` : ''}${post.region ? ` à ${post.region}` : ''}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                        aria-label="Photo précédente"
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronLeft size={18} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                        aria-label="Photo suivante"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {photoIndex + 1} / {photos.length}
                      </span>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${i === photoIndex ? 'border-orange-500' : 'border-transparent'}`}
                      >
                        <Image src={url} alt="" fill unoptimized className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={`rounded-2xl aspect-[4/3] ${colors.bg} flex items-center justify-center`}>
                <IconComponent size={64} strokeWidth={1} className={`${colors.badge} opacity-30`} />
              </div>
            )}
          </div>

          {/* Infos avec animations */}
          <div className="space-y-4 fade-up">
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {post.breed && (
                <div className="flex gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Race</span>
                  <span className="text-sm text-gray-900">{post.breed}</span>
                </div>
              )}
              {post.age && (
                <div className="flex gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Âge</span>
                  <span className="text-sm text-gray-900">{post.age}</span>
                </div>
              )}
              {post.gender && post.gender !== 'inconnu' && (
                <div className="flex gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Sexe</span>
                  <span className="text-sm text-gray-900 capitalize">{post.gender}</span>
                </div>
              )}
              <div className="flex gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Ville</span>
                <span className="text-sm text-gray-900">{post.region}</span>
              </div>
              <div className="flex gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Description</span>
                <span className="text-sm text-gray-900 leading-relaxed whitespace-pre-line break-words min-w-0">{post.description}</span>
              </div>
              {post.reason && (
                <div className="flex gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-500 w-28 flex-shrink-0">Raison du don</span>
                  <span className="text-sm text-gray-900 leading-relaxed break-words min-w-0">{post.reason}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User size={14} strokeWidth={1.5} />
                Par <span className="font-medium text-gray-700 ml-1">{post.poster_name}</span>
              </span>
              <span>{date}</span>
            </div>

            {/* Contact avec animations */}
            <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-3`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${colors.badge}`}>Contacter le déposant</p>
              {contactSent ? (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                  <CheckCircle2 size={16} strokeWidth={1.5} />
                  <span className="text-sm font-medium">Message envoyé ! Le déposant vous répondra par email.</span>
                </div>
              ) : contactOpen ? (
                <form onSubmit={handleContact} className="space-y-2.5">
                  <input
                    id="contact-name" name="name"
                    type="text" required value={contactName} onChange={e => setContactName(e.target.value)}
                    placeholder="Votre prénom…"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300 transition-all duration-300"
                  />
                  <input
                    id="contact-email" name="email"
                    type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="Votre email…"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300 transition-all duration-300"
                  />
                  <textarea
                    id="contact-message" name="message"
                    required rows={3} value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                    placeholder="Votre message… (présentez-vous, posez vos questions)"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300 resize-none transition-all duration-300"
                  />
                  {contactError && <p className="text-xs text-red-500">{contactError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={contactLoading}
                      className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                      <Send size={14} strokeWidth={1.5} />
                      {contactLoading ? 'Envoi…' : 'Envoyer'}
                    </button>
                    <button type="button" onClick={() => setContactOpen(false)}
                      className="px-3 py-2.5 bg-white border border-gray-300 text-gray-500 hover:text-gray-700 text-sm rounded-lg transition-all duration-300 hover:scale-105">
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setContactOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  <Mail size={15} strokeWidth={1.5} />
                  Contacter le déposant
                </button>
              )}
            </div>

            {/* Suppression */}
            {deleted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 text-sm font-medium">Annonce supprimée. Redirection…</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeleteOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-all duration-300"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                    {deleteOpen ? 'Annuler' : 'Supprimer mon annonce'}
                  </button>
                </div>
                {deleteOpen && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
                    <p className="text-xs text-gray-500 font-medium">Pourquoi retirez-vous cette annonce ?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setDeleteReason('adopted')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${deleteReason === 'adopted' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-500 hover:border-emerald-400'}`}>
                        <Heart size={12} strokeWidth={1.5} />
                        Animal adopté
                      </button>
                      <button type="button" onClick={() => setDeleteReason('error')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${deleteReason === 'error' ? 'border-gray-500 bg-gray-100 text-gray-700' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                        <AlertCircle size={12} strokeWidth={1.5} />
                        Erreur / Autre
                      </button>
                    </div>
                    <form onSubmit={handleDelete} className="flex gap-2">
                      <input
                        type="text"
                        value={deleteCode}
                        onChange={e => setDeleteCode(e.target.value)}
                        placeholder="Code reçu par email"
                        maxLength={8}
                        required
                        className="flex-1 min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest uppercase text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200 transition-all duration-300"
                      />
                      <button type="submit" disabled={deleteLoading || !deleteReason}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105">
                        {deleteLoading ? '…' : 'Supprimer'}
                      </button>
                    </form>
                    {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                    {forgotSent ? (
                      <p className="text-xs text-emerald-600">Email envoyé ! Vérifiez votre boîte.</p>
                    ) : (
                      <button type="button" onClick={handleForgot} disabled={forgotLoading}
                        className="text-xs text-gray-400 hover:text-orange-500 transition-all duration-300 disabled:opacity-50">
                        {forgotLoading ? 'Envoi…' : 'Code oublié ? Recevoir par email →'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA déposer avec animation */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 fade-up hover:shadow-md transition-all duration-300">
          <div>
            <p className="font-semibold text-gray-900">Vous avez un animal à donner ?</p>
            <p className="text-sm text-gray-600 mt-0.5">Déposez une annonce gratuitement et trouvez un foyer aimant.</p>
          </div>
          <Link
            href="/adoption/deposer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Heart size={15} strokeWidth={1.5} />
            Déposer une annonce
          </Link>
        </div>

      </div>
    </div>
  );
}