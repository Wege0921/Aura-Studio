import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from './supabase';
import path from 'path';

// ---------------------------------------------------------------------------
// Storage configuration
//
// New uploads go to Cloudflare R2 (S3-compatible). Existing files stored in
// Supabase Storage keep working — deleteFromStorage() auto-detects the
// provider from the URL host so legacy Supabase objects can still be removed.
//
// Required env vars for R2:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET (default: aura-media), R2_PUBLIC_BASE_URL
//
// Supabase Storage env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are
// still required so legacy file deletes keep working.
// ---------------------------------------------------------------------------

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET || 'aura-media';
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

let _s3: S3Client | undefined;
function getS3(): S3Client {
  if (!_s3) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be set for file uploads');
    }
    if (!R2_PUBLIC_BASE_URL) {
      throw new Error('R2_PUBLIC_BASE_URL must be set (e.g. https://pub-<id>.r2.dev)');
    }
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

/**
 * Upload a file to Cloudflare R2.
 *
 * The legacy `bucket` argument (e.g. "products", "shop-receipts", "receipts")
 * is preserved as a prefix inside the single R2 bucket so callers don't need
 * to change. The legacy `folder` argument becomes a nested path segment.
 *
 * @param buffer  File contents
 * @param originalname  Original filename (used for extension)
 * @param mimetype  MIME type
 * @param folder  Logical sub-folder (default: 'receipts')
 * @param bucket  Legacy Supabase bucket name — used as the R2 key prefix
 * @returns Public URL of the uploaded object
 */
export async function uploadToSupabase(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  folder: string = 'receipts',
  bucket: string = 'receipts'
): Promise<string> {
  const ext = path.extname(originalname);
  // Key shape: <bucket>/<folder>/<timestamp>-<rand><ext>
  // e.g. products/products/1781234567-123456789.png
  //      receipts/receipts/1781234567-123456789.pdf
  const key = `${bucket}/${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  await getS3().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${R2_PUBLIC_BASE_URL}/${key}`;
}

/**
 * Delete a file from storage by its public URL.
 *
 * Auto-detects the provider from the URL host:
 *  - R2 (pub-*.r2.dev or custom R2 domain) → S3 DeleteObjectCommand
 *  - Supabase (*.supabase.co/storage/v1/object/public/...) → supabase.storage.remove
 *
 * Silently ignores errors (e.g. if the file was already deleted) to avoid
 * blocking DB cleanup.
 */
export async function deleteFromSupabase(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const host = url.hostname.toLowerCase();

    // R2: pub-<id>.r2.dev or a custom domain bound to R2.
    // Match either the configured R2_PUBLIC_BASE_URL host or *.r2.dev.
    const r2Host = new URL(R2_PUBLIC_BASE_URL).hostname.toLowerCase();
    const isR2 = host === r2Host || host.endsWith('.r2.dev');

    if (isR2) {
      // Key is everything after the first "/" in the pathname.
      const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (!key) return;
      await getS3().send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      );
      return;
    }

    // Supabase legacy URL:
    //   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    if (host.endsWith('.supabase.co')) {
      const parts = url.pathname.split('/object/public/');
      if (parts.length < 2) return;
      const [bucket, ...pathParts] = parts[1].split('/');
      const filePath = pathParts.join('/');
      if (!bucket || !filePath) return;
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        console.warn(`Supabase delete failed for ${filePath}:`, error.message);
      }
      return;
    }

    console.warn(`deleteFromSupabase: unrecognized storage URL host: ${host}`);
  } catch (err) {
    // Don't throw — orphaned storage objects are preferable to blocking cleanup
    console.warn('Failed to delete from storage:', err);
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
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x42 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
  // PDF: 25 50 44 46
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
  return null;
}
