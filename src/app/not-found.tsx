import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Search className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          ขออภัย ไม่พบหน้าที่คุณค้นหา — อาจถูกย้าย ลบ
          หรือลิงก์ที่กดเข้ามาไม่ถูกต้อง
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          ไปแดชบอร์ด
        </Link>
      </div>
    </div>
  );
}
