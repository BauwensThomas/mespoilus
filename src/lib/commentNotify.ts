import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

export async function notifyCommentSubscribers(commentId: string): Promise<void> {
  const supabase = createAdminClient();

  // Fetch the approved comment
  const { data: comment } = await supabase
    .from('article_comments')
    .select('article_slug, author_name, content, email')
    .eq('id', commentId)
    .single();

  if (!comment) return;

  // Fetch article title
  const { data: article } = await supabase
    .from('articles')
    .select('title')
    .eq('slug', comment.article_slug)
    .single();

  const articleTitle = article?.title ?? comment.article_slug;

  // Fetch subscribers for this article, excluding the commenter themselves
  const { data: subscribers } = await supabase
    .from('comment_subscriptions')
    .select('email, unsubscribe_token')
    .eq('article_slug', comment.article_slug)
    .neq('email', comment.email ?? '');

  if (!subscribers?.length) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';
  const articleUrl = `${appUrl}/blog/${comment.article_slug}`;

  for (const sub of subscribers) {
    const unsubscribeUrl = `${appUrl}/api/comments/unsubscribe?token=${sub.unsubscribe_token}`;
    const html = buildEmailHtml({
      articleTitle,
      articleUrl,
      authorName: comment.author_name,
      commentContent: comment.content,
      unsubscribeUrl,
    });

    try {
      await sendEmail({
        to: sub.email,
        subject: `Nouveau commentaire sur « ${articleTitle} »`,
        html,
      });
    } catch (err) {
      console.error(`[commentNotify] Échec envoi → ${sub.email}:`, err);
    }
  }
}

function buildEmailHtml({
  articleTitle,
  articleUrl,
  authorName,
  commentContent,
  unsubscribeUrl,
}: {
  articleTitle: string;
  articleUrl: string;
  authorName: string;
  commentContent: string;
  unsubscribeUrl: string;
}) {
  const escaped = commentContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nouveau commentaire</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <tr><td style="background:#ea580c;padding:24px 32px">
    <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700">🐾 Mes Poilus</p>
  </td></tr>
  <tr><td style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:1.15rem;color:#111827">Nouveau commentaire sur un article que vous suivez</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:.9rem">
      <strong>${authorName}</strong> vient de laisser un commentaire sur
      <a href="${articleUrl}" style="color:#ea580c;text-decoration:none;font-weight:600">« ${articleTitle} »</a>.
    </p>
    <blockquote style="margin:0 0 24px;padding:16px 20px;background:#f9fafb;border-left:4px solid #ea580c;border-radius:0 8px 8px 0">
      <p style="margin:0;color:#374151;font-size:.95rem;line-height:1.6">${escaped}</p>
    </blockquote>
    <a href="${articleUrl}#commentaires" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:.9rem">
      Voir la discussion
    </a>
  </td></tr>
  <tr><td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6">
    <p style="margin:0;font-size:.75rem;color:#9ca3af;text-align:center">
      Vous recevez cet email car vous avez commenté cet article.
      <a href="${unsubscribeUrl}" style="color:#9ca3af">Se désinscrire</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
