import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CJ_GRAPHQL_URL = 'https://ads.api.cj.com/query';

const FEEDS_QUERY = `
  query ProductFeeds($companyId: ID!, $partnerIds: [ID!]) {
    productFeeds(
      companyId: $companyId
      partnerIds: $partnerIds
    ) {
      totalCount
      resultList {
        advertiserName
        advertiserId
        lastUpdated
      }
    }
  }
`;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = process.env.CJ_API_TOKEN;
  const companyId = process.env.CJ_CID;
  const advertiserId = process.env.CJ_ADVERTISER_CANADA_PET_CARE;

  if (!token || !companyId || !advertiserId) {
    return NextResponse.json({ error: 'Clés CJ manquantes' }, { status: 503 });
  }

  const res = await fetch(CJ_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: FEEDS_QUERY,
      variables: { companyId, partnerIds: [advertiserId] },
    }),
  });

  const text = await res.text();
  if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}`, body: text }, { status: 502 });

  const json = JSON.parse(text);
  return NextResponse.json(json);
}
