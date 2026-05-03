import { NextRequest, NextResponse } from 'next/server';
import { getBookingAvailability } from '@/lib/actions/booking-config';

/**
 * Public booking availability — used by /c/booking and the LIFF page.
 *
 * Query params:
 *   tenant=<slug>            (required)
 *   from=YYYY-MM-DD          (optional, defaults to today)
 *   days=N                    (optional, defaults to 14, max 30)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('tenant');
  if (!slug) return NextResponse.json({ error: 'tenant required' }, { status: 400 });
  const fromIso = searchParams.get('from') || new Date().toISOString().slice(0, 10);
  const daysParam = Number(searchParams.get('days')) || 14;
  const days = Math.min(Math.max(1, daysParam), 30);

  const result = await getBookingAvailability(slug, fromIso, days);
  if ('error' in result) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: {
      // Short cache so the form feels live but doesn't hammer the DB
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    },
  });
}
