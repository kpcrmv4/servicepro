import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { listBookings } from '@/lib/actions/bookings';
import { BookingsTable } from '@/components/bookings/bookings-table';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const bookings = await listBookings({ status: params.status });
  return (
    <div className="space-y-6">
      <PageHeader
        title="คิวจองล่วงหน้า"
        description="จัดการคำขอจองจากลูกค้า ยืนยัน/ยกเลิก/แปลงเป็นงานซ่อม"
        action={
          <Link
            href="/dashboard/settings/booking"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <CalendarDays className="h-4 w-4" /> ตั้งค่าจองคิว
          </Link>
        }
      />
      <div className="px-4 sm:px-6">
        <BookingsTable initialBookings={bookings} initialStatus={params.status || 'pending'} />
      </div>
    </div>
  );
}
