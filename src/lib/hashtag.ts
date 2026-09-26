// Convertit une expression multi-mots ("mon chat perd ses poils") en hashtag lisible
// ("MonChatPerdSesPoils") : les seo_keywords sont des phrases, pas des hashtags.
export function toHashtag(keyword: string): string {
  return keyword.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
