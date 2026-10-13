import type { Metadata } from 'next';
import React from 'react';
import { getPolicyData } from '@/lib/policies';
import PolicyRenderer from '@/components/ui/PolicyRenderer';

export const revalidate = 60;

export async function generateMetadata() {
  const policy = await getPolicyData('privacy-policy');
  return {
    title: `${policy.title} | Herbic Cure`,
    description: policy.subtitle || 'Privacy Policy & Personal Data Governance for Herbic Cure.',
  };
}

export default async function PrivacyPolicyPage() {
  const policy = await getPolicyData('privacy-policy');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="border-b border-stone-200 pb-6 mb-8">
        {policy.badge && (
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            {policy.badge}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-stone-900 mt-3 mb-2">
          {policy.title}
        </h1>
        <p className="text-xs text-stone-500">
          Last Updated &amp; Effective: {policy.lastUpdated} | DPDPA Compliant
        </p>
        {policy.subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium">
            {policy.subtitle}
          </p>
        )}
      </div>

      <PolicyRenderer content={policy.content} />
    </div>
  );
}
