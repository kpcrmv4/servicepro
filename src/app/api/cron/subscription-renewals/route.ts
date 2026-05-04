import { NextRequest, NextResponse } from 'next/server';
import {
  scanAndCreateRenewals,
  sendRenewalLineNotification,
  sendDueReminders,
} from '@/lib/actions/subscription';

/**
 * Daily cron — call from Vercel Cron (vercel.json), an external
 * scheduler (e.g. EasyCron), or by hand for testing.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
 *
 * Steps:
 *   1. Scan tenants whose period ends within 14 days and create
 *      subscription_invoices rows.
 *   2. Push the new invoice as a LINE Flex message to each linked
 *      owner (notified_via_line_at gets set on success).
 *   3. Re-send reminders at 30/7/1 days before due, and once after
 *      due_date passes (status flips to overdue).
 */
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token === expected) return true;
  // Vercel Cron uses a random query secret with no Authorization header
  // by default, but supports a custom secret via the `Authorization` header
  // — we only accept that.
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { created } = await scanAndCreateRenewals(14);
    const notified: string[] = [];
    for (const c of created) {
      const r = await sendRenewalLineNotification(c.invoiceId);
      if (r.ok) notified.push(c.invoiceNumber);
    }
    const { sent } = await sendDueReminders([30, 7, 1, -1]);

    return NextResponse.json({
      ok: true,
      createdCount: created.length,
      notifiedCount: notified.length,
      remindersSentCount: sent.length,
      created,
      notified,
    });
  } catch (err) {
    console.error('[cron/subscription-renewals] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}

export const POST = GET;
