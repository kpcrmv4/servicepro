'use server';

import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadInspectionPhoto(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    const inspectionId = formData.get('inspectionId') as string | null;
    const itemId = formData.get('itemId') as string | null;

    if (!file || !inspectionId || !itemId) {
      return { error: 'ข้อมูลไม่ครบ กรุณาลองใหม่' };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'ไฟล์ใหญ่เกิน 5MB กรุณาลดขนาดรูป' };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP, HEIC เท่านั้น' };
    }

    const supabase = await createClient();

    // Determine file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `${inspectionId}/${itemId}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { error: 'อัปโหลดรูปล้มเหลว กรุณาลองใหม่' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update inspection_items.photo_url
    const { error: dbError } = await supabase
      .from('inspection_items')
      .update({ photo_url: publicUrl })
      .eq('id', itemId);

    if (dbError) {
      console.error('DB update error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('inspection-photos').remove([storagePath]);
      return { error: 'บันทึกรูปไม่สำเร็จ กรุณาลองใหม่' };
    }

    return { url: publicUrl };
  } catch (err) {
    console.error('Upload error:', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

export async function deleteInspectionPhoto(
  itemId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    // Get current photo_url
    const { data: item, error: fetchError } = await supabase
      .from('inspection_items')
      .select('photo_url')
      .eq('id', itemId)
      .single();

    if (fetchError || !item?.photo_url) {
      return { error: 'ไม่พบรูปภาพ' };
    }

    // Parse storage path from public URL
    // URL format: .../storage/v1/object/public/inspection-photos/{path}
    const url = item.photo_url as string;
    const bucketPrefix = '/inspection-photos/';
    const pathIndex = url.indexOf(bucketPrefix);
    if (pathIndex !== -1) {
      const storagePath = url.substring(pathIndex + bucketPrefix.length);
      // Delete from storage (best effort)
      await supabase.storage.from('inspection-photos').remove([storagePath]);
    }

    // Clear photo_url in DB
    const { error: dbError } = await supabase
      .from('inspection_items')
      .update({ photo_url: null })
      .eq('id', itemId);

    if (dbError) {
      console.error('DB update error:', dbError);
      return { error: 'ลบรูปไม่สำเร็จ กรุณาลองใหม่' };
    }

    return {};
  } catch (err) {
    console.error('Delete photo error:', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}
