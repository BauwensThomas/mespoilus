import BreedCriterePage, { getBreedCritereMetadata, getStaticAnimals } from '@/components/races/BreedCriterePage';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface Props { params: Promise<{ animal: string }>; searchParams?: Promise<{ q?: string; view?: string }> }

export function generateStaticParams() { return getStaticAnimals(); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return getBreedCritereMetadata(resolvedParams, 'enfants');
}

export default async function Page({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <BreedCriterePage params={resolvedParams} critere="enfants" searchParams={resolvedSearchParams} />;
}
