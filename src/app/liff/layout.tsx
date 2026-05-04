import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองคิวซ่อม | KPServicePro',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  // Bare layout — no sidebar, no header. LIFF pages run inside the LINE
  // app webview which is small/mobile and shouldn't show our shop chrome.
  return <main className="min-h-screen bg-background">{children}</main>;
}
