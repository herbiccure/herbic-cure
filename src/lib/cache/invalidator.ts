import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Tag & Path based cache invalidator for Next.js Data Cache.
 * Call these functions after admin mutations to immediately purge edge/server caches.
 */

export function invalidateProductCache(slug?: string) {
  try {
    revalidateTag('products', { expire: 0 });
    revalidatePath('/products');
    if (slug) {
      revalidateTag(`product-${slug}`, { expire: 0 });
      revalidatePath(`/products/${slug}`);
    }
  } catch {
    // Invalidator safe fallback
  }
}

export function invalidateCategoryCache(slug?: string) {
  try {
    revalidateTag('categories', { expire: 0 });
    revalidatePath('/categories');
    if (slug) {
      revalidateTag(`category-${slug}`, { expire: 0 });
      revalidatePath(`/categories/${slug}`);
    }
  } catch {
    // Invalidator safe fallback
  }
}

export function invalidateHomepageCache() {
  try {
    revalidateTag('homepage', { expire: 0 });
    revalidateTag('announcements', { expire: 0 });
    revalidateTag('navigation', { expire: 0 });
    revalidatePath('/');
  } catch {
    // Invalidator safe fallback
  }
}

export function invalidateReviewsCache(productId?: string) {
  try {
    revalidateTag('reviews', { expire: 0 });
    if (productId) {
      revalidateTag(`reviews-${productId}`, { expire: 0 });
    }
  } catch {
    // Invalidator safe fallback
  }
}

export function invalidateAllPublicCaches() {
  try {
    revalidateTag('products', { expire: 0 });
    revalidateTag('categories', { expire: 0 });
    revalidateTag('homepage', { expire: 0 });
    revalidateTag('reviews', { expire: 0 });
    revalidatePath('/', 'layout');
  } catch {
    // Invalidator safe fallback
  }
}
