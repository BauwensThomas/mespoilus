import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchCJProductsForAdvertiser } from '@/lib/cj';

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.CJ_API_TOKEN;
  const companyId = process.env.CJ_CID;
  const advertiserId = process.env.CJ_ADVERTISER_CANADA_PET_CARE;

  if (!token || !companyId || !advertiserId) {
    return NextResponse.json({ error: 'Clés CJ manquantes' }, { status: 503 });
  }

  const supabase = createAdminClient();
  let totalSynced = 0;
  let lastError: string | null = null;

  try {
    totalSynced = await fetchCJProductsForAdvertiser(
      companyId,
      token,
      advertiserId,
      async (batch) => {
        const { error } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'id' });
        if (error) {
          console.error('[cj:canada-pet-care] upsert error:', error.message);
          lastError = error.message;
        }
      }
    );
  } catch (err) {
    console.error('[cj:canada-pet-care]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ success: true, synced: totalSynced, lastError });
}
