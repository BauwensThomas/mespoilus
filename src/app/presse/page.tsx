import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { Mail, Download, ExternalLink, PawPrint } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Espace presse & partenaires — Mes Poilus',
  description: 'Kit presse, description du site et contact pour les journalistes, blogueurs et partenaires souhaitant parler de Mes Poilus.',
  robots: { index: true, follow: true },
};

async function getStats() {
  try {
    const supabase = createAdminClient();
    const [articlesRes, breedsRes] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('breeds').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);
    return {
      articles: articlesRes.count ?? 0,
      breeds: breedsRes.count ?? 0,
    };
  } catch {
    return { articles: 0, breeds: 0 };
  }
}

export const revalidate = 3600;

export default async function PressePage() {
  const { articles, breeds } = await getStats();

  const stats = [
    { label: 'Articles publiés', value: articles > 0 ? `${articles}+` : '50+' },
    { label: 'Fiches races', value: breeds > 0 ? `${breeds}+` : '100+' },
    { label: 'Catégories animales', value: '5' },
    { label: 'Outils gratuits', value: '4' },
  ];

  const description = `Mes Poilus est un site de référence francophone dédié aux animaux de compagnie. Il propose des articles de conseils vétérinaires et pratiques, des fiches races détaillées, des outils interactifs (calculateur d'âge, quiz, générateur de prénoms) et une section adoption pour aider les animaux à trouver un foyer. Le contenu est rédigé de manière claire et accessible, avec pour objectif d'accompagner chaque propriétaire d'animal au quotidien.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-orange-600 rounded-xl text-white">
              <PawPrint size={22} strokeWidth={1.5} />
            </div>
            <span className="font-bold text-gray-900 text-xl">Mes Poilus</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Espace presse & partenaires</h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Vous souhaitez parler de Mes Poilus, établir un partenariat ou obtenir des ressources pour un article ? Tout est ici.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">

            {/* À propos */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">À propos du site</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{description}</p>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-widest mb-2">Description courte (à copier-coller)</p>
                <p className="text-sm text-gray-800 leading-relaxed italic">
                  "Mes Poilus est le guide de référence francophone pour les propriétaires d'animaux de compagnie : conseils, fiches races, outils pratiques et petites annonces d'adoption."
                </p>
              </div>
            </section>

            {/* Statistiques */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Chiffres clés</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(({ label, value }) => (
                  <div key={label} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Ce qu'on propose */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ce que propose Mes Poilus</h2>
              <ul className="space-y-3">
                {[
                  { title: 'Blog de conseils', desc: 'Articles pratiques sur la santé, l\'alimentation et le comportement des animaux.' },
                  { title: 'Fiches races', desc: 'Fiches détaillées (caractère, soins, convient pour) pour chiens, chats, oiseaux, rongeurs et reptiles.' },
                  { title: 'Outils interactifs', desc: 'Calculateur d\'âge, quiz "quel animal pour moi ?", générateur de prénoms, guides PDF gratuits.' },
                  { title: 'Adoption', desc: 'Annonces d\'adoption entre particuliers avec alertes email personnalisées.' },
                  { title: 'Boutique', desc: 'Sélection de produits animaliers via des partenaires affiliés de confiance.' },
                ].map(({ title, desc }) => (
                  <li key={title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">{title}</span>
                      <span className="text-gray-500 text-sm"> — {desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Thématiques */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Thématiques couvertes</h2>
              <div className="flex flex-wrap gap-2">
                {['Chiens', 'Chats', 'Oiseaux', 'Rongeurs', 'Reptiles', 'Santé animale', 'Alimentation', 'Éducation', 'Adoption', 'Bien-être animal', 'Races', 'Accessoires'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar contact + ressources */}
          <div className="space-y-6">

            {/* Contact */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Contact presse</h2>
              <p className="text-gray-500 text-sm mb-4">Pour toute demande de partenariat, article, interview ou collaboration.</p>
              <a
                href="mailto:contact@mespoilus.com?subject=Demande partenariat / presse — Mes Poilus"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <Mail size={16} strokeWidth={1.5} />
                contact@mespoilus.com
              </a>
            </section>

            {/* Logo */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Logo & identité</h2>
              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 mb-4 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-600 rounded-lg text-white">
                    <PawPrint size={22} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-gray-900 text-xl">Mes Poilus</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between"><span>Couleur principale</span><span className="font-mono text-orange-600">#f97316</span></div>
                <div className="flex justify-between"><span>Couleur texte</span><span className="font-mono text-gray-900">#111827</span></div>
                <div className="flex justify-between"><span>Police</span><span>Inter (système)</span></div>
              </div>
            </section>

            {/* Liens */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Liens utiles</h2>
              <ul className="space-y-2">
                {[
                  { href: '/blog', label: 'Blog' },
                  { href: '/races', label: 'Fiches races' },
                  { href: '/adoption', label: 'Adoption' },
                  { href: 'https://www.instagram.com/mespoilusofficiel', label: 'Instagram', external: true },
                  { href: 'https://www.facebook.com/profile.php?id=61589487954538', label: 'Facebook', external: true },
                ].map(({ href, label, external }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition-colors group"
                    >
                      {label}
                      <ExternalLink size={13} strokeWidth={1.5} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700 leading-relaxed">
                Nous répondons à toutes les demandes sous <strong>48h ouvrées</strong>. Pour les partenariats commerciaux, merci de préciser votre site et vos objectifs.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
