/**
 * Image URL utilities for handling both Hetzner and Supabase image URLs
 */

/**
 * Check if an image URL is from Supabase Storage
 */
export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage/v1/object');
}

/**
 * Check if an image URL is from Hetzner Storage
 */
export function isHetznerUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('your-objectstorage.com') || url.includes('hetzner');
}

/**
 * Get a placeholder image URL
 */
export function getPlaceholderImage(): string {
  return '/placeholder-property.jpg'; // Add this to public folder if needed
}

/**
 * Validate and normalize image URL
 * Returns the URL if valid, or placeholder if invalid
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getPlaceholderImage();
  }
  
  // Both Supabase and Hetzner URLs are valid
  // They'll work as long as the storage bucket exists
  return url.trim();
}

/**
 * Handle image load error
 * Can be used in onError handlers
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
): void {
  const img = e.currentTarget;
  const fallback = fallbackUrl || getPlaceholderImage();
  
  // Only change src if it's different to prevent infinite loops
  if (img.src !== fallback) {
    img.src = fallback;
  }
  
  console.warn('⚠️ Image failed to load, using placeholder:', img.src);
}

/**
 * Get all valid image URLs from property images array
 */
export function getValidImageUrls(images: string[] | null | undefined): string[] {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images
    .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
    .map(url => url.trim());
}

