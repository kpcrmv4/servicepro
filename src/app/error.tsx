'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global error boundary — catches unhandled exceptions in any
 * server/client component. Sentry instrumentation forwards the
 * error automatically when configured.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Best-effort report — Sentry browser SDK picks it up if loaded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sentry = (window as any).Sentry;
      sentry?.captureException?.(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-xl font-bold">เกิดข้อผิดพลาดที่ไม่คาดคิด</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          ขออภัย ระบบเจอปัญหาในการแสดงหน้านี้ — ลองรีเฟรช
          หรือกลับไปหน้าหลัก
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            รหัสอ้างอิง: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          ลองใหม่อีกครั้ง
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
