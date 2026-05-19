import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AdoptionDetailClient from './AdoptionDetailClient';
import type { AdoptionPost } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

const ANIMAL_LABEL: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', oiseau: 'Oiseau',
  rongeur: 'Rongeur', reptile: 'Reptile', autre: 'Animal',
};

async function getPost(id: string): Promise<AdoptionPost | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('adoption_posts')
      .select('id, poster_name, email, animal_type, breed, age, gender, region, description, reason, photo_urls, status, created_at, updated_at, contact_info, deleted_at, deleted_by, deleted_reason')
      .eq('id', id)
      .eq('status', 'approved')
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);
  if (!post) return { title: 'Annonce introuvable | Mes Poilus' };

  const animalLabel = ANIMAL_LABEL[post.animal_type] ?? 'Animal';
  const subject = post.breed ?? animalLabel;
  const title = `${subject} à adopter${post.region ? ` — ${post.region}` : ''} | Mes Poilus`;
  const description = post.description
    ? post.description.slice(0, 155) + (post.description.length > 155 ? '…' : '')
    : `Adoptez ce ${animalLabel.toLowerCase()}${post.region ? ` à ${post.region}` : ''} sur Mes Poilus.`;
  const image = post.photo_urls?.[0];
  const url = `${APP_URL}/adoption/${post.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Mes Poilus',
      ...(image ? { images: [{ url: image, width: 800, height: 600, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  };
}

export default async function AdoptionDetailPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) notFound();

  const animalLabel = ANIMAL_LABEL[post.animal_type] ?? 'Animal';
  const subject = post.breed ?? animalLabel;
  const title = `${subject} à adopter${post.region ? ` à ${post.region}` : ''}`;
  const description = post.description?.slice(0, 200) ?? '';
  const image = post.photo_urls?.[0];
  const url = `${APP_URL}/adoption/${post.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    name: title,
    description,
    url,
    datePublished: post.created_at,
    ...(image ? { image: { '@type': 'ImageObject', url: image, contentUrl: image } } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Mes Poilus',
      url: APP_URL,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/favicon.ico` },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Adoption', item: `${APP_URL}/adoption` },
        { '@type': 'ListItem', position: 2, name: title, item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdoptionDetailClient post={post} />
    </>
  );
}
