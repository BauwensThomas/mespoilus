import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const CATEGORIES = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles', 'livres'];
const NON_AWIN   = ['Amazon FR', 'CanadaPetCare'];

export async function GET(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const merchant = searchParams.get('merchant') ?? 'all';

  const admin = createAdminClient();

  const counts = await Promise.all(
    CATEGORIES.map(async (cat) => {
      let q = admin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gt('price', 0)
        .contains('categories', [cat]);

      if (merchant === 'awin') {
        q = q.not('merchant_name', 'in', `(${NON_AWIN.map(m => `"${m}"`).join(',')})`);
      } else if (merchant !== 'all') {
        q = q.eq('merchant_name', merchant);
      }

      const { count } = await q;
      return [cat, count ?? 0] as [string, number];
    })
  );

  return NextResponse.json({ counts: Object.fromEntries(counts) });
}
