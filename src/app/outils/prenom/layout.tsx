import type { Metadata } from 'next';
import { getMetaOverride } from '@/lib/seo-overrides';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: "Générateur de prénoms pour animaux",
    description: "Trouvez le prénom parfait pour votre animal. Des centaines d'idées de noms pour chiens, chats, lapins, oiseaux et rongeurs.",
    openGraph: {
      title: "Générateur de prénoms pour animaux | Mes Poilus",
      description: "Des centaines d'idées de noms pour chiens, chats, lapins, oiseaux et rongeurs.",
      url: 'https://www.mespoilus.com/outils/prenom',
      siteName: 'Mes Poilus',
    },
    alternates: { canonical: 'https://www.mespoilus.com/outils/prenom' },
  };
  const override = await getMetaOverride('/outils/prenom');
  return {
    ...base,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <section className="mt-12 border-t border-gray-100 pt-10 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Comment choisir le prénom de son animal ?</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Le prénom d&apos;un animal de compagnie s&apos;utilise des dizaines de fois par jour pendant de nombreuses années. Un bon prénom doit être court (deux syllabes maximum), facile à prononcer clairement et distinct des mots de commandement courants comme &laquo;&nbsp;assis&nbsp;&raquo; ou &laquo;&nbsp;non&nbsp;&raquo;. Les chiens répondent mieux aux prénoms avec des voyelles ouvertes et des consonnes sonores.
            </p>
            <p>
              Notre générateur propose des centaines d&apos;idées classées par espèce (chien, chat, lapin, oiseau, rongeur, reptile) et par thème : prénoms humains, prénoms nature, prénoms de personnages, prénoms courts, prénoms originaux. Vous pouvez filtrer par lettre initiale si la portée de l&apos;année impose une lettre particulière (en France, la SCC attribue une lettre par année de naissance pour les chiens de race).
            </p>
            <p>
              Pour les chats, les prénoms sifflants (avec des &laquo;&nbsp;s&nbsp;&raquo; ou &laquo;&nbsp;ch&nbsp;&raquo;) attirent naturellement leur attention. Pour les perroquets et perruches, un prénom court que l&apos;oiseau pourra éventuellement répéter est un choix amusant. Pour les lapins et les rongeurs, choisissez un prénom que vous pourrez dire avec enthousiasme, car c&apos;est souvent la tonalité vocale qui déclenche leur réaction.
            </p>
            <p>
              Une fois votre choix fait, utilisez le prénom systématiquement dès les premiers jours, associé à des moments positifs (repas, câlins, jeu). La répétition et la constance sont les clés pour que l&apos;animal associe ce son à sa propre identité.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
