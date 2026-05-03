import { Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { ensureLandingPage } from '@/lib/actions/landing';
import { LandingEditor } from '@/components/landing/editor';
import { createClient } from '@/lib/supabase/server';

export default async function LandingDashboardPage() {
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
    .select('slug, plan, name')
    .eq('id', profile?.tenant_id ?? '')
    .single();

  if (tenant?.plan !== 'premium') {
    return (
      <div className="space-y-6">
        <PageHeader title="หน้า Landing Page ของร้าน" />
        <div className="mx-4 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Globe className="mx-auto h-10 w-10 text-amber-600" />
          <h2 className="mt-4 text-base font-bold text-amber-800">
            ฟีเจอร์นี้รองรับเฉพาะแพลน Premium
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            อัปเกรดเพื่อสร้างหน้าเว็บร้านสวยๆ พร้อม custom domain (กำลังพัฒนา)
          </p>
        </div>
      </div>
    );
  }

  const init = await ensureLandingPage();
  if ('error' in init) {
    return <div className="p-6 text-red-700">{init.error}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="หน้า Landing Page ของร้าน"
        description="สร้างหน้าเว็บประชาสัมพันธ์ร้าน เปิดให้ลูกค้าเข้าชมและจองคิวออนไลน์"
        action={
          tenant?.slug && (
            <Link
              href={`/shop/${tenant.slug}`}
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" /> ดูตัวอย่าง
            </Link>
          )
        }
      />
      <div className="px-4 sm:px-6">
        <LandingEditor initialPage={init.page} tenantSlug={tenant?.slug || ''} />
      </div>
    </div>
  );
}
