import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Hetzner Object Storage configuration (S3-compatible)
// Server-side only - credentials should not be exposed to client
function getS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.HETZNER_S3_ENDPOINT,
    region: process.env.HETZNER_S3_REGION || 'fsn1',
    credentials: {
      accessKeyId: process.env.HETZNER_S3_ACCESS_KEY || '',
      secretAccessKey: process.env.HETZNER_S3_SECRET_KEY || '',
    },
    forcePathStyle: true, // Required for Hetzner
  });
}

const BUCKET_NAME = process.env.HETZNER_S3_BUCKET || 'hope-properties-images';
const CDN_URL = process.env.HETZNER_CDN_URL;
const S3_ENDPOINT = process.env.HETZNER_S3_ENDPOINT;
// Set to 'false' to keep bucket private (requires CDN_URL for public access)
const BUCKET_PUBLIC = process.env.HETZNER_S3_BUCKET_PUBLIC !== 'false';

/**
 * Upload a file to Hetzner Object Storage (Server-side)
 * Use this function in API routes or server actions
 * @param fileBuffer - File buffer (from FormData or File)
 * @param path - Path in bucket (e.g., 'property-123/image.jpg')
 * @param contentType - MIME type of the file
 * @returns Public URL of uploaded file
 */
export async function uploadFile(fileBuffer: Buffer | Uint8Array, path: string, contentType: string = 'image/jpeg'): Promise<string> {
  const s3Client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
    // Only set ACL if bucket is public; for private buckets, use CDN or presigned URLs
    ...(BUCKET_PUBLIC ? { ACL: 'public-read' } : {}),
  });

  try {
    await s3Client.send(command);
    
    // For private buckets, CDN URL is required
    if (!BUCKET_PUBLIC && !CDN_URL) {
      throw new Error('Private bucket requires HETZNER_CDN_URL to be configured');
    }
    
    // Return CDN URL (works for both public and private buckets)
    if (CDN_URL) {
      return `${CDN_URL}/${path}`;
    }
    
    // Fallback to direct S3 URL (only works if bucket is public)
    if (S3_ENDPOINT && BUCKET_PUBLIC) {
      return `${S3_ENDPOINT}/${BUCKET_NAME}/${path}`;
    }
    
    throw new Error('No CDN URL or public S3 endpoint configured');
  } catch (error) {
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Client-side upload helper - uploads via API route
 * @param file - File object from input
 * @param path - Path in bucket
 * @returns Public URL of uploaded file
 */
export async function uploadFileFromClient(file: File, path: string): Promise<string> {
  // Import supabase dynamically to avoid circular dependencies
  const { supabase } = await import('./supabase');
  
  // Get authentication token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required to upload files');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.error || error.message || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a file from Hetzner Object Storage (Server-side)
 * @param path - Path in bucket to delete
 */
export async function deleteFile(path: string): Promise<void> {
  const s3Client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a presigned URL for private file access (optional, Server-side)
 * @param path - Path in bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract path from full URL (for migration/deletion)
 * @param url - Full URL (CDN or direct S3 URL)
 * @returns Path in bucket
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    // Handle CDN URL
    if (CDN_URL && url.startsWith(CDN_URL)) {
      return url.replace(CDN_URL + '/', '');
    }
    
    // Handle direct S3 URL
    const endpoint = process.env.NEXT_PUBLIC_HETZNER_S3_ENDPOINT || process.env.HETZNER_S3_ENDPOINT || '';
    if (endpoint && url.includes(`/${BUCKET_NAME}/`)) {
      const parts = url.split(`/${BUCKET_NAME}/`);
      return parts[1] || null;
    }
    
    // Fallback: try to extract path from any URL
    const urlObj = new URL(url);
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
  } catch {
    return null;
  }
}

