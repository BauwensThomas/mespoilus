import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import type { AdoptionPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, XCircle, Pencil } from 'lucide-react';
import DeletePostButton from './DeletePostButton';

export const revalidate = 0;

async function approvePost(id: string) {
  'use server';
  const deleteToken = randomBytes(4).toString('hex').toUpperCase();
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from('adoption_posts')
    .select('email, poster_name, animal_type, region')
    .eq('id', id)
    .single();

  await supabase
    .from('adoption_posts')
    .update({ status: 'approved', delete_token: deleteToken, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (post) {
    // Envoyer les alertes aux abonnés correspondants
    try {
      const { data: alerts } = await supabase
        .from('adoption_alerts')
        .select('email, confirm_token, animal, country')
        .eq('confirmed', true);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com';
      const animalLabels: Record<string, string> = { chien: 'chien', chat: 'chat', oiseau: 'oiseau', rongeur: 'rongeur', reptile: 'reptile' };
      const animalLabel = animalLabels[post.animal_type as string] ?? (post.animal_type as string);

      for (const alert of (alerts ?? []) as { email: string; confirm_token: string; animal: string; country: string }[]) {
        const matchAnimal  = alert.animal === 'tous' || alert.animal === (post.animal_type as string);
        const matchCountry = alert.country === 'tous' || (post.region as string ?? '').includes(alert.country);
        if (!matchAnimal || !matchCountry) continue;

        const unsubUrl = `${appUrl}/api/adoption/alerts/unsubscribe?token=${alert.confirm_token}`;
        await sendEmail({
          to: alert.email,
          subject: `Nouvelle annonce d'adoption : un ${animalLabel} cherche un foyer`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827">
              <h2 style="color:#f97316;margin-bottom:8px">Nouvelle annonce d'adoption</h2>
              <p>Un <strong>${animalLabel}</strong> cherche un foyer${post.region ? ` en <strong>${post.region}</strong>` : ''} !</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${appUrl}/adoption" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
                  Voir les annonces
                </a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
              <p style="font-size:11px;color:#9ca3af;text-align:center">
                <a href="${unsubUrl}" style="color:#9ca3af">Se désinscrire de ces alertes</a>
              </p>
            </div>
          `,
        }).catch(() => {});
      }
    } catch (alertErr) {
      console.error('[moderation] alerts send error:', alertErr);
    }

    try {
      await sendEmail({
        to: post.email,
        subject: 'Votre annonce est en ligne sur Mes Poilus !',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#f97316">Annonce publiée !</h2>
            <p>Bonjour <strong>${post.poster_name}</strong>,</p>
            <p>Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) est désormais visible sur Mes Poilus.</p>
            <p><a href="https://mespoilus.com/adoption" style="color:#f97316">→ Voir les annonces</a></p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
            <p style="font-size:13px;color:#6b7280">Pour supprimer votre annonce à tout moment, utilisez ce code sur la page de votre annonce :</p>
            <p style="font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:6px;color:#111;background:#f3f4f6;padding:14px 20px;border-radius:8px;text-align:center">${deleteToken}</p>
            <p style="font-size:12px;color:#9ca3af">Conservez ce code précieusement, il ne peut pas être récupéré.</p>
            <p>-L'équipe Mes Poilus</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('[moderation] approve mail error:', mailErr);
    }
  }

  revalidatePath('/moderation');
}

async function rejectPost(id: string, formData: FormData) {
  'use server';
  const reason = (formData.get('reason') as string)?.trim() ?? '';
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from('adoption_posts')
    .select('email, poster_name, animal_type, region')
    .eq('id', id)
    .single();

  await supabase
    .from('adoption_posts')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (post) {
    try {
      await sendEmail({
        to: post.email,
        subject: "Votre annonce d'adoption n'a pas été retenue",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#e11d48">Annonce refusée</h2>
            <p>Bonjour <strong>${post.poster_name}</strong>,</p>
            <p>Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) n'a pas pu être publiée.</p>
            ${reason ? `<div style="background:#fef2f2;border-left:3px solid #e11d48;padding:10px 14px;border-radius:4px;margin:12px 0"><p style="margin:0;font-size:14px"><strong>Raison :</strong> ${reason}</p></div>` : ''}
            <p style="color:#6b7280;font-size:13px">Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href="mailto:contact@mespoilus.com" style="color:#f97316">contact@mespoilus.com</a>.</p>
            <p>-L'équipe Mes Poilus</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('[moderation] reject mail error:', mailErr);
    }
  }

  revalidatePath('/moderation');
}

async function deletePost(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('adoption_posts').delete().eq('id', id);
  revalidatePath('/moderation');
}

async function getData(status: string) {
  const supabase = createAdminClient();
  const [postsRes, pendingRes] = await Promise.all([
    supabase
      .from('adoption_posts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false }),
    supabase
      .from('adoption_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);
  return {
    posts: (postsRes.data as AdoptionPost[]) ?? [],
    pendingCount: pendingRes.count ?? 0,
  };
}

const ANIMAL_LABELS: Record<string, string> = {
  chien: 'Chien',
  chat: 'Chat',
  oiseau: 'Oiseau',
  rongeur: 'Rongeur',
  reptile: 'Reptile',
  autre: 'Autre',
};

const TABS = [
  { id: 'pending',  label: 'En attente' },
  { id: 'approved', label: 'Approuvées' },
  { id: 'rejected', label: 'Rejetées'   },
];

interface Props {
  searchParams: { status?: string };
}

export default async function ModerationPage({ searchParams }: Props) {
  const activeStatus = searchParams.status ?? 'pending';
  const { posts, pendingCount } = await getData(activeStatus);

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Modération</h1>
        <p className="text-gray-500 text-base mt-1">Annonces d'adoption à valider</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => {
          const isActive = tab.id === activeStatus;
          return (
            <Link
              key={tab.id}
              href={`/moderation?status=${tab.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Liste */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-500">Aucune annonce dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map(post => {
            const approve = approvePost.bind(null, post.id);
            const rejectWithId = rejectPost.bind(null, post.id);
            const deleteWithId = deletePost.bind(null, post.id);
            const date    = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
            const animalLabel = ANIMAL_LABELS[post.animal_type] ?? post.animal_type;

            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

                {/* Photos */}
                {post.photo_urls?.length > 0 && (
                  <div className="grid grid-cols-5 gap-0.5 bg-gray-100">
                    {post.photo_urls.slice(0, 5).map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden bg-gray-200">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 20vw, 12vw"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="capitalize">{animalLabel}</span>
                      {post.breed && <span className="text-gray-500 font-normal">· {post.breed}</span>}
                    </span>
                    <span className="text-[10px] text-gray-400">{date}</span>
                  </div>

                  <div className="text-xs text-gray-700 space-y-0.5">
                    {post.age    && <p>Âge : {post.age} {post.gender !== 'inconnu' ? `· ${post.gender}` : ''}</p>}
                    <p>Ville : {post.region}</p>
                    <p className="text-gray-700">Par : {post.poster_name}</p>
                    <p className="text-gray-700">Email : {post.email}</p>
                    <p className="text-gray-700">Tél : {post.contact_info}</p>
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-3"><span className="font-semibold">Description : </span>{post.description}</p>
                  {post.reason && (
                    <p className="text-xs text-amber-900 line-clamp-2"><span className="font-semibold">Raison : </span>{post.reason}</p>
                  )}

                  {post.status === 'pending' && (
                    <div className="space-y-2 pt-1">
                      <form action={approve}>
                        <button type="submit" className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                          <CheckCircle2 size={14} strokeWidth={1.5} />
                          Approuver
                        </button>
                      </form>
                      <form action={rejectWithId} className="space-y-1.5">
                        <input
                          name="reason"
                          type="text"
                          required
                          placeholder="Raison du refus (obligatoire)…"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
                        />
                        <button type="submit" className="w-full px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                          <XCircle size={14} strokeWidth={1.5} />
                          Rejeter
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <Link href={`/moderation/${post.id}/edit`}
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                      <Pencil size={13} strokeWidth={1.5} />
                      Modifier
                    </Link>
                    <DeletePostButton action={deleteWithId} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
