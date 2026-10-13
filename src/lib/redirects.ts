import prisma from '@/lib/prisma';

export interface RedirectLookupResult {
  destination: string;
  statusCode: number;
}

/**
 * Technical SEO Redirect Engine
 * Handles 301 (Permanent) and 410 (Gone) status codes.
 * Flattens redirect chains and prevents circular loops.
 */
export async function getRedirect(sourcePath: string): Promise<RedirectLookupResult | null> {
  try {
    const redirect = await prisma.redirect.findUnique({
      where: { source: sourcePath, active: true },
    });

    if (!redirect) return null;

    return {
      destination: redirect.destination,
      statusCode: redirect.statusCode,
    };
  } catch (error) {
    console.error(`Error looking up redirect for ${sourcePath}:`, error);
    return null;
  }
}

/**
 * Creates or updates a 301 redirect record.
 * Automatically updates previous redirect chains pointing to `source` so they point directly to `destination`.
 */
export async function createOrUpdateRedirect(
  source: string,
  destination: string,
  statusCode = 301
): Promise<void> {
  // Prevent direct self-referencing loops
  if (source.trim() === destination.trim()) {
    console.warn(`Prevented self-referencing redirect loop: ${source} -> ${destination}`);
    return;
  }

  try {
    // 1. Create or update this primary redirect
    await prisma.redirect.upsert({
      where: { source },
      update: { destination, statusCode, active: true },
      create: { source, destination, statusCode, active: true },
    });

    // 2. Chain Flattening: If any other redirect was pointing to `source`, update it to point directly to `destination`
    await prisma.redirect.updateMany({
      where: { destination: source },
      data: { destination },
    });
  } catch (error) {
    console.error(`Failed to register redirect ${source} -> ${destination}:`, error);
  }
}

/**
 * Helper to record slug history changes for products or categories.
 */
export async function recordSlugChange(
  oldSlug: string,
  newSlug: string,
  basePath: '/products' | '/collections' | '/hair-care-tips'
): Promise<void> {
  if (oldSlug === newSlug) return;
  const source = `${basePath}/${oldSlug}`;
  const destination = `${basePath}/${newSlug}`;
  await createOrUpdateRedirect(source, destination, 301);
}
