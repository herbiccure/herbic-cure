import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor, admin, haveIBeenPwned, createAccessControl } from 'better-auth/plugins';
import { prisma } from '@/lib/prisma';
import * as argon2 from '@node-rs/argon2';

const statement = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'set-email',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
};
const ac = createAccessControl(statement);

const OWNER = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'set-email',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

const MANAGER = ac.newRole({
  user: ['list', 'get', 'update'],
  session: ['list'],
});

const SUPPORT = ac.newRole({
  user: ['list', 'get'],
  session: ['list'],
});

const CUSTOMER = ac.newRole({
  user: [],
  session: [],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    password: {
      hash: async (password: string) => {
        return argon2.hash(password, {
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
          // Argon2id is default algorithm in @node-rs/argon2
        });
      },
      verify: async ({ password, hash }: { password: string; hash: string }) => {
        try {
          return await argon2.verify(hash, password);
        } catch {
          return false;
        }
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: 'Herbic Cure',
    }),
    admin({
      defaultRole: 'CUSTOMER',
      adminRoles: ['OWNER', 'MANAGER', 'SUPPORT'],
      roles: {
        OWNER,
        MANAGER,
        SUPPORT,
        CUSTOMER,
      },
    }),
    haveIBeenPwned(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days customer session
    updateAge: 60 * 60 * 24,     // Refresh session after 24h of activity
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
});
