import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { listKbCategories } from '@/lib/actions/knowledge-base';
import { KbArticleForm } from '@/components/knowledge-base/article-form';

export default async function NewKbArticlePage() {
  const categories = await listKbCategories();
  return (
    <div className="space-y-6">
      <PageHeader
        title="เขียนบทความใหม่"
        action={
          <Link
            href="/dashboard/knowledge-base"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
        }
      />
      <div className="px-4 sm:px-6">
        <KbArticleForm
          categories={(categories as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
