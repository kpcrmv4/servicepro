import { Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { getCustomerNotifyConfig } from '@/lib/actions/booking-config';
import { CustomerNotifyConfigForm } from '@/components/settings/customer-notify-form';

export default async function CustomerNotifySettingsPage() {
  const config = await getCustomerNotifyConfig();
  return (
    <div className="space-y-6">
      <PageHeader
        title="แจ้งเตือนลูกค้าผ่าน LINE"
        description="ตั้งค่าว่าจะส่งข้อความไหนเมื่อสถานะงานเปลี่ยน — ส่งอัตโนมัติ หรือถามก่อนทุกครั้ง"
      />
      <div className="px-4 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Send className="h-4 w-4" />
          <span>
            ใช้ {`{{job_number}}, {{customer_name}}, {{vehicle}}, {{plate}}, {{status_label}}, {{hold_reason}}, {{eta}}, {{tracking_url}}`} ใน template
          </span>
        </div>
        <CustomerNotifyConfigForm initialConfig={config} />
      </div>
    </div>
  );
}
