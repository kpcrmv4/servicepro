import { CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { getBookingConfig } from '@/lib/actions/booking-config';
import { BookingConfigForm } from '@/components/settings/booking-config-form';

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();
  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าจองคิวออนไลน์"
        description="กำหนดวัน/เวลา/จำนวนคิวที่เปิดให้ลูกค้าจองผ่านเว็บและ LINE"
        breadcrumb={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "ตั้งค่า", href: "/dashboard/settings" },
          { title: "จองคิวออนไลน์" },
        ]}
      />
      <div className="px-3 pb-6 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          <span>การเปลี่ยนแปลงจะมีผลทันทีกับฟอร์มจองหน้าลูกค้า</span>
        </div>
        <BookingConfigForm initialConfig={config} />
      </div>
    </div>
  );
}
