import { NextResponse } from 'next/server';
import { getJoinedFeeds } from '@/lib/awin';
import { gunzipSync } from 'zlib';

async function fetchAndDecompress(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  return isGzip ? gunzipSync(buffer).toString('utf-8') : buffer.toString('utf-8');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const c of line) {
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += c; }
  }
  result.push(current);
  return result;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publisherId = process.env.AWIN_PUBLISHER_ID!;
  const feedToken   = process.env.AWIN_FEED_TOKEN ?? process.env.AWIN_API_TOKEN!;

  const feeds = await getJoinedFeeds(publisherId, feedToken);
  const results: Record<string, unknown>[] = [];

  for (const feed of feeds) {
    const merchantName = feed['Advertiser Name'];
    const feedUrl = feed['URL'];
    if (!feedUrl) continue;

    try {
      const csvText = await fetchAndDecompress(feedUrl);
      const lines = csvText.split('\n').filter(Boolean);
      if (lines.length < 2) { results.push({ merchant: merchantName, error: 'feed vide' }); continue; }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^﻿/, ''));

      // Première ligne de données pour voir les valeurs réelles
      const sampleVals = parseCSVLine(lines[1]);
      const sample: Record<string, string> = {};
      headers.forEach((h, i) => { sample[h] = (sampleVals[i] ?? '').trim().slice(0, 80); });

      // Compter combien de lignes contiennent certains mots clés dans n'importe quelle colonne
      let animalCount = 0;
      let livreCount  = 0;
      for (let i = 1; i < Math.min(lines.length, 200); i++) {
        const row = lines[i].toLowerCase();
        if (/chien|dog|chat|cat|oiseau|bird|lapin|rabbit|hamster|reptile/.test(row)) animalCount++;
        if (/livre|book/.test(row)) livreCount++;
      }

      results.push({
        merchant: merchantName,
        totalLines: lines.length - 1,
        headers,
        sampleRow: sample,
        first200LinesStats: { animalKeywords: animalCount, livreKeywords: livreCount },
      });
    } catch (e) {
      results.push({ merchant: merchantName, error: String(e) });
    }
  }

  return NextResponse.json(results, { status: 200 });
}
