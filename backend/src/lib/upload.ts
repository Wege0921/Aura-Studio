import { supabase } from './supabase';
import path from 'path';

const DEFAULT_BUCKET = 'receipts';

/**
 * Upload a file to Supabase Storage.
 * @param buffer  File contents
 * @param originalname  Original filename (used for extension)
 * @param mimetype  MIME type
 * @param folder  Logical sub-folder inside the bucket (default: 'receipts')
 * @param bucket  Supabase Storage bucket name (default: 'receipts')
 */
export async function uploadToSupabase(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  folder: string = 'receipts',
  bucket: string = DEFAULT_BUCKET
): Promise<string> {
  const ext = path.extname(originalname);
  const uniqueName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(uniqueName, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Extracts the bucket and path from the URL. Silently ignores errors
 * (e.g. if the file was already deleted) to avoid blocking DB cleanup.
 */
export async function deleteFromSupabase(publicUrl: string): Promise<void> {
  try {
    // Supabase public URLs look like:
    //   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/object/public/');
    if (parts.length < 2) return;
    const [bucket, ...pathParts] = parts[1].split('/');
    const filePath = pathParts.join('/');
    if (!bucket || !filePath) return;

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.warn(`Supabase delete failed for ${filePath}:`, error.message);
    }
  } catch (err) {
    // Don't throw — orphaned storage objects are preferable to blocking cleanup
    console.warn('Failed to delete from Supabase:', err);
  }
}

/**
 * Validate file content by checking magic bytes (not just the client-
 * supplied mimetype/extension). Returns the detected mimetype or null
 * if the file doesn't match any allowed type.
 */
export function detectMimetype(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
  // WebP: RIFF....WEBP
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
  // PDF: 25 50 44 46
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
  return null;
}
