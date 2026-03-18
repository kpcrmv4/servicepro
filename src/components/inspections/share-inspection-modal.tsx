'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeImage } from '@/components/ui/qr-code';
import { sendDVIReportNotification } from '@/lib/actions/line';
import { Link2, Check, Download, MessageCircle, Loader2, Share2 } from 'lucide-react';

interface ShareInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  inspectionId: string;
  hasLineConfig?: boolean;
}

export function ShareInspectionModal({
  open,
  onOpenChange,
  shareToken,
  inspectionId,
  hasLineConfig,
}: ShareInspectionModalProps) {
  const [copied, setCopied] = useState(false);
  const [sendingLine, setSendingLine] = useState(false);
  const [lineResult, setLineResult] = useState<'success' | 'error' | null>(null);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/inspect/${shareToken}`
    : `/inspect/${shareToken}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleDownloadQR = useCallback(() => {
    const canvas = document.querySelector('.qr-code-container img') as HTMLImageElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `inspection-qr-${shareToken}.png`;
    link.href = canvas.src;
    link.click();
  }, [shareToken]);

  const handleSendLine = useCallback(async () => {
    try {
      setSendingLine(true);
      setLineResult(null);
      await sendDVIReportNotification(inspectionId, shareUrl);
      setLineResult('success');
      setTimeout(() => setLineResult(null), 3000);
    } catch {
      setLineResult('error');
      setTimeout(() => setLineResult(null), 3000);
    } finally {
      setSendingLine(false);
    }
  }, [inspectionId, shareUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            แชร์รายงานตรวจสภาพ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section 1: Share Link */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4" />
              ลิงก์แชร์
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`min-h-[40px] min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    <span className="hidden sm:inline">คัดลอก</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: QR Code */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">QR Code</h4>
            <div className="flex flex-col items-center gap-3">
              <div className="qr-code-container bg-white p-3 rounded-xl border border-gray-200">
                <QRCodeImage value={shareUrl} size={180} />
              </div>
              <button
                onClick={handleDownloadQR}
                className="min-h-[44px] px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลด QR
              </button>
            </div>
          </div>

          {/* Section 3: LINE */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              ส่งทาง LINE
            </h4>
            <button
              onClick={handleSendLine}
              disabled={sendingLine || !hasLineConfig}
              className={`w-full min-h-[48px] px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                lineResult === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : lineResult === 'error'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {sendingLine ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังส่ง...
                </>
              ) : lineResult === 'success' ? (
                <>
                  <Check className="h-5 w-5" />
                  ส่งสำเร็จ!
                </>
              ) : lineResult === 'error' ? (
                'ส่งไม่สำเร็จ (ลูกค้าอาจยังไม่ได้เชื่อมต่อ LINE)'
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" />
                  ส่งผ่าน LINE OA
                </>
              )}
            </button>
            {!hasLineConfig && (
              <p className="text-xs text-gray-400 text-center">
                ยังไม่ได้ตั้งค่า LINE OA
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
