const FROM_EMAIL = 'Mes Poilus <newsletter@mespoilus.com>';
const REPLY_TO   = 'contact@mespoilus.com';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY manquant');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: REPLY_TO,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend: ${res.status} — ${err}`);
  }

  return res.json() as Promise<{ id: string }>;
}

export async function sendBulkNewsletter({
  subject,
  html,
  subscribers,
}: {
  subject: string;
  html: string;
  subscribers: string[];
}): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com';

  for (const email of subscribers) {
    try {
      const token = Buffer.from(email).toString('base64url');
      const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?t=${token}`;
      const personalizedHtml = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
      await sendEmail({ to: email, subject, html: personalizedHtml });
      sent++;
      await new Promise((r) => setTimeout(r, 120)); // ~8 req/s, sous la limite Resend
    } catch (err) {
      console.error(`[resend] Échec envoi → ${email}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
