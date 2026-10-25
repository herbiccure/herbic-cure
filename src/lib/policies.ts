import 'server-only';
import { logger } from '@/lib/logger';
import { PolicyData, DEFAULT_POLICIES } from '@/types/policies';

export * from '@/types/policies';

const policyCache = new Map<string, PolicyData>();

export async function getPolicyData(slug: string): Promise<PolicyData> {
  if (policyCache.has(slug)) {
    return policyCache.get(slug)!;
  }
  const fallback = DEFAULT_POLICIES[slug] || {
    slug,
    title: 'Store Policy',
    subtitle: 'Official terms and guidelines of Herbic Cure.',
    badge: 'Policy Document',
    lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content: 'Policy content is currently being updated.',
  };

  try {
    const { prisma } = await import('@/lib/prisma');
    const record = await prisma.siteSetting.findUnique({
      where: { key: `policy_${slug}` },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      const result: PolicyData = {
        slug,
        title: parsed.title || fallback.title,
        subtitle: parsed.subtitle || fallback.subtitle,
        badge: parsed.badge || fallback.badge,
        lastUpdated: parsed.lastUpdated || fallback.lastUpdated,
        content: parsed.content || fallback.content,
      };
      policyCache.set(slug, result);
      return result;
    }
  } catch (error: any) {
    logger.debug('policies.fallback_used', { slug, error: error?.message });
  }

  return fallback;
}

export async function savePolicyData(slug: string, data: Partial<PolicyData>): Promise<PolicyData> {
  const current = await getPolicyData(slug);
  const updated: PolicyData = {
    slug,
    title: data.title ?? current.title,
    subtitle: data.subtitle ?? current.subtitle,
    badge: data.badge ?? current.badge,
    lastUpdated: data.lastUpdated ?? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content: data.content ?? current.content,
  };

  const { prisma } = await import('@/lib/prisma');
  policyCache.set(slug, updated);
  await prisma.siteSetting.upsert({
    where: { key: `policy_${slug}` },
    update: { value: JSON.stringify(updated) },
    create: { key: `policy_${slug}`, value: JSON.stringify(updated) },
  });

  return updated;
}
