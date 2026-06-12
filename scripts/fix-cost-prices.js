/**
 * Audit + backfill costPrice on ALL products in Atlas.
 * Products with costPrice=0 or missing get 55% of their sale price as cost.
 * Also backfills lineCost on existing order items.
 *
 * node scripts/fix-cost-prices.js   (reads MONGODB_URI from .env automatically)
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
  { name: String, price: Number, costPrice: { type: Number, default: 0 } },
  { strict: false, collection: 'products' },
);

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        unitPrice: Number,
        unitCost: { type: Number, default: 0 },
        lineTotal: Number,
        lineCost: { type: Number, default: 0 },
      },
    ],
  },
  { strict: false, collection: 'orders' },
);

const Product = mongoose.models.FixProduct || mongoose.model('FixProduct', productSchema);
const Order   = mongoose.models.FixOrder   || mongoose.model('FixOrder', orderSchema);

// Seed ürünleri için bilinen maliyetler — diğerleri fiyatın %55'i
const KNOWN_COSTS = {
  "Classic Men's T-Shirt":  12.50,
  'Summer Floral Dress':    28.00,
  'Urban Stylish Sneakers': 45.00,
  'Premium Leather Watch':  58.00,
  "Women's Leather Handbag":72.00,
  'Casual Unisex Hoodie':   30.00,
};

async function main() {
  console.log('→ Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('✓ Connected\n');

  // ── Audit önce ────────────────────────────────────────────────────────────
  const products = await Product.find({}).lean();
  const total    = products.length;
  const missing  = products.filter(p => (p.costPrice ?? 0) === 0).length;
  console.log(`Products in DB  : ${total}`);
  console.log(`costPrice = 0   : ${missing}`);
  console.log(`Already set     : ${total - missing}\n`);

  // ── Step 1: Tüm ürünlere costPrice yaz ───────────────────────────────────
  console.log('Step 1 — Backfilling product costPrice...');
  let productUpdates = 0;

  for (const product of products) {
    const currentCost = product.costPrice ?? 0;
    const newCost =
      KNOWN_COSTS[product.name] ??
      Math.round((product.price ?? 0) * 0.55 * 100) / 100;

    if (currentCost !== newCost) {
      await Product.updateOne({ _id: product._id }, { $set: { costPrice: newCost } });
      console.log(`  · ${product.name}  $${product.price} → cost $${newCost}`);
      productUpdates++;
    }
  }
  console.log(`  ✓ ${productUpdates} product(s) updated\n`);

  // ── Step 2: Sipariş lineCost backfill ────────────────────────────────────
  const updatedProducts = await Product.find({}).lean();
  const costById   = new Map(updatedProducts.map(p => [String(p._id), p.costPrice ?? 0]));
  const costByName = new Map(updatedProducts.map(p => [p.name, p.costPrice ?? 0]));

  console.log('Step 2 — Backfilling order item lineCost / unitCost...');
  const orders = await Order.find({}).lean();
  let orderUpdates = 0, itemUpdates = 0;

  for (const order of orders) {
    let changed = false;
    const newItems = order.items.map(item => {
      if ((item.lineCost ?? 0) !== 0) return item;        // zaten dolu, atla
      const unitCost =
        costById.get(item.productId) ??
        costByName.get(item.productName) ??
        Math.round((item.unitPrice ?? 0) * 0.55 * 100) / 100;
      const lineCost = Math.round(unitCost * item.quantity * 100) / 100;
      itemUpdates++;
      changed = true;
      return { ...item, unitCost, lineCost };
    });

    if (changed) {
      await Order.updateOne({ _id: order._id }, { $set: { items: newItems } });
      orderUpdates++;
      console.log(`  · order ${order._id} — items backfilled`);
    }
  }
  console.log(`  ✓ ${orderUpdates} order(s) updated, ${itemUpdates} item(s) backfilled\n`);

  console.log('════════════════════════════════════════');
  console.log('✓ Done! Sales Reports cost bars artık dolu.');
  console.log('════════════════════════════════════════');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('\n✗ Failed:', err.message);
  process.exit(1);
});
