import { PrismaClient } from '@prisma/client';
import * as argon2 from '@node-rs/argon2';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'owner@herbiccure.com';
  const rawPassword = process.env.ADMIN_SEED_PASSWORD || 'HerbicCure@Owner#2026';
  const name = process.env.ADMIN_SEED_NAME || 'Herbic Cure Primary Owner';

  console.log(`[BOOTSTRAP] Checking for existing OWNER accounts in database...`);

  const existingOwner = await prisma.user.findFirst({
    where: { role: 'OWNER', status: 'ACTIVE' },
  });

  if (existingOwner) {
    console.log(`[BOOTSTRAP] Active OWNER account already exists: ${existingOwner.email} (${existingOwner.id}).`);
    console.log(`[BOOTSTRAP] Skipping initialization to prevent privilege overwrites.`);
    return;
  }

  console.log(`[BOOTSTRAP] No active OWNER found. Creating initial OWNER account for ${email}...`);

  const passwordHash = await argon2.hash(rawPassword, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    // Argon2id is default
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified: true,
      role: 'OWNER',
      status: 'ACTIVE',
      twoFactorEnabled: false, // Must enroll upon first login
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      passwordHash,
      password: passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'OWNER',
      action: 'INITIAL_OWNER_CREATED',
      resource: 'User',
      resourceId: user.id,
      diffJson: JSON.stringify({ email: user.email, role: 'OWNER' }),
      ipAddress: '127.0.0.1',
      userAgent: 'CLI_SEED_SCRIPT',
      status: 'SUCCESS',
    },
  });

  console.log(`\n======================================================`);
  console.log(`✔ Initial OWNER created successfully!`);
  console.log(`  Email:    ${email}`);
  console.log(`  User ID:  ${user.id}`);
  console.log(`  Role:     OWNER`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('[BOOTSTRAP ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
