import { ArrowLeft, Eye, Tag, User, Calendar, Wrench, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { getKbArticleBySlug } from '@/lib/actions/knowledge-base';
import { DeleteArticleButton } from '@/components/knowledge-base/delete-article-button';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function KbArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getKbArticleBySlug(slug);
  if (!article) notFound();

  const category = article.category as { id: string; name: string } | null;
  const author = article.author as { full_name: string } | null;
  const tags = (article.tags as string[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={article.title as string}
        action={
          <div className="flex gap-2">
            <Link
              href="/dashboard/knowledge-base"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> กลับ
            </Link>
            <Link
              href={`/dashboard/knowledge-base/${slug}/edit`}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <Edit2 className="h-4 w-4" /> แก้ไข
            </Link>
            <DeleteArticleButton id={article.id as string} />
          </div>
        }
      />

      <article className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {(article.car_make || article.car_model) && (
            <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-primary">
              <Wrench className="h-3 w-3" />
              {article.car_make as string} {(article.car_model as string) || ''}
              {article.year_from && (
                <>
                  &nbsp;({article.year_from as number}
                  {article.year_to ? `-${article.year_to as number}` : '+'})
                </>
              )}
            </span>
          )}
          {category && (
            <span className="rounded bg-muted px-2 py-0.5">{category.name}</span>
          )}
          {author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {author.full_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(article.updated_at as string)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {Number(article.view_count) || 0}
          </span>
        </div>

        {article.summary && (
          <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm italic text-muted-foreground">
            {article.summary as string}
          </p>
        )}

        {/* Body — render markdown as plain pre with line breaks */}
        <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-foreground dark:prose-invert">
          {article.body_text as string}
        </div>

        {article.video_url && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">วิดีโอประกอบ</div>
            <a
              href={article.video_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-primary underline"
            >
              {article.video_url as string}
            </a>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
