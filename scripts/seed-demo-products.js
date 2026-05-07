/**
 * Prep the catalog for the Cuma progress demo:
 *   1. Picks dedicated demo products and sets:
 *      - Product A → stock = 0 (out of stock; "Add to Cart" must be disabled)
 *      - Product B → stock = 1 (only one left)
 *      - Product C → keeps its stock but gets a unique description keyword so
 *        step 3.6 (search by description) lands on it deterministically
 *   2. Replaces every product's short description with a richer category-aware
 *      paragraph so search-by-description has meaningful hits across the catalog
 *
 * Run:
 *   node scripts/seed-demo-products.js
 *
 * Safe to run multiple times — it always sets the same final state.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sep = trimmed.indexOf('=');
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is missing. Add it to .env first.');
  process.exit(1);
}

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    categoryIds: [String],
    price: Number,
    stock: Number,
    popularity: Number,
    imageUrl: String,
  },
  { strict: false, collection: 'products' },
);
const categorySchema = new mongoose.Schema(
  { name: String, slug: String },
  { strict: false, collection: 'categories' },
);

const Product = mongoose.models.DemoProduct || mongoose.model('DemoProduct', productSchema);
const Category = mongoose.models.DemoCategory || mongoose.model('DemoCategory', categorySchema);

// Specific demo products. Names match what's already seeded in the catalog.
const DEMO_OUT_OF_STOCK_NAME = 'Black Skinny Jeans';
const DEMO_LOW_STOCK_NAME = 'Pullover Hoodie';
const DEMO_DESCRIPTION_HOOK_NAME = 'Striped Polo T-Shirt';
const DEMO_DESCRIPTION_HOOK_KEYWORD = 'vintage retro nautical';

// Category-aware long-form descriptions. Each one is rich enough that
// q=fabric, q=cotton, q=denim, q=leather, etc. all hit something useful.
const CATEGORY_DESCRIPTIONS = {
  'T-Shirts':
    'Soft, breathable cotton blend t-shirt with a relaxed fit and a clean ribbed crew neck. Pre-washed for shape retention and a buttery hand-feel. Versatile layering essential — pair with denim for weekends or under a blazer for smart-casual nights. Reinforced shoulder seams keep it looking sharp wash after wash.',
  Hoodies:
    'Cozy fleece-lined hoodie cut from a heavyweight cotton-poly blend. Adjustable drawstring hood, generous front kangaroo pocket, and ribbed cuffs trap warmth without feeling bulky. A timeless piece that takes you from morning coffee runs to autumn city walks.',
  Jeans:
    'Premium denim jeans with the perfect amount of stretch for all-day comfort. Five-pocket construction, branded leather patch, and a versatile mid-rise silhouette. Cut from sustainably sourced cotton for durability that improves with every wash.',
  Skirts:
    'Elegant skirt with a flattering A-line silhouette and a hidden side zip. Lightly lined for shape and comfort. Pairs effortlessly with knit tops in winter and crisp shirts in summer — a true seasonless wardrobe staple.',
  Jackets:
    'Statement outerwear with a weather-resistant finish and a quilted lining for insulation without bulk. Engineered for everyday transitions: light enough for spring rain, layered enough for autumn chill. Storm flap, two-way zip, and reinforced shoulder seams.',
  Shoes:
    'Cushioned insole, padded collar, and durable rubber outsole engineered for long-day comfort. Premium leather upper develops a beautiful patina over time. A go-to silhouette that elevates jeans, chinos, and tailored trousers alike.',
  Accessories:
    'Refined accessory crafted from premium full-grain leather and finished with subtle hardware. The kind of finishing touch that quietly upgrades any outfit, every season. Made to last with proper care.',
};

function pickCategoryName(categoryIds, categoryById) {
  for (const id of categoryIds || []) {
    const cat = categoryById.get(String(id));
    if (cat && CATEGORY_DESCRIPTIONS[cat.name]) return cat.name;
  }
  return null;
}

async function main() {
  console.log('→ Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✓ Connected');

  const categories = await Category.find({}).lean();
  const categoryById = new Map(categories.map((c) => [String(c._id), c]));

  const products = await Product.find({}).lean();
  console.log(`→ Found ${products.length} products in catalog\n`);

  let descUpdates = 0;
  let stockUpdates = 0;

  for (const product of products) {
    const updates = {};

    // 1) Refresh description with the category-aware long-form copy.
    const catName = pickCategoryName(product.categoryIds, categoryById);
    if (catName) {
      let newDesc = CATEGORY_DESCRIPTIONS[catName];

      // Special hook for the "search by description" demo step.
      if (product.name === DEMO_DESCRIPTION_HOOK_NAME) {
        newDesc = `${DEMO_DESCRIPTION_HOOK_KEYWORD} striped polo. ${newDesc}`;
      }

      if (product.description !== newDesc) {
        updates.description = newDesc;
        descUpdates += 1;
      }
    }

    // 2) Stock overrides for the demo flow.
    if (product.name === DEMO_OUT_OF_STOCK_NAME && product.stock !== 0) {
      updates.stock = 0;
      stockUpdates += 1;
    } else if (product.name === DEMO_LOW_STOCK_NAME && product.stock !== 1) {
      updates.stock = 1;
      stockUpdates += 1;
    }

    if (Object.keys(updates).length > 0) {
      await Product.updateOne({ _id: product._id }, { $set: updates });
      const tag = updates.stock !== undefined ? ` [stock=${updates.stock}]` : '';
      console.log(`  · ${product.name}${tag}`);
    }
  }

  console.log('\n────────────────────────────────────────');
  console.log(`✓ Descriptions refreshed:  ${descUpdates}`);
  console.log(`✓ Stock overrides applied: ${stockUpdates}`);
  console.log('────────────────────────────────────────');
  console.log('\nDemo product setup:');
  console.log(`  • Out of stock (Product A): "${DEMO_OUT_OF_STOCK_NAME}"`);
  console.log(`  • Only one in stock (Product B): "${DEMO_LOW_STOCK_NAME}"`);
  console.log(
    `  • Description hook (Product C): "${DEMO_DESCRIPTION_HOOK_NAME}"\n` +
      `      Search keyword to demo step 3.6: "${DEMO_DESCRIPTION_HOOK_KEYWORD.split(' ')[0]}"`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n✗ Demo seed failed:', err.message);
  process.exit(1);
});
