import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import type { AdoptionPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { CheckCircle2, XCircle, MapPin } from 'lucide-react';

export const revalidate = 0;

async function updateStatus(id: string, status: 'approved' | 'rejected') {
  'use server';
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from('adoption_posts')
    .select('email, poster_name, animal_type, region')
    .eq('id', id)
    .single();

  await supabase
    .from('adoption_posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (post) {
    try {
      if (status === 'approved') {
        await sendEmail({
          to: post.email,
          subject: 'Votre annonce est en ligne sur Mes Poilus !',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
              <h2 style="color:#f97316">Annonce publiée !</h2>
              <p>Bonjour <strong>${post.poster_name}</strong>,</p>
              <p>Bonne nouvelle ! Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) a été validée et est désormais visible sur Mes Poilus.</p>
              <p><a href="https://mespoilus.com/adoption" style="color:#f97316">→ Voir les annonces</a></p>
              <p>-L'équipe Mes Poilus</p>
            </div>
          `,
        });
      } else {
        await sendEmail({
          to: post.email,
          subject: "Votre annonce d'adoption n'a pas été retenue",
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
              <h2 style="color:#e11d48">Annonce refusée</h2>
              <p>Bonjour <strong>${post.poster_name}</strong>,</p>
              <p>Après vérification, votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) n'a pas pu être publiée car elle ne respecte pas nos conditions d'utilisation.</p>
              <p style="color:#6b7280;font-size:13px">Si vous pensez qu'il s'agit d'une erreur, répondez simplement à cet email.</p>
              <p>-L'équipe Mes Poilus</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.error('[moderation] mail error:', mailErr);
    }
  }

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
            const approve = updateStatus.bind(null, post.id, 'approved');
            const reject  = updateStatus.bind(null, post.id, 'rejected');
            const date    = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
            const animalLabel = ANIMAL_LABELS[post.animal_type] ?? post.animal_type;

            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="capitalize">{animalLabel}</span>
                    {post.breed && <span className="text-gray-500 font-normal">· {post.breed}</span>}
                  </span>
                  <span className="text-[10px] text-gray-400">{date}</span>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5">
                  {post.age    && <p>Âge : {post.age} {post.gender !== 'inconnu' ? `· ${post.gender}` : ''}</p>}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} strokeWidth={1.5} />
                    <span>{post.region}</span>
                  </div>
                  <p className="text-gray-400">Par : {post.poster_name} · {post.email}</p>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{post.description}</p>

                <p className="text-xs text-orange-600">Contact public : {post.contact_info}</p>

                {post.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <form action={approve}>
                      <button type="submit" className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <CheckCircle2 size={14} strokeWidth={1.5} />
                        Approuver
                      </button>
                    </form>
                    <form action={reject}>
                      <button type="submit" className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <XCircle size={14} strokeWidth={1.5} />
                        Rejeter
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
