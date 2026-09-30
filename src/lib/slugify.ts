// Slug ASCII strict : retire les accents (NFD) puis remplace tout caractère non [a-z0-9] par un tiret.
// Un slug accentué casse l'URL /blog/{slug} (Next reçoit "%C3%A9" → 404), les noms de fichiers
// Supabase Storage (clé refusée) et l'extraction du slug dans les posts sociaux.
export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
