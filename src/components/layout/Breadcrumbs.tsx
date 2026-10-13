import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.herbiccure.com';

  const fullItems: BreadcrumbItem[] = [{ label: 'Home', href: '/' }, ...items];

  // BreadcrumbList JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <nav aria-label="Breadcrumb" className={`text-xs text-[#5C454A] ${className}`}>
        <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-1.5 sm:gap-2">
                {index === 0 ? (
                  <Link
                    href={item.href || '/'}
                    className="flex items-center gap-1 hover:text-[#6B2E3D] transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span className="sr-only">Home</span>
                  </Link>
                ) : item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-[#6B2E3D] hover:underline transition-colors line-clamp-1 max-w-[150px] sm:max-w-none"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={`line-clamp-1 max-w-[200px] sm:max-w-none ${
                      isLast ? 'font-semibold text-[#2D1B1B]' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {!isLast && (
                  <ChevronRight className="w-3 h-3 text-[#A89297] shrink-0" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
