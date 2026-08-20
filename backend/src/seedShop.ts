import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Unsplash images — publicly hosted, free to use for mock data
const IMG = {
  // Outfits / activewear
  activewear1: 'https://images.unsplash.com/photo-1483721310020-63127f7b1c3e?w=800&q=80',
  activewear2: 'https://images.unsplash.com/photo-1506629082915-4a27c34b1eb1?w=800&q=80',
  activewear3: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80',
  leggings: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
  top: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&q=80',
  // Cups / drinkware
  cup1: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
  cup2: 'https://images.unsplash.com/photo-1571935441005-16d8c9e0b1f5?w=800&q=80',
  cup3: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
  bottle: 'https://images.unsplash.com/photo-1602143407151-7111545734ba?w=800&q=80',
  // Bags
  bag1: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80',
  bag2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  bag3: 'https://images.unsplash.com/photo-1622560480654-d962224667f1?w=800&q=80',
  tote: 'https://images.unsplash.com/photo-1597481499750-3e6b22437fa2?w=800&q=80',
  // Grip socks
  socks1: 'https://images.unsplash.com/photo-1586350977771-2a1f4d6f4b1e?w=800&q=80',
  socks2: 'https://images.unsplash.com/photo-1582966771488-89d6c5b1d9a3?w=800&q=80',
  socks3: 'https://images.unsplash.com/photo-1622599657813-9b3e1e1e3e3e?w=800&q=80',
  // Hair accessories
  hair1: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
  hair2: 'https://images.unsplash.com/photo-1604245196538-2c5b1c5c5c5c?w=800&q=80',
  hair3: 'https://images.unsplash.com/photo-1617059063697-7b1e4f2f2f2f?w=800&q=80',
  scrunchie: 'https://images.unsplash.com/photo-1638202993928-4267b40b9b1b?w=800&q=80',
};

interface MockProduct {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice?: number;
  sku?: string;
  isFeatured?: boolean;
  status?: string;
  weightGrams?: number;
  images: string[];
  variants?: Array<{ size?: string; color?: string; style?: string; sku?: string; priceDelta?: number; stock: number }>;
}

interface MockCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  products: MockProduct[];
}

const categories: MockCategory[] = [
  {
    name: 'Outfits',
    slug: 'outfits',
    description: 'Premium activewear designed for Pilates, yoga, and barre — move with confidence.',
    imageUrl: IMG.activewear1,
    sortOrder: 1,
    products: [
      {
        name: 'AURA Signature Leggings',
        slug: 'aura-signature-leggings',
        description: 'High-waisted sculpt leggings with a second-skin feel. Four-way stretch, moisture-wicking, and squat-proof. Designed for Pilates and barre with a flattering compression fit that moves with you.',
        basePrice: 2500,
        salePrice: 1999,
        sku: 'OUT-LGG-001',
        isFeatured: true,
        weightGrams: 280,
        images: [IMG.leggings, IMG.activewear1, IMG.activewear2],
        variants: [
          { size: 'XS', color: 'Black', sku: 'OUT-LGG-001-XS-BLK', stock: 15 },
          { size: 'S', color: 'Black', sku: 'OUT-LGG-001-S-BLK', stock: 20 },
          { size: 'M', color: 'Black', sku: 'OUT-LGG-001-M-BLK', stock: 18 },
          { size: 'L', color: 'Black', sku: 'OUT-LGG-001-L-BLK', stock: 10 },
          { size: 'XL', color: 'Black', sku: 'OUT-LGG-001-XL-BLK', stock: 5 },
          { size: 'S', color: 'Clay', sku: 'OUT-LGG-001-S-CLY', stock: 8 },
          { size: 'M', color: 'Clay', sku: 'OUT-LGG-001-M-CLY', stock: 8 },
        ],
      },
      {
        name: 'AURA Studio Crop Top',
        slug: 'aura-studio-crop-top',
        description: 'Lightweight, breathable crop top with built-in support. Seamless design that pairs perfectly with AURA leggings. Ideal for low-impact studio sessions.',
        basePrice: 1800,
        sku: 'OUT-TOP-002',
        isFeatured: true,
        weightGrams: 180,
        images: [IMG.top, IMG.activewear3],
        variants: [
          { size: 'XS', color: 'Black', sku: 'OUT-TOP-002-XS-BLK', stock: 12 },
          { size: 'S', color: 'Black', sku: 'OUT-TOP-002-S-BLK', stock: 15 },
          { size: 'M', color: 'Black', sku: 'OUT-TOP-002-M-BLK', stock: 15 },
          { size: 'L', color: 'Black', sku: 'OUT-TOP-002-L-BLK', stock: 8 },
          { size: 'S', color: 'Ivory', sku: 'OUT-TOP-002-S-IVY', stock: 6 },
          { size: 'M', color: 'Ivory', sku: 'OUT-TOP-002-M-IVY', stock: 6 },
        ],
      },
      {
        name: 'AURA Flow Unitard',
        slug: 'aura-flow-unitard',
        description: 'One-piece studio unitard with a sleek, sculpted silhouette. Built-in bra support and a high-cut leg for maximum freedom of movement. A studio favorite.',
        basePrice: 3200,
        sku: 'OUT-UNI-003',
        weightGrams: 350,
        images: [IMG.activewear2, IMG.activewear1],
        variants: [
          { size: 'XS', color: 'Black', sku: 'OUT-UNI-003-XS-BLK', stock: 5 },
          { size: 'S', color: 'Black', sku: 'OUT-UNI-003-S-BLK', stock: 8 },
          { size: 'M', color: 'Black', sku: 'OUT-UNI-003-M-BLK', stock: 8 },
          { size: 'L', color: 'Black', sku: 'OUT-UNI-003-L-BLK', stock: 4 },
        ],
      },
      {
        name: 'AURA Relaxed Tee',
        slug: 'aura-relaxed-tee',
        description: 'Oversized, relaxed-fit tee in soft organic cotton. Perfect for warm-ups, cool-downs, or post-studio coffee runs. Unisex sizing.',
        basePrice: 1500,
        salePrice: 1199,
        sku: 'OUT-TEE-004',
        weightGrams: 220,
        images: [IMG.activewear3, IMG.top],
        variants: [
          { size: 'S', color: 'Sand', sku: 'OUT-TEE-004-S-SND', stock: 20 },
          { size: 'M', color: 'Sand', sku: 'OUT-TEE-004-M-SND', stock: 20 },
          { size: 'L', color: 'Sand', sku: 'OUT-TEE-004-L-SND', stock: 15 },
          { size: 'XL', color: 'Sand', sku: 'OUT-TEE-004-XL-SND', stock: 10 },
          { size: 'S', color: 'Charcoal', sku: 'OUT-TEE-004-S-CHC', stock: 12 },
          { size: 'M', color: 'Charcoal', sku: 'OUT-TEE-004-M-CHC', stock: 12 },
        ],
      },
    ],
  },
  {
    name: 'Cups',
    slug: 'cups',
    description: 'Stay hydrated in style — insulated bottles and ceramic mugs for studio and home.',
    imageUrl: IMG.cup1,
    sortOrder: 2,
    products: [
      {
        name: 'AURA Insulated Water Bottle — 750ml',
        slug: 'aura-insulated-water-bottle-750ml',
        description: 'Double-wall vacuum-insulated stainless steel bottle. Keeps drinks cold for 24 hours, hot for 12 hours. Leak-proof lid with a powder-coated matte finish that resists scratches and fingerprints.',
        basePrice: 1200,
        sku: 'CUP-BTL-001',
        isFeatured: true,
        weightGrams: 380,
        images: [IMG.bottle, IMG.cup1],
        variants: [
          { color: 'Matte Black', sku: 'CUP-BTL-001-BLK', stock: 25 },
          { color: 'Sand', sku: 'CUP-BTL-001-SND', stock: 18 },
          { color: 'Clay', sku: 'CUP-BTL-001-CLY', stock: 12 },
        ],
      },
      {
        name: 'AURA Ceramic Studio Mug',
        slug: 'aura-ceramic-studio-mug',
        description: 'Handcrafted 350ml ceramic mug with a comfortable grip and a warm earthy glaze. Microwave and dishwasher safe. Each mug has subtle variations that make it uniquely yours.',
        basePrice: 650,
        salePrice: 499,
        sku: 'CUP-MUG-002',
        weightGrams: 420,
        images: [IMG.cup2, IMG.cup3],
        variants: [
          { color: 'Cream', sku: 'CUP-MUG-002-CRM', stock: 30 },
          { color: 'Umber', sku: 'CUP-MUG-002-UMB', stock: 22 },
          { color: 'Clay', sku: 'CUP-MUG-002-CLY', stock: 15 },
        ],
      },
      {
        name: 'AURA Travel Tumbler — 500ml',
        slug: 'aura-travel-tumbler-500ml',
        description: 'Sleek insulated travel tumbler with a spill-resistant flip lid. Fits most car cup holders. Perfect for your morning coffee on the way to the studio.',
        basePrice: 900,
        sku: 'CUP-TMB-003',
        weightGrams: 300,
        images: [IMG.cup3, IMG.cup1],
        variants: [
          { color: 'Matte Black', sku: 'CUP-TMB-003-BLK', stock: 20 },
          { color: 'Ivory', sku: 'CUP-TMB-003-IVY', stock: 15 },
        ],
      },
    ],
  },
  {
    name: 'Bags',
    slug: 'bags',
    description: 'Carry your essentials in style — studio totes and duffels designed for your practice.',
    imageUrl: IMG.bag1,
    sortOrder: 3,
    products: [
      {
        name: 'AURA Studio Duffel Bag',
        slug: 'aura-studio-duffel-bag',
        description: 'Spacious duffel with a dedicated mat strap, shoe compartment, and water bottle pocket. Water-resistant exterior with a wipeable lining. Carries everything you need for a full studio session.',
        basePrice: 2200,
        sku: 'BAG-DUF-001',
        isFeatured: true,
        weightGrams: 650,
        images: [IMG.bag1, IMG.bag2],
        variants: [
          { color: 'Charcoal', sku: 'BAG-DUF-001-CHC', stock: 15 },
          { color: 'Sand', sku: 'BAG-DUF-001-SND', stock: 12 },
          { color: 'Olive', sku: 'BAG-DUF-001-OLV', stock: 8 },
        ],
      },
      {
        name: 'AURA Canvas Tote',
        slug: 'aura-canvas-tote',
        description: 'Minimalist organic cotton canvas tote with reinforced straps and an interior zip pocket. Perfect for everyday use — fits a mat, towel, and your daily essentials.',
        basePrice: 800,
        salePrice: 649,
        sku: 'BAG-TOT-002',
        weightGrams: 350,
        images: [IMG.tote, IMG.bag3],
        variants: [
          { color: 'Natural', sku: 'BAG-TOT-002-NAT', stock: 40 },
          { color: 'Black', sku: 'BAG-TOT-002-BLK', stock: 30 },
        ],
      },
      {
        name: 'AURA Mini Crossbody',
        slug: 'aura-mini-crossbody',
        description: 'Compact crossbody bag for post-studio errands. Just enough room for your phone, cards, keys, and lip balm. Adjustable strap with a magnetic closure.',
        basePrice: 1100,
        sku: 'BAG-CRS-003',
        weightGrams: 250,
        images: [IMG.bag3, IMG.bag2],
        variants: [
          { color: 'Clay', sku: 'BAG-CRS-003-CLY', stock: 18 },
          { color: 'Black', sku: 'BAG-CRS-003-BLK', stock: 20 },
        ],
      },
    ],
  },
  {
    name: 'Grip Socks',
    slug: 'grip-socks',
    description: 'Non-slip grip socks for safe, confident movement on the reformer and mat.',
    imageUrl: IMG.socks1,
    sortOrder: 4,
    products: [
      {
        name: 'AURA Pilates Grip Socks — Full Toe',
        slug: 'aura-pilates-grip-socks-full-toe',
        description: 'Full-toe grip socks with silicone grips on the sole for maximum traction on the reformer and mat. Breathable cotton blend with arch support. One size fits most.',
        basePrice: 450,
        sku: 'SOC-GRP-001',
        isFeatured: true,
        weightGrams: 60,
        images: [IMG.socks1, IMG.socks2],
        variants: [
          { size: 'S/M', color: 'Black', sku: 'SOC-GRP-001-SM-BLK', stock: 50 },
          { size: 'S/M', color: 'Cream', sku: 'SOC-GRP-001-SM-CRM', stock: 40 },
          { size: 'S/M', color: 'Clay', sku: 'SOC-GRP-001-SM-CLY', stock: 30 },
          { size: 'L/XL', color: 'Black', sku: 'SOC-GRP-001-LX-BLK', stock: 35 },
          { size: 'L/XL', color: 'Cream', sku: 'SOC-GRP-001-LX-CRM', stock: 25 },
        ],
      },
      {
        name: 'AURA Barre Grip Socks — Open Toe',
        slug: 'aura-barre-grip-socks-open-toe',
        description: 'Open-toe design for barre and dance. Grips on the ball of the foot and heel for pivoting movements. Lightweight and breathable with a snug, second-skin fit.',
        basePrice: 400,
        sku: 'SOC-GRP-002',
        weightGrams: 50,
        images: [IMG.socks2, IMG.socks3],
        variants: [
          { size: 'S/M', color: 'Black', sku: 'SOC-GRP-002-SM-BLK', stock: 45 },
          { size: 'S/M', color: 'Sand', sku: 'SOC-GRP-002-SM-SND', stock: 35 },
          { size: 'L/XL', color: 'Black', sku: 'SOC-GRP-002-LX-BLK', stock: 30 },
        ],
      },
      {
        name: 'AURA Cozy Studio Socks',
        slug: 'aura-cozy-studio-socks',
        description: 'Plush, cozy socks for pre- and post-class warmth. Soft fleece interior with light grips on the sole. Not intended for active practice — perfect for relaxation and meditation.',
        basePrice: 350,
        salePrice: 279,
        sku: 'SOC-COZ-003',
        weightGrams: 80,
        images: [IMG.socks3, IMG.socks1],
        variants: [
          { size: 'One Size', color: 'Cream', sku: 'SOC-COZ-003-OS-CRM', stock: 60 },
          { size: 'One Size', color: 'Charcoal', sku: 'SOC-COZ-003-OS-CHC', stock: 50 },
        ],
      },
    ],
  },
  {
    name: 'Hair Accessories',
    slug: 'hair-accessories',
    description: 'Keep your hair in place — scrunchies, headbands, and clips for your practice.',
    imageUrl: IMG.hair1,
    sortOrder: 5,
    products: [
      {
        name: 'AURA Silk Scrunchie Set — 3 Pack',
        slug: 'aura-silk-scrunchie-set-3-pack',
        description: 'Set of 3 mulberry silk scrunchies in earthy AURA tones. Gentle on hair, prevents creasing, and adds a touch of elegance. Includes Sand, Clay, and Charcoal.',
        basePrice: 550,
        sku: 'HIR-SCR-001',
        isFeatured: true,
        weightGrams: 30,
        images: [IMG.scrunchie, IMG.hair1],
        variants: [
          { style: 'Earth Tones', sku: 'HIR-SCR-001-ETH', stock: 40 },
          { style: 'Neutrals', sku: 'HIR-SCR-001-NTR', stock: 35 },
        ],
      },
      {
        name: 'AURA Wide Headband',
        slug: 'aura-wide-headband',
        description: 'Wide, moisture-wicking headband that stays put through every movement. Soft stretch fabric that absorbs sweat and keeps flyaways controlled. Reversible design.',
        basePrice: 380,
        sku: 'HIR-HDB-002',
        weightGrams: 40,
        images: [IMG.hair1, IMG.hair2],
        variants: [
          { color: 'Black', sku: 'HIR-HDB-002-BLK', stock: 30 },
          { color: 'Sand', sku: 'HIR-HDB-002-SND', stock: 25 },
          { color: 'Clay', sku: 'HIR-HDB-002-CLY', stock: 20 },
        ],
      },
      {
        name: 'AURA Matte Hair Clips — 2 Pack',
        slug: 'aura-matte-hair-clips-2-pack',
        description: 'Set of 2 oversized matte-finish hair clips with a strong, non-slip grip. Holds thick hair securely during inversions and reformer work. Durable spring mechanism.',
        basePrice: 320,
        salePrice: 249,
        sku: 'HIR-CLP-003',
        weightGrams: 35,
        images: [IMG.hair2, IMG.hair3],
        variants: [
          { color: 'Tortoise', sku: 'HIR-CLP-003-TRT', stock: 45 },
          { color: 'Matte Black', sku: 'HIR-CLP-003-BLK', stock: 40 },
          { color: 'Cream', sku: 'HIR-CLP-003-CRM', stock: 30 },
        ],
      },
      {
        name: 'AURA Spiral Hair Ties — 6 Pack',
        slug: 'aura-spiral-hair-ties-6-pack',
        description: 'Spiral hair ties that prevent creasing, pulling, and breakage. Clear, discreet, and waterproof. Includes 6 ties in a reusable pouch.',
        basePrice: 250,
        sku: 'HIR-TIE-004',
        weightGrams: 20,
        images: [IMG.hair3, IMG.scrunchie],
        variants: [
          { color: 'Clear', sku: 'HIR-TIE-004-CLR', stock: 80 },
          { color: 'Assorted', sku: 'HIR-TIE-004-AST', stock: 60 },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seeding AURA Shop mock data...\n');

  // Clear existing shop data (safe — shop tables are separate from booking/payment)
  console.log('Clearing existing shop data...');
  await prisma.shopOrderStatusHistory.deleteMany();
  await prisma.shopOrderItem.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();

  let totalProducts = 0;
  let totalVariants = 0;
  let totalImages = 0;

  for (const cat of categories) {
    console.log(`  Creating category: ${cat.name} (${cat.products.length} products)`);

    const category = await prisma.productCategory.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });

    for (const p of cat.products) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          categoryId: category.id,
          basePrice: p.basePrice,
          salePrice: p.salePrice || null,
          sku: p.sku || null,
          status: p.status || 'ACTIVE',
          isFeatured: p.isFeatured || false,
          weightGrams: p.weightGrams || null,
        },
      });
      totalProducts++;

      // Add images
      for (let i = 0; i < p.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: p.images[i],
            altText: p.name,
            sortOrder: i,
          },
        });
        totalImages++;
      }

      // Add variants
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              size: v.size || null,
              color: v.color || null,
              style: v.style || null,
              sku: v.sku || null,
              priceDelta: v.priceDelta || 0,
              stock: v.stock,
              isActive: true,
            },
          });
          totalVariants++;
        }
      } else {
        // No variants — add a default variant with stock
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            stock: 50,
            isActive: true,
          },
        });
        totalVariants++;
      }
    }
  }

  console.log(`\nShop seed complete!`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products:   ${totalProducts}`);
  console.log(`  Variants:   ${totalVariants}`);
  console.log(`  Images:     ${totalImages}`);
  console.log(`\nVisit /shop to see the storefront.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
