import BreedCriterePage, { getBreedCritereMetadata, getStaticAnimals } from '@/components/races/BreedCriterePage';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface Props { params: { animal: string } }

export function generateStaticParams() { return getStaticAnimals(); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return getBreedCritereMetadata(params, 'appartement');
}

export default function Page({ params }: Props) {
  return <BreedCriterePage params={params} critere="appartement" />;
}
