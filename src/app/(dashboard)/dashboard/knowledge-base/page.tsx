import { BookOpen, Plus, Search, Tag, Eye, Wrench } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { listKbArticles, listKbCategories } from '@/lib/actions/knowledge-base';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; make?: string; model?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [articles, categories] = await Promise.all([
    listKbArticles({
      q: params.q,
      carMake: params.make,
      carModel: params.model,
      categoryId: params.category,
    }),
    listKbCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="คลังความรู้"
        description="คู่มือซ่อม สเปคอะไหล่ และเคล็ดลับจากช่างในทีม"
        action={
          <Link
            href="/dashboard/knowledge-base/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> เขียนบทความ
          </Link>
        }
      />

      <div className="space-y-4 px-4 sm:px-6">
        <form className="flex flex-wrap gap-2" method="GET">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={params.q || ''}
              placeholder="ค้นหา (เช่น เปลี่ยนผ้าเบรค Civic)"
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <input
            type="text"
            name="make"
            defaultValue={params.make || ''}
            placeholder="ยี่ห้อ"
            className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="model"
            defaultValue={params.model || ''}
            placeholder="รุ่น"
            className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {categories.length > 0 && (
            <select
              name="category"
              defaultValue={params.category || ''}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">ทุกหมวด</option>
              {categories.map((c) => (
                <option key={c.id as string} value={c.id as string}>
                  {c.name as string}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            ค้นหา
          </button>
        </form>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีบทความในคลังความรู้
            </p>
            <Link
              href="/dashboard/knowledge-base/new"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              เขียนบทความแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => {
              const categoryRaw = a.category as unknown;
              const category = (Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw) as
                | { id: string; name: string }
                | null;
              const tags = (a.tags as string[]) || [];
              return (
                <Link
                  key={a.id as string}
                  href={`/dashboard/knowledge-base/${a.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary"
                >
                  <div className="flex items-start gap-2">
                    <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <h3 className="text-sm font-semibold group-hover:text-primary">
                      {a.title as string}
                    </h3>
                  </div>
                  {a.summary && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {a.summary as string}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {a.car_make && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                        {a.car_make as string} {(a.car_model as string) || ''}
                      </span>
                    )}
                    {category && (
                      <span className="rounded bg-muted px-2 py-0.5">
                        {category.name}
                      </span>
                    )}
                    {tags.slice(0, 2).map((t) => (
                      <span key={t} className="flex items-center gap-0.5">
                        <Tag className="h-3 w-3" /> {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>อัปเดต {formatDate(a.updated_at as string)}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {Number(a.view_count) || 0}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
