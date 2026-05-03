import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicLandingPage } from '@/lib/actions/landing';
import { SectionRenderer } from '@/components/landing/section-renderer';

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicLandingPage(slug);
  if (!data) return { title: 'KPServicePro' };
  const { page, tenant } = data;
  return {
    title: page.seo_title || tenant.name,
    description: page.seo_description || `${tenant.name} - บริการอู่ซ่อมรถ`,
    openGraph: {
      title: page.seo_title || tenant.name,
      description: page.seo_description || undefined,
      images: page.hero_image_url ? [page.hero_image_url] : undefined,
    },
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getPublicLandingPage(slug);
  if (!data) notFound();
  const { page, tenant } = data;
  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);

  return (
    <main className="min-h-screen bg-background">
      {/* Lightweight nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2">
          {page.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.logo_url} alt={tenant.name} className="h-8" />
          )}
          <span className="font-semibold">{tenant.name}</span>
        </div>
        {page.show_booking_widget && (
          <a
            href={`/c/booking?tenant=${tenant.slug}`}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: page.primary_color }}
          >
            จองคิวซ่อม
          </a>
        )}
      </nav>

      {sortedSections.map((s) => (
        <SectionRenderer key={s.id} section={s} primaryColor={page.primary_color} />
      ))}

      {page.show_booking_widget && (
        <div id="booking" className="bg-muted/30 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold">พร้อมจองคิวซ่อม?</h2>
          <a
            href={`/c/booking?tenant=${tenant.slug}`}
            className="mt-4 inline-block rounded-full px-8 py-3 font-semibold text-white shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: page.primary_color }}
          >
            ไปหน้าจองคิว
          </a>
        </div>
      )}

      <footer className="border-t border-border bg-card px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {tenant.name} · Powered by KPServicePro
      </footer>
    </main>
  );
}
