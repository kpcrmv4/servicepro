import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { getKbArticleBySlug, listKbCategories } from '@/lib/actions/knowledge-base';
import { KbArticleForm } from '@/components/knowledge-base/article-form';

export default async function EditKbArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, categories] = await Promise.all([
    getKbArticleBySlug(slug),
    listKbCategories(),
  ]);
  if (!article) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`แก้ไข: ${article.title as string}`}
        action={
          <Link
            href={`/dashboard/knowledge-base/${slug}`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
        }
      />
      <div className="px-4 sm:px-6">
        <KbArticleForm
          categories={(categories as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
          initial={{
            id: article.id as string,
            title: article.title as string,
            category_id: (article.category_id as string) || null,
            car_make: (article.car_make as string) || null,
            car_model: (article.car_model as string) || null,
            year_from: (article.year_from as number) || null,
            year_to: (article.year_to as number) || null,
            summary: (article.summary as string) || null,
            body_text: article.body_text as string,
            video_url: (article.video_url as string) || null,
            tags: (article.tags as string[]) || [],
            is_published: article.is_published as boolean,
          }}
        />
      </div>
    </div>
  );
}
