import * as argon2 from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Clearing existing data ---');
  await prisma.auditLog.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.media.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.customerResult.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.adminUser.deleteMany();

  console.log('--- Seeding Unified Admin User for Better Auth ---');
  const argonHash = await argon2.hash('admin123');
  const adminUserRecord = await prisma.user.upsert({
    where: { email: 'admin@herbiccure.com' },
    update: { role: 'OWNER', status: 'ACTIVE' },
    create: {
      name: 'Herbic Cure Admin',
      email: 'admin@herbiccure.com',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.account.upsert({
    where: { id: 'admin-credential-account' },
    update: { password: argonHash, passwordHash: argonHash },
    create: {
      id: 'admin-credential-account',
      userId: adminUserRecord.id,
      accountId: adminUserRecord.id,
      providerId: 'credential',
      password: argonHash,
      passwordHash: argonHash,
    },
  });

  console.log('--- Seeding Admin Users ---');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.create({
    data: {
      email: 'admin@herbiccure.com',
      passwordHash: adminPassword,
      name: 'Herbic Cure Admin',
      role: 'SUPER_ADMIN',
      active: true,
    },
  });
  // Also keep admin@herbicas.com for backward compatibility
  await prisma.adminUser.create({
    data: {
      email: 'admin@herbicas.com',
      passwordHash: adminPassword,
      name: 'Herbic Cure Super Admin',
      role: 'SUPER_ADMIN',
      active: true,
    },
  });

  console.log('--- Seeding Customer Demo Account ---');
  const customerPassword = await bcrypt.hash('customer123', 10);
  await prisma.customer.create({
    data: {
      email: 'priya.sharma@example.com',
      passwordHash: customerPassword,
      name: 'Priya Sharma',
      phone: '+91 8121961219',
      addresses: {
        create: {
          name: 'Priya Sharma',
          phone: '+91 8121961219',
          addressLine1: 'Flat 402, Green Valley Apartments',
          addressLine2: 'Road No. 12, Banjara Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pinCode: '500034',
          country: 'India',
          isDefault: true,
        },
      },
    },
  });

  console.log('--- Seeding Site Settings ---');
  const siteSettings = [
    { key: 'brand_name', value: 'Herbic Cure' },
    { key: 'site_title', value: 'Herbic Cure | 21 Herbs Fusion Hair Oil & Ayurvedic Hair Wellness' },
    { key: 'meta_description', value: 'Herbic Cure - Nature in Every Drop. 100% Herbal 21 Herbs Fusion Hair Oil, Shampoo with Conditioner, and Handcrafted Neem Wood Combs for hair fall control and rapid hair growth.' },
    { key: 'logo_url', value: '/images/banners/herbic-cure-logo.png' },
    { key: 'whatsapp_number', value: '918121961219' },
    { key: 'contact_email', value: 'care@herbiccure.com' },
    { key: 'contact_phone', value: '+91 8121961219' },
    { key: 'address', value: 'Herbic Cure Ayurvedic Naturals, Plot 45, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081' },
    { key: 'free_shipping_threshold', value: '499' },
    { key: 'standard_shipping_fee', value: '49' },
    { key: 'cod_available', value: 'true' },
    { key: 'razorpay_enabled', value: 'true' },
    { key: 'announcements', value: JSON.stringify([
      '🌿 Herbic Cure: Nature in Every Drop • 100% Herbal 21 Herbs Fusion Hair Oil',
      '🚚 Free Express Shipping across India on orders above ₹499',
      '✨ Flat 50% Off Introductory Offer — Cash on Delivery Available',
      '💬 Instant WhatsApp Ayurvedic Consultation: +91 8121961219'
    ]) },
  ];

  for (const s of siteSettings) {
    await prisma.siteSetting.create({ data: s });
  }

  console.log('--- Seeding 21 Ayurvedic Ingredients ---');
  const ingredientsList = [
    {
      name: 'Bhringraj',
      sanskritName: 'Keshraj (King of Hair)',
      botanicalName: 'Eclipta prostrata',
      role: 'Primary Activator',
      description: 'Ancient Ayurvedic herb celebrated for activating micro-circulation in the scalp, reviving dormant hair follicles, and arresting premature greying.',
      benefits: 'Stimulates root micro-circulation, stops acute shedding, deepens natural hair color.',
      displayOrder: 1,
    },
    {
      name: 'Amla',
      sanskritName: 'Amalaki',
      botanicalName: 'Phyllanthus emblica',
      role: 'Vitamin C Antioxidant',
      description: 'Loaded with bio-available Vitamin C and essential fatty acids, Amla fortifies the hair cortex and prevents oxidative follicle damage.',
      benefits: 'Strengthens hair shafts, eliminates split ends, boosts melanin production.',
      displayOrder: 2,
    },
    {
      name: 'Brahmi',
      sanskritName: 'Bacopa Monnieri',
      botanicalName: 'Bacopa monnieri',
      role: 'Stress Reliever & Scalp Calmer',
      description: 'Calms the nervous system, alleviates hair loss caused by psychological stress, and supplies vital alkaloids directly to hair roots.',
      benefits: 'Reduces cortisol-triggered hair fall, cools burning scalp, coats roots with protective sheen.',
      displayOrder: 3,
    },
    {
      name: 'Hibiscus',
      sanskritName: 'Japa Pushpa',
      botanicalName: 'Hibiscus rosa-sinensis',
      role: 'Keratin Builder & Volume Enhancer',
      description: 'Rich in natural amino acids and mucilage, Hibiscus stimulates keratin protein synthesis for thick, bouncy, lustrous hair strands.',
      benefits: 'Increases hair thickness, conditions dry brittle ends, prevents premature shedding.',
      displayOrder: 4,
    },
    {
      name: 'Fenugreek',
      sanskritName: 'Methi',
      botanicalName: 'Trigonella foenum-graecum',
      role: 'Anti-Dandruff & Follicle Rebuilder',
      description: 'Abundant in nicotinic acid and lecithin, fenugreek cleanses scalp buildup, eradicates stubborn dandruff, and rebuilds damaged hair follicles.',
      benefits: 'Clears dandruff flakes, moisturizes dry scalp, boosts hair shaft tensile strength.',
      displayOrder: 5,
    },
    {
      name: 'Neem',
      sanskritName: 'Nimba',
      botanicalName: 'Azadirachta indica',
      role: 'Antimicrobial Scalp Shield',
      description: 'Powerful antibacterial and antifungal shield that purifies the scalp biome, soothes itching, and maintains healthy sebum balance.',
      benefits: 'Eliminates fungal dandruff, soothes scalp inflammation, prevents lice and microbes.',
      displayOrder: 6,
    },
    {
      name: 'Rosemary',
      sanskritName: 'Rusmari',
      botanicalName: 'Salvia rosmarinus',
      role: 'DHT Blocker & Regrowth Stimulator',
      description: 'Clinically benchmarked against minoxidil in peer-reviewed studies for stimulating cellular regrowth and curbing androgenetic follicle shrinking.',
      benefits: 'Blocks scalp DHT receptors, encourages new baby hair growth, improves hair density.',
      displayOrder: 7,
    },
    {
      name: 'Jatamansi',
      sanskritName: 'Spikenard',
      botanicalName: 'Nardostachys jatamansi',
      role: 'Anagen Phase Extender',
      description: 'Himalayan root renowned for extending the anagen (growth) cycle of hair, allowing hair to grow significantly longer without shedding.',
      benefits: 'Lengthens anagen phase, calms mental stress, promotes deep restful sleep when applied at night.',
      displayOrder: 8,
    },
    {
      name: 'Shikakai',
      sanskritName: 'Fruit for Hair',
      botanicalName: 'Senegalia rugata',
      role: 'Natural Cleanser & Detangler',
      description: 'Low-pH fruit rich in vitamins A, D, E, and K that gently detangles hair and conditions roots without stripping natural oils.',
      benefits: 'Natural silky detangling, maintains scalp pH 5.5, prevents frizz and dryness.',
      displayOrder: 9,
    },
    {
      name: 'Nagarmotha',
      sanskritName: 'Nut Grass Root',
      botanicalName: 'Cyperus rotundus',
      role: 'Sebum Controller',
      description: 'Traditional root that decongests clogged sebum pores and regulates oily scalp conditions without drying out hair ends.',
      benefits: 'Unclogs hair follicles, balances oiliness, imparts rich woody fragrance.',
      displayOrder: 10,
    },
    {
      name: 'Aloe Vera',
      sanskritName: 'Ghritkumari',
      botanicalName: 'Aloe barbadensis miller',
      role: 'Hydration Reservoir',
      description: 'Supplies proteolytic enzymes that dissolve dead skin cells on the scalp while locking deep moisture into dry hair strands.',
      benefits: 'Intense moisture lock, repairs dead cuticle cells, calms itchy scalp.',
      displayOrder: 11,
    },
    {
      name: 'Castor Seed Oil',
      sanskritName: 'Eranda Taila',
      botanicalName: 'Ricinus communis',
      role: 'Density & Thickness Booster',
      description: 'Packed with ricinoleic acid and omega-6 fatty acids, cold-pressed castor creates a barrier that prevents breakage and promotes thick regrowth.',
      benefits: 'Thickens sparse hairline, reinforces shaft elasticity, seals moisture.',
      displayOrder: 12,
    },
    {
      name: 'Gunja',
      sanskritName: 'Ratti Seeds',
      botanicalName: 'Abrus precatorius',
      role: 'Alopecia Fighter',
      description: 'Potent Ayurvedic seeds traditionally boiled in herbal oils to combat patchy bald spots (Indralupta/Alopecia Areata).',
      benefits: 'Targets stubborn patchy thinning, activates dormant hair papilla.',
      displayOrder: 13,
    },
    {
      name: 'Lodhra',
      sanskritName: 'Symplocos Bark',
      botanicalName: 'Symplocos racemosa',
      role: 'Follicle Tightener',
      description: 'Natural astringent bark that firms up the scalp tissue, tightening loose hair roots and drastically reducing shedding during brushing.',
      benefits: 'Tightens loose hair roots, reduces brush shedding, soothes scalp heat.',
      displayOrder: 14,
    },
    {
      name: 'Manjistha',
      sanskritName: 'Indian Madder',
      botanicalName: 'Rubia cordifolia',
      role: 'Blood Purifier & Scalp Detox',
      description: 'Flushes metabolic waste and toxins out of the dermal papilla, enhancing pure oxygen and nutrient supply to hair roots.',
      benefits: 'Deep follicle detoxification, improves blood micro-circulation, imparts healthy shine.',
      displayOrder: 15,
    },
    {
      name: 'Kalonji (Black Seed)',
      sanskritName: 'Upakunchika',
      botanicalName: 'Nigella sativa',
      role: 'Thymoquinone Super-Nutrient',
      description: 'Contains concentrated thymoquinone to nourish weakened follicles, combat autoimmune thinning, and smooth rough cuticles.',
      benefits: 'Revitalizes brittle hair, combats premature greying, restores silky softness.',
      displayOrder: 16,
    },
    {
      name: 'Camphor',
      sanskritName: 'Karpura',
      botanicalName: 'Cinnamomum camphora',
      role: 'Cooling Circulation Catalyst',
      description: 'Stimulates sensory nerve endings with an invigorating tingling cooling sensation that triggers instant blood rush to the roots.',
      benefits: 'Instant cooling relief, boosts nutrient flow, prevents scalp itching.',
      displayOrder: 17,
    },
    {
      name: 'Tulsi',
      sanskritName: 'Holy Basil',
      botanicalName: 'Ocimum sanctum',
      role: 'Scalp Detox & Immunity',
      description: 'Antibacterial adaptogen that keeps the scalp microbiome healthy and resilient against environmental pollution and hard water damage.',
      benefits: 'Protects from pollution, maintains scalp hydration, reduces scalp tenderness.',
      displayOrder: 18,
    },
    {
      name: 'Curry Leaves',
      sanskritName: 'Kaidarya',
      botanicalName: 'Murraya koenigii',
      role: 'Beta-Carotene Powerhouse',
      description: 'Rich in beta-carotene and essential proteins that strengthen the cellular fiber of each strand, preventing breakage and premature greying.',
      benefits: 'Restores natural dark pigment, repairs damaged cuticle scales, reduces thinning.',
      displayOrder: 19,
    },
    {
      name: 'Cold-Pressed Sesame Oil',
      sanskritName: 'Tila Taila',
      botanicalName: 'Sesamum indicum',
      role: 'Deep-Penetrating Ayurvedic Carrier',
      description: 'The premier Ayurvedic base oil capable of carrying herb nutrients deep into the third dermal layer without feeling greasy.',
      benefits: 'Deep cellular absorption, natural UV protectant, nourishing lipid base.',
      displayOrder: 20,
    },
    {
      name: 'Virgin Coconut Oil',
      sanskritName: 'Narikela Taila',
      botanicalName: 'Cocos nucifera',
      role: 'Lauric Acid Moisture Sealant',
      description: 'High-affinity lauric acid easily binds with hair keratin protein, preventing protein loss and keeping locks deeply hydrated.',
      benefits: 'Prevents protein loss, seals split ends, provides brilliant glossy finish.',
      displayOrder: 21,
    },
  ];

  const dbIngredients = [];
  for (const ing of ingredientsList) {
    const slug = ing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await prisma.ingredient.create({
      data: {
        name: ing.name,
        slug,
        shortDescription: `${ing.sanskritName} • ${ing.role}`,
        fullDescription: ing.description,
        benefits: ing.benefits,
        displayOrder: ing.displayOrder,
        image: `/images/ingredients/${slug}.png`,
        active: true,
      },
    });
    dbIngredients.push(created);
  }

  console.log('--- Seeding Categories ---');
  const catOil = await prisma.category.create({
    data: {
      name: '21 Herbs Hair Oils',
      slug: 'hair-oils',
      description: 'Herbic Cure flagship cold-pressed 21 Herbs Fusion Hair Oils formulated to control hair fall and stimulate rapid regrowth.',
      image: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg',
      displayOrder: 1,
    },
  });

  const catShampoo = await prisma.category.create({
    data: {
      name: 'Shampoo & Conditioners',
      slug: 'shampoo-and-conditioner',
      description: 'Gentle, sulfate-free Biotin & 21 Herbs infused cleansers that leave hair silky, voluminous, and healthy.',
      image: '/images/products/herbic-cure/herbic-cure-shampoo-q1.jpg',
      displayOrder: 2,
    },
  });

  const catCombo = await prisma.category.create({
    data: {
      name: 'Combos & Kits',
      slug: 'combos',
      description: 'Curated complete therapy bundles combining 21 Herbs Hair Oil, Shampoo with Conditioner, and hand-carved Neem wood combs.',
      image: '/images/products/herbic-cure/herbic-cure-complete-trio-kit.jpg',
      displayOrder: 3,
    },
  });

  const catAccessories = await prisma.category.create({
    data: {
      name: 'Wooden Accessories',
      slug: 'accessories',
      description: 'Handcrafted pure neem wood combs and scalp massagers for anti-static, gentle detangling.',
      image: '/images/products/herbic-cure/herbic-cure-neem-wood-comb.jpg',
      displayOrder: 4,
    },
  });

  console.log('--- Seeding Collections ---');
  const colBestSellers = await prisma.collection.create({
    data: {
      name: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Our highest-rated, most loved Ayurvedic hair fall control products.',
      bannerImage: '/images/banners/herbic-hero-banner-1.jpg',
      displayOrder: 1,
    },
  });

  const colHairOils = await prisma.collection.create({
    data: {
      name: '21 Herbs Hair Oils',
      slug: 'hair-oils',
      description: 'Pure Ayurvedic infusions of 21 herbs, roots, and botanicals.',
      bannerImage: '/images/banners/herbic-hero-banner-1.jpg',
      displayOrder: 2,
    },
  });

  const colCombos = await prisma.collection.create({
    data: {
      name: 'Combos & Kits',
      slug: 'combos',
      description: 'Value savings packs for complete 360-degree hair wellness.',
      bannerImage: '/images/banners/herbic-hero-banner-2.jpg',
      displayOrder: 3,
    },
  });

  const colAccessories = await prisma.collection.create({
    data: {
      name: 'Wooden Accessories',
      slug: 'accessories',
      description: 'Eco-friendly Neem wood combs for healthy hair naturally.',
      bannerImage: '/images/banners/herbic-hero-banner-1.jpg',
      displayOrder: 4,
    },
  });

  console.log('--- Seeding The 9 Official Herbic Cure Products ---');

  const productsData = [
    // 1. Q1 Hair Oil
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Q1)',
      slug: 'herbic-cure-21-herbs-fusion-hair-oil-q1',
      sku: 'HC-OIL-Q1',
      shortDescription: 'Flagship 190ml Ayurvedic hair oil infused with 21 natural herbs, roots, and floral extracts. Controls hair fall & boosts natural hair growth.',
      fullDescription: `<h6>Herbic Cure 21 Herbs Fusion Hair Oil 🌿</h6>
<p><strong>Nature In Every Drop.</strong> Experience the proven power of authentic Ayurvedic herbs formulated to control acute hair fall, nourish the scalp from root to tip, and stimulate healthy new hair growth.</p>
<h6>What Makes It Special:</h6>
<p>✔ <strong>Infused with 21+ Herbs, Roots & Floral Extracts:</strong> Bhringraj, Amla, Brahmi, Hibiscus, Fenugreek, Neem, Rosemary, and more.</p>
<p>✔ <strong>100% Mineral Oil Free & Paraben Free:</strong> Zero harsh chemicals, silicone-free, cruelty-free.</p>
<p>✔ <strong>Lightweight & Non-Sticky:</strong> Absorbs deep into hair follicles without weighing hair down. Pleasant natural herbal fragrance.</p>
<p>✔ <strong>Suitable for All Hair Types:</strong> Effective for both men and women facing hair thinning, excessive shedding, or dry scalp.</p>`,
      regularPrice: 699,
      salePrice: 469,
      costPrice: 120,
      stockQuantity: 450,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.9,
      reviewCount: 312,
      benefits: JSON.stringify([
        'Controls hair fall within 14 days of regular use',
        'Stimulates dormant roots to trigger new baby hair growth',
        'Deeply nourishes scalp & prevents dry, flaky dandruff',
        'Special 33% OFF limited launch deal (Save ₹230)',
        'Zero mineral oils, parabens, silicones, or synthetic dyes'
      ]),
      howToUse: `Step 1: Take a small amount of oil directly on your palms.
Step 2: Gently massage in circular motions across the scalp for 5 to 10 minutes.
Step 3: Leave on for at least 1 hour, or overnight for intensive nourishment.
Step 4: Wash with mild shampoo. Repeat 2 to 3 times per week for optimal results.`,
      categoryId: catOil.id,
      collectionIds: [colBestSellers.id, colHairOils.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg', altText: 'Herbic Cure 21 Herbs Fusion Hair Oil 190ml Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-root-to-tip.jpg', altText: 'Herbic Cure Care from Root to Tip' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-infused-roots.jpg', altText: 'Herbic Cure Transparent Infused Herbs Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg', altText: 'Herbic Cure vs Local Brand Oil Comparison' },
        { url: '/images/products/herbic-cure/herbic-cure-how-to-use-guide.jpg', altText: 'How to Use Herbic Cure 21 Herbs Oil' },
      ],
    },

    // 2. Q2 Hair Oil (Pack of 2)
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Q2 - Pack of 2)',
      slug: 'herbic-cure-21-herbs-fusion-hair-oil-q2',
      sku: 'HC-OIL-Q2',
      shortDescription: 'Value Twin Pack (2 x 190ml = 380ml). 60-day intensive anti-hair fall and regrowth therapy with 21 pure Himalayan botanicals.',
      fullDescription: `<h6>Herbic Cure 21 Herbs Fusion Hair Oil (Twin Pack) 🌿</h6>
<p>Get a complete 2-month Ayurvedic hair transformation regimen with our popular Pack of 2. Consistent scalp stimulation and deep root nourishment guarantees long-lasting hair density.</p>
<h6>Key Highlights:</h6>
<p>✔ 2 x 190ml Bottles for unbroken hair care routine</p>
<p>✔ Infused with real botanical roots inside each bottle</p>
<p>✔ Extra savings compared to individual purchases</p>`,
      regularPrice: 1398,
      salePrice: 1118,
      costPrice: 220,
      stockQuantity: 320,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.95,
      reviewCount: 248,
      benefits: JSON.stringify([
        'Full 2-month course for stubborn hair thinning & shedding',
        'Saves ₹280 off MRP with 20% bundle discount',
        'Packed with 21 active roots, seeds, and flower extracts',
        'Non-sticky, mineral-oil-free formulation'
      ]),
      howToUse: 'Apply 2-3 times per week. Massage gently into scalp for 5-10 minutes. Leave overnight or at least 1 hour before washing.',
      categoryId: catOil.id,
      collectionIds: [colBestSellers.id, colHairOils.id, colCombos.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-q2-duo.jpg', altText: 'Herbic Cure 21 Herbs Oil Twin Pack (Q2)' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-pure-herbs-duo.jpg', altText: 'Herbic Cure Pure Herbs for Stronger Hair' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg', altText: 'Comparison Infographic' },
        { url: '/images/products/herbic-cure/herbic-cure-how-to-use-guide.jpg', altText: 'How to use Herbic Cure' },
      ],
    },

    // 3. Q3 Hair Oil (Pack of 3)
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil (Q3 - Pack of 3)',
      slug: 'herbic-cure-21-herbs-fusion-hair-oil-q3',
      sku: 'HC-OIL-Q3',
      shortDescription: 'Family Mega Pack (3 x 190ml = 570ml). Comprehensive 90-day Ayurvedic hair wellness package for maximum savings.',
      fullDescription: `<h6>Herbic Cure 21 Herbs Fusion Hair Oil (Pack of 3) 🌿</h6>
<p>The ultimate 3-month family value pack. Sustained application ensures hair follicles enter the active anagen phase, promoting thicker strands and voluminous bounce.</p>`,
      regularPrice: 2097,
      salePrice: 1677,
      costPrice: 320,
      stockQuantity: 210,
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      isOnSale: true,
      rating: 4.92,
      reviewCount: 185,
      benefits: JSON.stringify([
        'Save ₹420 off MRP with flat 20% discount',
        'Ideal 90-day course for full follicle reactivation',
        'Shared family hair wellness bottle pack',
        'Pure cold-pressed Kshirapak herbal preparation'
      ]),
      howToUse: 'Massage 2-3 times weekly. Leave for 1 hour or overnight.',
      categoryId: catOil.id,
      collectionIds: [colHairOils.id, colCombos.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-q3-trio.jpg', altText: 'Herbic Cure 21 Herbs Oil Trio Pack (Q3)' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg', altText: 'Herbic Cure Single Bottle Detail' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg', altText: 'Comparison Infographic' },
      ],
    },

    // 4. Hair Oil + Neem Wood Comb
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil + Natural Neem Wood Comb',
      slug: 'herbic-cure-21-herbs-fusion-hair-oil-neem-wood-comb',
      sku: 'HC-OIL-COMB',
      shortDescription: 'Bestselling Duo: 190ml 21 Herbs Hair Oil + Handcrafted Pure Neem Wood Comb. Reduces breakage & stimulates scalp acupressure points.',
      fullDescription: `<h6>Herbic Cure Oil & Neem Wood Comb Ritual Kit 🌿🪵</h6>
<p>Combine the deep follicle nourishment of our 21 Herbs Fusion Hair Oil with the gentle, anti-static detangling of a 100% natural Neem Wood Comb.</p>
<p>Unlike plastic combs that cause static charge and pull fragile roots, Neem wood naturally prevents dandruff, massages the scalp, and stimulates healthy blood flow.</p>`,
      regularPrice: 848,
      salePrice: 695,
      costPrice: 150,
      stockQuantity: 400,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.97,
      reviewCount: 420,
      benefits: JSON.stringify([
        'Neem wood releases natural medicinal oils directly to scalp',
        'Zero static electricity — glides smoothly without hair snapping',
        'Oil penetrates deeper when combed through after gentle massage',
        '18% OFF combo savings (Save ₹153)'
      ]),
      howToUse: 'Apply 21 Herbs Oil to scalp. Use the Neem Wood Comb to gently comb through from roots to tips, distributing oil evenly.',
      categoryId: catCombo.id,
      collectionIds: [colBestSellers.id, colCombos.id, colAccessories.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-neem-comb-combo.jpg', altText: 'Herbic Cure 21 Herbs Oil + Natural Neem Wood Comb' },
        { url: '/images/products/herbic-cure/herbic-cure-neem-wood-comb.jpg', altText: 'Handcrafted Neem Wood Comb Detail' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg', altText: 'Herbic Cure Oil Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-how-to-use-guide.jpg', altText: 'How to use guide' },
      ],
    },

    // 5. Natural Neem Wood Comb
    {
      name: 'Herbic Cure - Natural Neem Wood Comb',
      slug: 'herbic-cure-natural-neem-wood-comb',
      sku: 'HC-COMB-01',
      shortDescription: '100% pure handcrafted Neem wood comb with rounded teeth. Anti-static, stimulates scalp circulation, and prevents frizz & breakage.',
      fullDescription: `<h6>Herbic Cure Handcrafted Neem Wood Comb 🪵</h6>
<p><strong>Small Comb, Big Care for Your Hair.</strong> Carved from seasoned Indian Neem wood, this comb distributes scalp sebum naturally, detangles effortlessly without pulling, and imparts natural antibacterial protection.</p>
<h6>Why You Need a Neem Wood Comb:</h6>
<p>✔ 100% Natural Wood — Zero toxic plastic or petroleum polymers</p>
<p>✔ Reduces Hair Fall caused by static pulling and tension</p>
<p>✔ Gentle on Scalp: Rounded hand-filed teeth massage pressure points</p>
<p>✔ Eco-Friendly, Biodegradable & Long-Lasting</p>`,
      regularPrice: 149,
      salePrice: 128,
      costPrice: 40,
      stockQuantity: 600,
      isFeatured: false,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.88,
      reviewCount: 165,
      benefits: JSON.stringify([
        '100% pure natural Neem wood with herbal properties',
        'Anti-static: Eliminates frizz and flying hair strands',
        'Smooth rounded teeth that massage scalp acupoints',
        '14% OFF limited offer on handcrafted Neem wood'
      ]),
      howToUse: 'Use morning and evening on dry or slightly damp hair. Gently detangle starting from the ends and moving upward towards the roots.',
      categoryId: catAccessories.id,
      collectionIds: [colAccessories.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-neem-wood-comb.jpg', altText: 'Herbic Cure Natural Neem Wood Comb' },
      ],
    },

    // 6. Shampoo with Conditioner Q1
    {
      name: 'Herbic Cure - Shampoo with Conditioner (Q1)',
      slug: 'herbic-cure-shampoo-with-conditioner-q1',
      sku: 'HC-SHMP-Q1',
      shortDescription: '2-in-1 Daily Cleansing Shampoo with Conditioner (200ml) enriched with Neem, Tulsi & Argan Oil + Shea Butter. Paraben-free, pH balanced for all hair types.',
      fullDescription: `<h6>Herbic Cure Daily Cleansing Shampoo with Conditioner 🧴</h6>
<p><strong>Gentle Cleansing. Healthier-Looking Hair.</strong> Cleanse, nourish, and refresh with our authentic 2-in-1 formula combining thorough scalp cleansing and deep botanical conditioning in one easy wash.</p>
<h6>Why You Will Love It:</h6>
<p>✔ <strong>Enriched with Neem, Tulsi & Argan Oil + Shea Butter:</strong> Deeply cleanses impurities while adding brilliant natural shine and silky softness.</p>
<p>✔ <strong>Sulfate-Free & Paraben-Free:</strong> Gentle pH-balanced formulation that preserves essential scalp oils.</p>
<p>✔ <strong>Unisex & Suitable for All Hair Types:</strong> Daily use formula designed for oily, dry, or chemically treated hair.</p>`,
      regularPrice: 599,
      salePrice: 489,
      costPrice: 110,
      stockQuantity: 380,
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      isOnSale: true,
      rating: 4.89,
      reviewCount: 140,
      benefits: JSON.stringify([
        '2-in-1 Formula: Shampoo + Conditioner in one refreshing wash',
        'Enriched with Neem, Tulsi, Argan Oil and pure Shea Butter',
        '100% Paraben-free, pH balanced, and sulfate-free',
        '18% OFF launch discount (Save ₹110)'
      ]),
      howToUse: '01 Wet: Thoroughly wet your hair with water. 02 Apply: Take a suitable amount and gently massage into scalp and hair. 03 Rinse: Rinse thoroughly with water.',
      categoryId: catShampoo.id,
      collectionIds: [colBestSellers.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-main.jpg', altText: 'Herbic Cure Daily Cleansing Shampoo with Conditioner 200ml Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-hero-benefits.jpg', altText: 'Herbic Cure Shampoo Cleanse Nourish Refresh Benefits' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-ingredients.jpg', altText: 'Power of Natural Ingredients: Neem, Tulsi, Argan Oil, Shea Butter' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-how-to-use.jpg', altText: 'How to Use Herbic Cure Shampoo with Conditioner' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-why-choose.jpg', altText: 'Why Choose Herbic Cure Shampoo - Sulfate & Paraben Free' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg', altText: 'Healthy Scalp, Naturally Beautiful Hair' },
      ],
    },

    // 7. Shampoo with Conditioner Q2 (Pack of 2)
    {
      name: 'Herbic Cure - Shampoo with Conditioner (Q2 - Pack of 2)',
      slug: 'herbic-cure-shampoo-with-conditioner-q2',
      sku: 'HC-SHMP-Q2',
      shortDescription: 'Value Twin Pack (2 x 200ml = 400ml) of Herbic Cure 2-in-1 Daily Cleansing Shampoo with Conditioner. Long-lasting nourishment for healthier-looking hair.',
      fullDescription: `<h6>Herbic Cure Shampoo with Conditioner (Duo Pack) 🧴</h6>
<p>Double the daily cleansing and conditioning with our 2-pack Shampoo with Conditioner bundle. Enriched with Neem, Tulsi, Argan Oil, and Shea Butter for soft, tangle-free hair every day.</p>`,
      regularPrice: 1198,
      salePrice: 999,
      costPrice: 200,
      stockQuantity: 250,
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      isOnSale: true,
      rating: 4.91,
      reviewCount: 96,
      benefits: JSON.stringify([
        'Twin 200ml bottles (total 400ml) for extended family routine',
        'Save ₹199 with 16% twin-pack discount',
        'Paraben-free and pH balanced for daily cleansing'
      ]),
      howToUse: 'Lather into wet scalp and rinse thoroughly. Ideal for daily or alternate day use.',
      categoryId: catShampoo.id,
      collectionIds: [colCombos.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-hero-benefits.jpg', altText: 'Herbic Cure Shampoo Duo Pack (Q2)' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-main.jpg', altText: 'Herbic Cure Shampoo 200ml Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-why-choose.jpg', altText: 'Herbic Cure Shampoo Quality Features' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-ingredients.jpg', altText: 'Natural Botanical Actives' },
      ],
    },

    // 8. 21 Herbs Hair Oil + Shampoo with Conditioner
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil + Shampoo with Conditioner',
      slug: 'herbic-cure-21-herbs-hair-oil-shampoo-with-conditioner',
      sku: 'HC-HO-S',
      shortDescription: 'Complete Hair Care Duo: 190ml 21 Herbs Fusion Hair Oil + 200ml Daily Cleansing Shampoo with Conditioner. Nourish, Cleanse & Strengthen.',
      fullDescription: `<h6>Herbic Cure Complete Hair Care Duo 🌿🧴</h6>
<p><strong>Nourish • Cleanse • Strengthen.</strong> The ultimate two-part Ayurvedic harmony for complete hair fall reversal:</p>
<p>✔ <strong>Reduces Hair Fall & Nourishes Scalp:</strong> 21 Herbs Fusion Hair Oil delivers deep root stimulation and strengthens follicles.</p>
<p>✔ <strong>Deep Cleansing & Conditions Hair:</strong> Daily Cleansing Shampoo with Conditioner gently washes away grime with Neem & Tulsi while Argan Oil & Shea Butter leave strands touchably soft.</p>`,
      regularPrice: 1298,
      salePrice: 1038,
      costPrice: 220,
      stockQuantity: 300,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.96,
      reviewCount: 290,
      benefits: JSON.stringify([
        'Harmonized 2-step treatment: Oil overnight, cleanse gently in the morning',
        'Reduces hair fall, strengthens roots, adds natural shine and silky feel',
        '20% OFF combo savings: ₹1,298 down to ₹1,038 (Save ₹260)',
        '100% Mineral-oil-free, paraben-free & sulfate-free'
      ]),
      howToUse: 'Step 1: Massage 21 Herbs Hair Oil into scalp roots and leave for 1 hour or overnight. Step 2: Wash off with Herbic Cure Daily Cleansing Shampoo with Conditioner.',
      categoryId: catCombo.id,
      collectionIds: [colBestSellers.id, colCombos.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-shampoo-combo.jpg', altText: 'Herbic Cure 21 Herbs Hair Oil + Shampoo with Conditioner Duo' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg', altText: 'Complete Hair Care Duo - Nourish, Cleanse, Strengthen Infographic' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg', altText: 'Herbic Cure 21 Herbs Fusion Hair Oil Bottle' },
        { url: '/images/products/herbic-cure/herbic-cure-shampoo-main.jpg', altText: 'Herbic Cure Shampoo with Conditioner Bottle' },
      ],
    },

    // 9. 21 Herbs Hair Oil + Shampoo with Conditioner + Neem Wood Comb
    {
      name: 'Herbic Cure - 21 Herbs Fusion Hair Oil + Shampoo with Conditioner + Neem Wood Comb',
      slug: 'herbic-cure-complete-hair-therapy-kit',
      sku: 'HC-KIT-COMPLETE',
      shortDescription: 'All-in-One Complete Hair Care Kit: 21 Herbs Fusion Hair Oil (190ml) + Shampoo with Conditioner (200ml) + Natural Neem Wood Comb.',
      fullDescription: `<h6>Herbic Cure 360° Complete Hair Care Kit 🌿🧴🪵</h6>
<p>Everything your hair needs in one luxurious bundle. Stop hair fall, revive damaged follicles, cleanse gently, and detangle smoothly with nature’s best:</p>
<p>🌿 <strong>Herbic Cure 21 Herbs Fusion Hair Oil (190ml):</strong> Deep follicular activation and scalp revitalization.</p>
<p>🧴 <strong>Herbic Cure Shampoo with Conditioner (200ml):</strong> Gentle, sulfate-free cleansing with Neem, Tulsi & Argan Oil.</p>
<p>🪵 <strong>Handcrafted Neem Wood Comb:</strong> Anti-static gentle detangler that boosts scalp circulation.</p>`,
      regularPrice: 1448,
      salePrice: 1158,
      costPrice: 260,
      stockQuantity: 280,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      rating: 4.98,
      reviewCount: 380,
      benefits: JSON.stringify([
        'Complete 3-step Ayurvedic routine: Oil, Cleanse, Detangle',
        '20% OFF comprehensive kit savings (Save ₹290!)',
        'Noticeably thicker, softer, and longer hair within weeks',
        'Includes Free Express Shipping & Cash on Delivery'
      ]),
      howToUse: 'Step 1: Massage 21 Herbs Oil into scalp for 5-10 mins. Step 2: Wash with Shampoo with Conditioner. Step 3: Gently comb through with the Neem Wood Comb.',
      categoryId: catCombo.id,
      collectionIds: [colBestSellers.id, colCombos.id],
      images: [
        { url: '/images/products/herbic-cure/herbic-cure-oil-shampoo-combo.jpg', altText: 'Herbic Cure Complete Hair Therapy Kit' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg', altText: 'Complete Hair Care Benefits Guide' },
        { url: '/images/products/herbic-cure/herbic-cure-oil-neem-comb-combo.jpg', altText: 'Oil & Comb Close-up' },
        { url: '/images/products/herbic-cure/herbic-cure-neem-wood-comb.jpg', altText: 'Natural Neem Wood Comb' },
      ],
    },
  ];

  for (const p of productsData) {
    const { images, collectionIds, ...productDetails } = p;
    const createdProduct = await prisma.product.create({
      data: {
        ...productDetails,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.altText,
            displayOrder: idx + 1,
            isThumbnail: idx === 0,
          })),
        },
        collections: {
          create: collectionIds.map((colId) => ({
            collectionId: colId,
          })),
        },
      },
    });

    // Link top 5 ingredients to oil products
    if (p.slug.includes('oil')) {
      for (let i = 0; i < Math.min(dbIngredients.length, 7); i++) {
        await prisma.productIngredient.create({
          data: {
            productId: createdProduct.id,
            ingredientId: dbIngredients[i].id,
          },
        });
      }
    }
  }

  console.log('--- Seeding Coupons ---');
  await prisma.coupon.createMany({
    data: [
      {
        code: 'HERBIC10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 0,
        maxDiscount: 200,
        usageLimit: 1000,
        active: true,
      },
      {
        code: 'GROWTH100',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderValue: 699,
        usageLimit: 500,
        active: true,
      },
      {
        code: 'AYURVEDA20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 999,
        maxDiscount: 400,
        usageLimit: 250,
        active: true,
      },
    ],
  });

  console.log('--- Seeding Customer Results ---');
  await prisma.customerResult.createMany({
    data: [
      {
        customerName: 'Ananya S., Bengaluru',
        productTitle: 'Herbic Cure 21 Herbs Fusion Hair Oil',
        beforeImage: '/images/results/result-1.png',
        afterImage: '/images/results/result-2.png',
        caption: 'Parting line visibly denser and post-wash shedding stopped in 8 weeks.',
        displayOrder: 1,
        active: true,
      },
      {
        customerName: 'Rohit K., Pune',
        productTitle: '21 Herbs Oil + Neem Wood Comb',
        beforeImage: '/images/results/result-3.png',
        afterImage: '/images/results/result-4.png',
        caption: 'Receding temple corners filled in with healthy, dark baby hair in 12 weeks.',
        displayOrder: 2,
        active: true,
      },
    ],
  });

  console.log('--- Seeding Social UGC Posts ---');
  await prisma.socialPost.createMany({
    data: [
      {
        thumbnailUrl: '/images/banners/client-1.png',
        caption: 'Night oiling routine with Herbic Cure 21 Herbs Fusion Hair Oil. My hair feels so soft!',
        productTitle: '21 Herbs Fusion Hair Oil',
        instagramUrl: 'https://www.instagram.com/',
        displayOrder: 1,
        active: true,
      },
      {
        thumbnailUrl: '/images/banners/client-2.png',
        caption: 'Neem wood comb + 21 herbs oil: The easiest 5-minute hair routine that stopped my hair fall.',
        productTitle: 'Complete Hair Therapy Kit',
        instagramUrl: 'https://www.instagram.com/',
        displayOrder: 2,
        active: true,
      },
      {
        thumbnailUrl: '/images/banners/client-3.png',
        caption: '12-week transformation! Look at that volume and shine without any chemicals.',
        productTitle: '21 Herbs Fusion Hair Oil (Twin Pack)',
        instagramUrl: 'https://www.instagram.com/',
        displayOrder: 3,
        active: true,
      },
      {
        thumbnailUrl: '/images/banners/client-4.png',
        caption: 'Pure botanical roots infused right inside the bottle! You can literally smell the authenticity.',
        productTitle: '21 Herbs Fusion Hair Oil',
        instagramUrl: 'https://www.instagram.com/',
        displayOrder: 4,
        active: true,
      },
    ],
  });

  console.log('--- Seeding Blog Posts ---');
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'The Science of Kshirapak Vidhi: How 21 Himalayan Herbs Reverse Hair Fall',
        slug: 'science-of-kshirapak-vidhi-hair-fall-control',
        excerpt: 'Discover the ancient 72-hour slow-boiling ritual that locks active alkaloids from Bhringraj and Amla into a deep-penetrating elixir.',
        content: `<h3>What is Kshirapak Vidhi?</h3>
<p>Kshirapak Vidhi is an esteemed Vedic pharmaceutical preparation where medicinal herbs are slow-boiled in pure cow milk and cold-pressed sesame oil until the entire moisture evaporates, leaving behind only the concentrated therapeutic essence of the botanicals.</p>
<h3>Why Modern Mineral Oils Fail</h3>
<p>Standard commercial hair oils contain up to 90% liquid paraffin (mineral oil), which merely coats the hair shaft in synthetic silicone wax, suffocating the dermal papilla. In contrast, Herbic Cure 21 Herbs Fusion Hair Oil is 100% natural, penetrating all three layers of the hair follicle to stimulate active root cells.</p>`,
        featuredImage: '/images/products/herbic-cure/herbic-cure-oil-pure-herbs-duo.jpg',
        author: 'Dr. Meera Nambiar (BAMS, MD Ayurveda)',
        published: true,
        tags: 'Ayurveda,Hair Fall,Kshirapak Vidhi,Bhringraj',
      },
      {
        title: 'Why You Must Switch from Plastic Combs to Pure Neem Wood Immediately',
        slug: 'why-switch-to-neem-wood-combs',
        excerpt: 'How plastic combs generate static charge that tears fragile follicles, and why handcrafted Neem wood acts as a natural scalp doctor.',
        content: `<h3>The Hidden Cause of Brushing Hair Loss: Static Friction</h3>
<p>When synthetic plastic or nylon combs pass through dry hair, they generate up to 2,000 volts of static micro-friction. This static pulls brittle root bulbs straight out of their follicles.</p>
<h3>The Healing Power of Neem Wood</h3>
<p>Herbic Cure Neem Wood Combs are carved from seasoned Margosa (Neem) timber. Each stroke distributes natural scalp lipids evenly along the shaft while depositing trace amounts of azadirachtin to keep dandruff and bacteria away.</p>`,
        featuredImage: '/images/products/herbic-cure/herbic-cure-neem-wood-comb.jpg',
        author: 'Ayurvedic Wellness Team',
        published: true,
        tags: 'Neem Comb,Detangling,Anti-Static,Hair Care Rituals',
      },
    ],
  });

  console.log('--- Seeding FAQs ---');
  await prisma.fAQ.createMany({
    data: [
      {
        question: 'How quickly can I expect to see results with Herbic Cure 21 Herbs Fusion Hair Oil?',
        answer: 'Most customers notice a substantial reduction in hair fall and shower shedding within 14 to 21 days of consistent use (2-3 times per week). Visible baby hair regrowth around receding temples and Crown volume typically becomes noticeable between weeks 6 and 10.',
        category: 'Usage & Results',
        displayOrder: 1,
        active: true,
      },
      {
        question: 'Is Herbic Cure suitable for oily scalps or color-treated hair?',
        answer: 'Yes! Herbic Cure 21 Herbs Fusion Hair Oil is lightweight, non-sticky, and 100% free from mineral oil or artificial colorants. It will not strip or alter chemical hair color, and its antimicrobial herbs naturally regulate excess scalp sebum.',
        category: 'Product Suitability',
        displayOrder: 2,
        active: true,
      },
      {
        question: 'Can I leave the oil on overnight?',
        answer: 'Yes, leaving Herbic Cure overnight is highly recommended for intensive hair therapy. The therapeutic botanicals like Jatamansi and Brahmi also calm the nervous system and promote peaceful, deep sleep.',
        category: 'Application Rituals',
        displayOrder: 3,
        active: true,
      },
      {
        question: 'Do you offer Cash on Delivery (COD) across India?',
        answer: 'Yes! We offer Cash on Delivery (COD) to over 26,000 pin codes across India. You can also pay online via UPI (Google Pay, PhonePe, Paytm) or Cards for express same-day dispatch.',
        category: 'Shipping & Payment',
        displayOrder: 4,
        active: true,
      },
      {
        question: 'How do I reach Ayurvedic customer support for personal guidance?',
        answer: 'You can directly message our Ayurvedic hair wellness specialists on WhatsApp at +91 8121961219 (Monday through Saturday, 9 AM to 7 PM IST).',
        category: 'Support',
        displayOrder: 5,
        active: true,
      },
    ],
  });

  console.log('--- Seeding Homepage Content Sections (8 Locked Sections) ---');
  await prisma.homepageSection.createMany({
    data: [
      {
        sectionType: 'HERO_SLIDER',
        title: 'Hero Banner Slider',
        subtitle: 'Discover Authentic Ayurvedic Hair Rituals',
        displayOrder: 0,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'BEST_SELLERS',
        title: 'Best Selling Hair Rituals',
        subtitle: 'Handcrafted with 21 potent herbs for visible restoration',
        displayOrder: 1,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'CATEGORIES',
        title: 'Explore Ayurvedic Categories',
        subtitle: 'Targeted wellness collections for every hair need',
        displayOrder: 2,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'DISCOVER',
        title: 'Combo',
        subtitle: 'Rooted in Kshirapak Vidhi and nature purity',
        displayOrder: 3,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'REVIEWS',
        title: 'Loved by Over 50,000+ Customers',
        subtitle: 'Verified feedback from genuine daily users',
        displayOrder: 4,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'REELS',
        title: 'Trending on Social',
        subtitle: 'Watch genuine creator hair journeys and unboxings',
        displayOrder: 5,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'WHY_US',
        title: 'The Herbic Cure Promise',
        subtitle: 'Clean, transparent, authentic ayurveda guaranteed',
        displayOrder: 6,
        contentJson: '{}',
        active: true,
      },
      {
        sectionType: 'FAQ',
        title: 'Frequently Asked Questions',
        subtitle: 'Everything you need to know about our oils and rituals',
        displayOrder: 7,
        contentJson: '{}',
        active: true,
      },
    ],
  });

  console.log('--- Seeding Sample Orders ---');
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'HC-10028',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@example.com',
      customerPhone: '+91 8121961219',
      shippingAddress: JSON.stringify({
        name: 'Priya Sharma',
        phone: '+91 8121961219',
        addressLine1: 'Flat 402, Green Valley Apartments',
        addressLine2: 'Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500034',
        country: 'India',
      }),
      subtotal: 699,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 699,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'SHIPPED',
      trackingNumber: 'SR-784920194',
      trackingUrl: 'https://shiprocket.co/tracking/SR-784920194',
      carrier: 'Shiprocket Express',
      items: {
        create: [
          {
            productName: 'Herbic Cure - 21 Herbs Fusion Hair Oil + Shampoo with Conditioner + Neem Wood Comb',
            productImage: '/images/products/herbic-cure/herbic-cure-complete-trio-kit.jpg',
            price: 699,
            quantity: 1,
            total: 699,
          },
        ],
      },
      events: {
        create: [
          {
            status: 'CONFIRMED',
            description: 'Order confirmed and registered at Herbic Cure dispensary.',
            location: 'Hyderabad Fulfillment Hub',
          },
          {
            status: 'PROCESSING',
            description: 'Freshly packed with natural botanical care and dispatched to courier.',
            location: 'Hyderabad Fulfillment Hub',
          },
          {
            status: 'SHIPPED',
            description: 'In transit via Shiprocket Express Air Cargo.',
            location: 'Banjara Hills Distribution Center',
          },
        ],
      },
    },
  });

  console.log(`--- Seeded Sample Order: ${sampleOrder.orderNumber} ---`);
  console.log('--- Database seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
