'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteKbArticle } from '@/lib/actions/knowledge-base';

export function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('ลบบทความนี้?')) return;
        startTransition(async () => {
          const res = await deleteKbArticle(id);
          if (!('error' in res && res.error)) {
            router.push('/dashboard/knowledge-base');
          } else {
            alert(res.error);
          }
        });
      }}
      className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" /> ลบ
    </button>
  );
}
