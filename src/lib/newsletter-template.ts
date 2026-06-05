// Template HTML FIXE de la newsletter (déterministe, 100 % fiable).
// Sofia ne fournit que le TEXTE (intro + conseil) ; tout le HTML (header orange,
// cartes articles, section grille, footer orange) est assemblé ici, en code.

export interface NlArticle {
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
}

export interface NlGrille {
  imageUrl: string;
  pctLabel: string;
  jours: number | null; // null = pas encore démarrée (aucun pixel acheté) → pas de compte à rebours
}

const ORANGE = '#ea580c';
const TEXT = '#1f2937';
const MUTED = '#374151';
const LOGO = 'https://ccpkrprfvbgsvobudlam.supabase.co/storage/v1/object/public/partner-logos/logo.jpg';
const FB = 'https://www.facebook.com/profile.php?id=61589487954538';
const INSTA = 'https://www.instagram.com/mespoilusofficiel/';

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Texte simple → HTML : échappe, transforme les sauts de ligne en <br>, en paragraphes.
function textToHtml(s: string): string {
  return esc(s.trim())
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px;color:${MUTED};font-size:16px;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function articleCard(a: NlArticle): string {
  const img = a.image_url
    ? `<img src="${a.image_url}" alt="${esc(a.title)}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px;display:block">`
    : '';
  return `
    <table class="nl-art" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px">
      <tr><td style="padding:16px">
        ${img}
        <h3 style="margin:0 0 8px;font-size:17px;font-weight:700;color:${TEXT}">${esc(a.title)}</h3>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${MUTED}">${esc(a.excerpt ?? '')}</p>
        <a href="https://www.mespoilus.com/blog/${a.slug}" style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:10px 22px;border-radius:8px">Lire l'article</a>
      </td></tr>
    </table>`;
}

function grilleSection(g: NlGrille): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fff7ed;border:1px dashed ${ORANGE};border-radius:12px">
      <tr><td style="padding:18px;text-align:center">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${ORANGE}">Jeu en cours</p>
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${TEXT}">La Grille Mystère : sauras-tu percer le secret ?</h3>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${MUTED}">Un animal mystère se cache derrière une grille de pixels. Révèle-les en achetant des pixels, devine la race en premier et remporte l'un des 3 cadeaux. Une partie des recettes est reversée à un refuge ou à une association.</p>
        <img src="${g.imageUrl}" alt="Grille Mystère" style="display:block;margin:0 auto 14px;width:100%;max-width:260px;border-radius:8px">
        <p style="margin:0 0 14px;font-size:13px;color:${MUTED}"><strong>${g.pctLabel}%</strong> de l'image révélée${g.jours !== null ? ` - il reste <strong>${g.jours} jours</strong>` : ' - sois le premier à jouer, le compte à rebours démarre au 1er pixel acheté'}.</p>
        <a href="https://www.mespoilus.com/grille" style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:10px 24px;border-radius:8px">Acheter des pixels et jouer</a>
      </td></tr>
    </table>`;
}

export function buildNewsletterHtml(opts: {
  intro: string;
  conseil: string;
  articles: NlArticle[];
  grille: NlGrille | null;
  year: number;
}): string {
  const { intro, conseil, articles, grille, year } = opts;
  return `<style>@media only screen and (max-width:600px){.nl-out{padding:0 1mm!important}.nl-in{border-radius:0!important}.nl-hd{padding:16px 14px!important}.nl-bd{padding:16px 14px!important}.nl-art td{padding:12px!important}.nl-ft{padding:16px 14px!important}}</style>
<table class="nl-out" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:16px 0;font-family:Arial,sans-serif">
  <tr><td align="center">
    <table class="nl-in" width="860" cellpadding="0" cellspacing="0" border="0" style="max-width:860px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">

      <!-- Header orange -->
      <tr><td class="nl-hd" style="background-color:${ORANGE};padding:28px 32px;text-align:center">
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px">
          <tr>
            <td style="vertical-align:middle;padding-right:10px"><img src="${LOGO}" width="40" height="40" alt="Mes Poilus" style="display:block;border:0;border-radius:50%"></td>
            <td style="vertical-align:middle"><span style="color:#fff;font-size:20px;font-weight:700">Mes Poilus</span></td>
          </tr>
        </table>
        <p style="margin:0;color:rgba(255,255,255,.92);font-size:14px">Tes conseils animaux de la semaine</p>
      </td></tr>

      <!-- Corps -->
      <tr><td class="nl-bd" style="padding:28px 32px">
        ${textToHtml(intro)}

        <h2 style="margin:24px 0 14px;font-size:16px;font-weight:800;color:${TEXT};text-transform:uppercase;letter-spacing:.03em">Cette semaine sur Mes Poilus</h2>
        ${articles.map(articleCard).join('')}

        ${grille ? grilleSection(grille) : ''}

        <h2 style="margin:24px 0 12px;font-size:16px;font-weight:800;color:${TEXT};text-transform:uppercase;letter-spacing:.03em">Le conseil de Sofia</h2>
        ${textToHtml(conseil)}

        <p style="margin:24px 0 0;font-size:15px;color:${MUTED}">À très vite,<br><strong>Sofia &amp; l'équipe Mes Poilus</strong></p>
      </td></tr>

      <!-- Footer orange -->
      <tr><td class="nl-ft" style="background-color:${ORANGE};padding:22px 32px;text-align:center">
        <p style="margin:0 0 10px">
          <a href="${FB}" style="display:inline-block;margin:0 4px;background:#1877f2;color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:5px;text-decoration:none">Facebook</a>
          <a href="${INSTA}" style="display:inline-block;margin:0 4px;background:#e1306c;color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:5px;text-decoration:none">Instagram</a>
        </p>
        <p style="margin:0 0 6px;color:rgba(255,255,255,.92);font-size:12px">© ${year} Mes Poilus - Tous droits réservés</p>
        <p style="margin:0;font-size:11px"><a href="{{UNSUBSCRIBE_URL}}" style="color:rgba(255,255,255,.85);text-decoration:underline">Se désabonner</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>`;
}
