import { Palette } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { getMyBrand } from '@/lib/actions/branding';
import { BrandForm } from '@/components/branding/brand-form';

export default async function BrandingSettingsPage() {
  const brand = await getMyBrand();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand & สีของร้าน"
        description="ปรับสีหลัก โลโก้ และชื่อร้านที่แสดงในหน้าลูกค้า — Landing Page, Storefront, ติดตามงาน, LIFF"
        breadcrumb={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "ตั้งค่า", href: "/dashboard/settings" },
          { title: "Brand & สี" },
        ]}
      />
      <div className="px-3 pb-6 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="h-4 w-4" />
          <span>การเปลี่ยนแปลงจะมีผลทันทีกับทุกหน้าที่ลูกค้าของร้านเข้าใช้</span>
        </div>
        <BrandForm initialBrand={brand} />
      </div>
    </div>
  );
}
