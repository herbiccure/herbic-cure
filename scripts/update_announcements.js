const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const lines = [
    '♥ Experience the power of South India’s best natural Hair Oils',
    '🌿 Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi – 100% Pure & Toxin-Free',
    '🚚 Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499'
  ];

  await prisma.siteSetting.upsert({
    where: { key: 'announcements' },
    update: { value: JSON.stringify(lines) },
    create: { key: 'announcements', value: JSON.stringify(lines) }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'announcement_bar_enabled' },
    update: { value: 'true' },
    create: { key: 'announcement_bar_enabled', value: 'true' }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'announcement_bar_speed' },
    update: { value: 'normal' },
    create: { key: 'announcement_bar_speed', value: 'normal' }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'announcement_bar_mode' },
    update: { value: 'running' },
    create: { key: 'announcement_bar_mode', value: 'running' }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'announcement_bar_bg' },
    update: { value: '#0e371f' },
    create: { key: 'announcement_bar_bg', value: '#0e371f' }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'announcement_bar_text_color' },
    update: { value: '#ffffff' },
    create: { key: 'announcement_bar_text_color', value: '#ffffff' }
  });

  console.log('Successfully updated announcement settings in database!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
