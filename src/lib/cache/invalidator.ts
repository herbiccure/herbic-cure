import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Robust Tag & Path based cache invalidator for Next.js Data Cache.
 * Call these functions after admin mutations to immediately purge edge/server caches.
 */

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    try {
      (revalidateTag as (t: string, p?: any) => void)(tag);
    } catch {
      // Safe fallback
    }
  }
}

function safeRevalidatePath(path: string, type?: 'layout' | 'page') {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
      revalidatePath(path, 'page');
      revalidatePath(path, 'layout');
    }
  } catch {
    // Safe fallback
  }
}

export function invalidateProductCache(slug?: string) {
  safeRevalidateTag('products');
  safeRevalidateTag('homepage');
  safeRevalidateTag('herbic-homepage-data-v3');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');
  if (slug) {
    safeRevalidateTag(`product-${slug}`);
    safeRevalidatePath(`/products/${slug}`);
  }
}

export function invalidateCategoryCache(slug?: string) {
  safeRevalidateTag('categories');
  safeRevalidateTag('homepage');
  safeRevalidateTag('herbic-homepage-data-v3');
  safeRevalidatePath('/categories');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');
  if (slug) {
    safeRevalidateTag(`category-${slug}`);
    safeRevalidatePath(`/categories/${slug}`);
  }
}

export function invalidateHomepageCache() {
  safeRevalidateTag('homepage');
  safeRevalidateTag('herbic-homepage-data-v3');
  safeRevalidateTag('products');
  safeRevalidateTag('categories');
  safeRevalidateTag('announcements');
  safeRevalidateTag('navigation');
  safeRevalidateTag('social-posts');
  safeRevalidateTag('social-content');
  safeRevalidateTag('reviews');
  safeRevalidateTag('faqs');
  safeRevalidateTag('settings');
  safeRevalidatePath('/');
  safeRevalidatePath('/', 'page');
  safeRevalidatePath('/', 'layout');
}

export function invalidateSocialCache() {
  safeRevalidateTag('social-posts');
  safeRevalidateTag('social-content');
  safeRevalidateTag('homepage');
  safeRevalidateTag('herbic-homepage-data-v3');
  safeRevalidatePath('/');
}

export function invalidateReviewsCache(productId?: string) {
  safeRevalidateTag('reviews');
  safeRevalidateTag('homepage');
  safeRevalidateTag('herbic-homepage-data-v3');
  safeRevalidatePath('/');
  if (productId) {
    safeRevalidateTag(`reviews-${productId}`);
    safeRevalidateTag(`product-${productId}-reviews`);
  }
}

export function invalidateAllPublicCaches() {
  invalidateHomepageCache();
  invalidateProductCache();
  invalidateCategoryCache();
  invalidateSocialCache();
  safeRevalidateTag('settings');
  safeRevalidateTag('navigation');
  safeRevalidatePath('/', 'layout');
  safeRevalidatePath('/products', 'layout');
}
