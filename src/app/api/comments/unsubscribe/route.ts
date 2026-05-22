import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return new NextResponse('Token manquant', { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('comment_subscriptions')
    .delete()
    .eq('unsubscribe_token', token);

  if (error) return new NextResponse('Erreur serveur', { status: 500 });

  return new NextResponse(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Désinscription</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .box{background:#fff;border-radius:16px;padding:32px;max-width:400px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{color:#111827;font-size:1.25rem;margin:0 0 8px}p{color:#6b7280;font-size:.95rem;margin:0 0 20px}
    a{display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600}</style>
    </head><body><div class="box"><h1>Desinscription confirmee</h1>
    <p>Vous ne recevrez plus d'emails pour les commentaires de cet article.</p>
    <a href="https://www.mespoilus.com/blog">Retour au blog</a></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
