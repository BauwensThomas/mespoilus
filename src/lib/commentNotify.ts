import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';

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
    const html = buildEmailHtml({ articleTitle, articleUrl, authorName: comment.author_name, unsubscribeUrl });

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
  unsubscribeUrl,
}: {
  articleTitle: string;
  articleUrl: string;
  authorName: string;
  unsubscribeUrl: string;
}) {
  const body = `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      <strong>${authorName}</strong> vient de laisser un commentaire sur l'article
      <a href="${articleUrl}" style="color:#ea580c;font-weight:600;text-decoration:none">« ${articleTitle} »</a>.
    </p>
    <a href="${articleUrl}#commentaires" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:13px">
      Lire le commentaire
    </a>
    <p style="font-size:11px;color:#9ca3af;margin:24px 0 0">
      Vous recevez cet email car vous avez commenté cet article. -
      <a href="${unsubscribeUrl}" style="color:#9ca3af">Se désinscrire</a>
    </p>`;
  return emailWrapper(`Nouveau commentaire sur « ${articleTitle} »`, body);
}
