import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": "error",
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/context/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/logger",
              message:
                "Server logger cannot be imported in client components. Use '@/lib/client-report' or a Server Action instead.",
            },
            {
              name: "@/lib/prisma",
              message: "Prisma client cannot be imported in client components.",
            },
            {
              name: "@prisma/client",
              message: "Prisma client cannot be imported in client components.",
            },
            {
              name: "@/lib/cache/redis",
              message: "Redis client cannot be imported in client components.",
            },
            {
              name: "server-only",
              message: "'server-only' cannot be imported in client components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "scripts/**/*.{ts,js}",
      "prisma/**/*.{ts,js}",
      "tests/**/*.{ts,js}",
      "src/lib/logger.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
  ]),
]);

export default eslintConfig;
