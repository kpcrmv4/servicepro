import { NextRequest, NextResponse } from 'next/server';
import { scanSmartRecall, sendPendingReminders } from '@/lib/actions/smart-recall';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth.replace(/^Bearer\s+/i, '') === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const scan = await scanSmartRecall();
    const send = await sendPendingReminders();
    return NextResponse.json({
      ok: true,
      created: scan.created,
      sent: send.sent,
    });
  } catch (err) {
    console.error('[cron/smart-recall] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}

export const POST = GET;
