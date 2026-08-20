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
