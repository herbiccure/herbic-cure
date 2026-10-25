import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as Sentry from '@sentry/nextjs';
import { reportClientError, reportClientMessage } from '@/lib/client-report';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('Server-Only Boundary & Client Import Guard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const restrictedServerModules = [
    '@/lib/logger',
    'server-only',
    '@/lib/prisma',
    '@prisma/client',
    '@/lib/cache/redis',
    '@/lib/footer',
    '@/lib/about',
    '@/lib/policies',
  ];

  function getClientComponentFiles(dir: string): string[] {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getClientComponentFiles(fullPath));
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("'use client'") || content.includes('"use client"')) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }

  it('guarantees zero client components import restricted server-only modules', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const clientFiles = getClientComponentFiles(srcDir);

    expect(clientFiles.length).toBeGreaterThan(0);

    const violations: { file: string; line: number; importStatement: string; restrictedModule: string }[] = [];

    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const restricted of restrictedServerModules) {
          // Match standard imports e.g. from '@/lib/logger' or from "server-only"
          const importRegex = new RegExp(`from\\s+['"]${restricted}['"]`);
          if (importRegex.test(line)) {
            violations.push({
              file: path.relative(srcDir, filePath),
              line: index + 1,
              importStatement: line.trim(),
              restrictedModule: restricted,
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  describe('Client-Safe Sentry Reporting', () => {
    it('captures client exception safely through Sentry client SDK without server-only dependency', () => {
      const clientError = new Error('Browser payment modal failed');

      reportClientError(clientError, {
        tags: { flow: 'checkout' },
        extra: { step: 'razorpay_modal' },
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(clientError, {
        tags: { flow: 'checkout' },
        extra: { step: 'razorpay_modal' },
      });
    });

    it('suppresses Next.js control-flow digest exceptions in client reporting', () => {
      const redirectErr = new Error('NEXT_REDIRECT');
      (redirectErr as any).digest = 'NEXT_REDIRECT;/checkout';

      reportClientError(redirectErr);

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('reports client informational messages safely', () => {
      reportClientMessage('Client wallet payment dismissed', 'info', {
        tags: { component: 'cart' },
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Client wallet payment dismissed', {
        level: 'info',
        tags: { component: 'cart' },
        extra: undefined,
      });
    });
  });
});
