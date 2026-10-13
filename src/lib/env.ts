import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default('b27349ffc160769a36a3cc60c2af9467e16ab70484a2bacfb8845e3e5694c70b'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation error:', parsed.error.format());
}

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      SESSION_SECRET:
        process.env.SESSION_SECRET ||
        'b27349ffc160769a36a3cc60c2af9467e16ab70484a2bacfb8845e3e5694c70b',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
