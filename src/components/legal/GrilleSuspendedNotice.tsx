import { isGrilleVisible } from '@/lib/site-settings';

/** Pages légales : le texte du jeu reste, avec la mention de suspension quand il est masqué. */
export default async function GrilleSuspendedNotice() {
  if (await isGrilleVisible()) return null;
  return (
    <p className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-3 text-sm text-amber-700 font-medium">
      Jeu actuellement suspendu : la Grille Mystère n&apos;est pas accessible et aucun achat n&apos;est possible.
    </p>
  );
}
