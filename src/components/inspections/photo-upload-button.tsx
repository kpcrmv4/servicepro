'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { uploadInspectionPhoto, deleteInspectionPhoto } from '@/lib/actions/upload';

interface PhotoUploadButtonProps {
  itemId: string;
  inspectionId: string;
  currentPhotoUrl: string | null;
  onPhotoChange?: (url: string | null) => void;
}

export function PhotoUploadButton({
  itemId,
  inspectionId,
  currentPhotoUrl,
  onPhotoChange,
}: PhotoUploadButtonProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('inspectionId', inspectionId);
      formData.append('itemId', itemId);

      const result = await uploadInspectionPhoto(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setPhotoUrl(result.url);
        onPhotoChange?.(result.url);
      }
    } catch {
      setError('อัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete() {
    if (!confirm('ลบรูปภาพนี้?')) return;

    setError(null);
    setDeleting(true);

    try {
      const result = await deleteInspectionPhoto(itemId);

      if (result.error) {
        setError(result.error);
      } else {
        setPhotoUrl(null);
        onPhotoChange?.(null);
      }
    } catch {
      setError('ลบรูปล้มเหลว');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {photoUrl ? (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <img
              src={photoUrl}
              alt="รูปถ่าย"
              className="h-12 w-12 rounded-lg object-cover border border-gray-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="ลบรูป"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center gap-1.5 px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-50"
          title="ถ่ายรูป / เลือกรูป"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="text-xs hidden sm:inline">ถ่ายรูป</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 max-w-[120px]">{error}</p>
      )}
    </div>
  );
}
