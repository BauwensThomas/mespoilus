// Helper partagé pour les emails de notification des crons

const LOGO_URL = 'https://ccpkrprfvbgsvobudlam.supabase.co/storage/v1/object/public/partner-logos/logo.jpg';

export function emailWrapper(title: string, body: string): string {
  return `<div style="font-family:sans-serif;width:100%;background:#f9fafb;padding:16px 0">
    <div style="max-width:680px;width:100%;margin:0 auto">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
      <div style="background-color:#ea580c;padding:20px 24px">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;padding-right:12px"><img src="${LOGO_URL}" width="36" height="36" alt="Mes Poilus" style="display:block;border:0"></td>
          <td style="vertical-align:middle"><span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.3px">Mes Poilus</span></td>
        </tr></table>
        <h1 style="color:white;font-size:17px;font-weight:700;margin:10px 0 0;line-height:1.3">${title}</h1>
      </div>
      <div style="padding:24px 28px">${body}</div>
      <div style="padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
        <p style="font-size:11px;color:#9ca3af;margin:0 0 10px">Mes Poilus - <a href="https://mespoilus.com" style="color:#9ca3af">mespoilus.com</a></p>
        <a href="https://www.facebook.com/profile.php?id=61589487954538" style="display:inline-block;margin:0 4px;background:#1877f2;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Facebook</a>
        <a href="https://www.instagram.com/mespoilusofficiel/" style="display:inline-block;margin:0 4px;background:#e1306c;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Instagram</a>
      </div>
    </div>
    </div>
  </div>`;
}

export function mdToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#### (.+)$/gm, '<h4 style="color:#374151;font-size:13px;font-weight:700;margin:14px 0 4px">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#1f2937;font-size:14px;font-weight:700;margin:18px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#111827;font-size:16px;font-weight:700;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#111827;font-size:18px;font-weight:700;margin:20px 0 8px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;color:#374151">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul style="padding-left:20px;margin:8px 0">${m}</ul>`)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export function cronEmailWrapper(title: string, subtitle: string, body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:720px;margin:0 auto;color:#111;background:#f9fafb;padding:24px">
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <div style="background-color:#ea580c;background:linear-gradient(135deg,#ea580c,#111827);padding:20px 24px">
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px"><tr>
            <td style="vertical-align:middle;padding-right:12px"><img src="${LOGO_URL}" width="36" height="36" alt="Mes Poilus" style="display:block;border:0"></td>
            <td style="vertical-align:middle"><span style="color:white;font-size:18px;font-weight:700">Mes Poilus</span></td>
          </tr></table>
          <p style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">${subtitle}</p>
          <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">${title}</h1>
        </div>
        <div style="padding:24px 28px">${body}</div>
        <div style="padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">Mes Poilus - notification automatique</p>
        </div>
      </div>
    </div>`;
}

export function statBadge(label: string, value: string | number, color = '#f97316'): string {
  return `<div style="text-align:center;padding:12px 16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
    <div style="font-size:22px;font-weight:700;color:${color}">${value}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.04em">${label}</div>
  </div>`;
}

export function statsRow(stats: Array<{ label: string; value: string | number; color?: string }>): string {
  return `<div style="display:grid;grid-template-columns:repeat(${stats.length},1fr);gap:10px;margin-bottom:20px">
    ${stats.map(s => statBadge(s.label, s.value, s.color)).join('')}
  </div>`;
}

export function sectionBlock(title: string, content: string, borderColor = '#f97316', bgColor = '#fff7ed'): string {
  return `<div style="margin-bottom:24px">
    <div style="background:${bgColor};border-left:4px solid ${borderColor};padding:10px 14px;margin-bottom:12px;border-radius:0 8px 8px 0">
      <p style="font-size:13px;font-weight:700;color:${borderColor};margin:0">${title}</p>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#374151">${content}</div>
  </div>`;
}

export function errorBlock(errors: string[]): string {
  if (!errors.length) return '';
  return `<div style="margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca">
    <p style="font-size:12px;font-weight:700;color:#dc2626;margin:0 0 6px">Erreurs (${errors.length})</p>
    ${errors.map(e => `<p style="font-size:12px;color:#374151;margin:4px 0">• ${e}</p>`).join('')}
  </div>`;
}
