import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { categories, totalInserted, totalUpdated } = await req.json() as {
    categories: Array<{ label: string; inserted: number; updated: number }>;
    totalInserted: number;
    totalUpdated: number;
  };

  const rowsHtml = categories.map(c =>
    `<tr>
      <td style="padding:6px 8px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6">${c.label}</td>
      <td style="padding:6px 8px;font-size:13px;font-weight:600;color:#059669;text-align:center;border-bottom:1px solid #f3f4f6">+${c.inserted}</td>
      <td style="padding:6px 8px;font-size:13px;font-weight:600;color:#0284c7;text-align:center;border-bottom:1px solid #f3f4f6">↻${c.updated}</td>
    </tr>`
  ).join('');

  const html = cronEmailWrapper(
    'Catalog Sync V2 terminé',
    'Boutique',
    statsRow([
      { label: 'Nouvelles fiches', value: totalInserted, color: '#059669' },
      { label: 'Offres màj',       value: totalUpdated,  color: '#0284c7' },
    ]) +
    `<table style="width:100%;border-collapse:collapse;margin-top:8px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:6px 8px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:.04em">Catégorie</th>
          <th style="padding:6px 8px;font-size:11px;font-weight:700;color:#059669;text-align:center;text-transform:uppercase;letter-spacing:.04em">Nouvelles</th>
          <th style="padding:6px 8px;font-size:11px;font-weight:700;color:#0284c7;text-align:center;text-transform:uppercase;letter-spacing:.04em">Màj</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`,
  );

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Catalog Sync - ${totalInserted} nouvelles fiches · ${totalUpdated} offres màj`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur email' }, { status: 500 });
  }
}
