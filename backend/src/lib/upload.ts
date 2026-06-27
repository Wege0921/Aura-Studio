import { supabase } from './supabase';
import path from 'path';

const BUCKET_NAME = 'receipts';

export async function uploadToSupabase(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  folder: string = 'receipts'
): Promise<string> {
  const ext = path.extname(originalname);
  const uniqueName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrl;
}
