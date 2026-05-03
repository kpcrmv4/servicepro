import { Globe } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import {
  getActiveDomainAddon,
  getDomainStatus,
  CUSTOM_DOMAIN_PRICE_YEARLY,
} from '@/lib/actions/custom-domain';
import { CustomDomainPanel } from '@/components/branding/custom-domain-panel';
import { createClient } from '@/lib/supabase/server';

export default async function DomainSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">กรุณาเข้าสู่ระบบ</div>;

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', profile?.tenant_id ?? '')
    .single();

  const [addon, status] = await Promise.all([getActiveDomainAddon(), getDomainStatus()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Domain"
        description={`ใช้โดเมนของร้านเอง (เช่น www.mygarage.com) — ${CUSTOM_DOMAIN_PRICE_YEARLY.toLocaleString()}฿/ปี (ไม่รวมค่าโดเมน)`}
      />
      <div className="px-4 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>SSL อัตโนมัติ (Let&apos;s Encrypt) ผ่าน Vercel</span>
        </div>
        <CustomDomainPanel
          initialAddon={addon as { id: string; status: string; price: number; created_at: string } | null}
          initialStatus={status}
          tenantSlug={tenant?.slug || ''}
          priceYearly={CUSTOM_DOMAIN_PRICE_YEARLY}
        />
      </div>
    </div>
  );
}
