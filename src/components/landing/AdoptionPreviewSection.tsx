import { unstable_noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const TYPES = ['chien', 'chat', 'oiseau', 'rongeur', 'reptile'] as const;

const TYPE_COLOR: Record<string, { bg: string; badge: string; border: string }> = {
  chien:   { bg: 'bg-orange-50',  badge: 'text-orange-700',  border: 'border-orange-200'  },
  chat:    { bg: 'bg-pink-50',    badge: 'text-pink-700',    border: 'border-pink-200'    },
  oiseau:  { bg: 'bg-blue-50',    badge: 'text-blue-700',    border: 'border-blue-200'    },
  rongeur: { bg: 'bg-teal-50',    badge: 'text-teal-700',    border: 'border-teal-200'    },
  reptile: { bg: 'bg-green-50',   badge: 'text-green-700',   border: 'border-green-200'   },
};

const LABEL: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', oiseau: 'Oiseau', rongeur: 'Rongeur', reptile: 'Reptile',
};

async function getOnePerType() {
  unstable_noStore();
  const supabase = createAdminClient();
  const results = await Promise.all(
    TYPES.map(async type => {
      const { data } = await supabase
        .from('adoption_posts')
        .select('id,animal_type,breed,age,region,photo_urls,poster_name')
        .eq('status', 'approved')
        .eq('animal_type', type)
        .limit(10);
      if (!data || data.length === 0) return null;
      return data[Math.floor(Math.random() * data.length)];
    })
  );
  return results.filter((p): p is NonNullable<typeof p> => p !== null);
}

export default async function AdoptionPreviewSection() {
  const posts = await getOnePerType();
  if (posts.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">Adoption</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Des animaux cherchent un foyer</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Chaque semaine, des animaux attendent une nouvelle famille. Peut-être le vôtre ?</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {posts.map(post => {
            const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.chien;
            const photo = post.photo_urls?.[0];
            return (
              <Link
                key={post.id}
                href={`/adoption/${post.id}`}
                className={`bg-white rounded-2xl border ${colors.border} overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-52`}
              >
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={LABEL[post.animal_type] ?? post.animal_type}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    />
                  ) : (
                    <div className={`w-full h-full ${colors.bg} flex items-center justify-center`}>
                      <Heart size={32} strokeWidth={1} className={`${colors.badge} opacity-30`} />
                    </div>
                  )}
                </div>
                <div className={`px-3 py-2 ${colors.bg} border-b ${colors.border}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${colors.badge}`}>
                    {LABEL[post.animal_type] ?? post.animal_type}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1">
                  {post.breed && <p className="text-sm font-medium text-gray-900 truncate">{post.breed}</p>}
                  {post.age   && <p className="text-xs text-gray-900">{post.age}</p>}
                  <p className="text-xs text-gray-900 mt-auto">{post.region}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/adoption"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Voir toutes les annonces
          </Link>
          <Link
            href="/adoption/deposer"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-orange-300 text-orange-700 hover:bg-orange-50 text-sm font-semibold rounded-xl transition-colors"
          >
            <Heart size={15} strokeWidth={1.5} />
            Déposer une annonce
          </Link>
        </div>
      </div>
    </section>
  );
}
