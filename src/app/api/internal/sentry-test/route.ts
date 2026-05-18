import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    throw new Error('Test Sentry - erreur volontaire');
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return NextResponse.json({ sent: true, message: 'Erreur envoyée à Sentry' });
  }
}
