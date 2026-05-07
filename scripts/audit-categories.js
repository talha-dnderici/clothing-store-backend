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
  console.error('MONGODB_URI is missing. Add it to .env or export it in your shell.');
  process.exit(1);
}

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '', trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    parentCategoryId: { type: String, trim: true, default: null },
  },
  { timestamps: true, collection: 'categories' },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    categoryIds: { type: [String], required: true, default: [] },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true, collection: 'products', strict: false },
);

const Category = mongoose.models.AuditCategory || mongoose.model('AuditCategory', categorySchema);
const Product = mongoose.models.AuditProduct || mongoose.model('AuditProduct', productSchema);

const FIX = process.argv.includes('--fix');
const FIX_ALL = process.argv.includes('--fix-all');
const VERBOSE = process.argv.includes('--verbose');

// Ürün ismi cinsiyet ipucu vermiyor ama görsele/karara göre yeniden atanması
// gerekenlerin manuel listesi. Ege'nin kararı: ikisi de Unisex.
// Match exact (case-insensitive). Eklemek istersen "namePattern" satırı kopyala.
// İsim cinsiyet ipucu vermeyen ürünler için manuel atama listesi.
// Audit raporunu çalıştırıp "noGender" çıktısına bak, görsele göre karar ver,
// buraya ekle, --fix-all ile uygula. Sprint 5 demo için doldurulup boşaltıldı.
//
// Örnek satır:
//   { namePattern: /^example product name$/i, addCategory: 'Unisex', removeCategories: ['Men', 'Women'] },
const MANUAL_REASSIGNMENTS = [];

function genderHintFromName(name) {
  const lower = name.toLowerCase();
  if (/\b(men's|mens|men|male)\b/.test(lower)) return 'Men';
  if (/\b(women's|womens|women|female|ladies)\b/.test(lower)) return 'Women';
  return null;
}

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const categories = await Category.find().lean().exec();
  const catById = new Map(categories.map((c) => [c._id.toString(), c]));
  const catByName = new Map(categories.map((c) => [c.name, c._id.toString()]));

  console.log('=== Categories ===');
  for (const c of categories) {
    console.log(`  ${c._id}  ${c.name.padEnd(15)} slug=${c.slug ?? '-'}`);
  }

  const products = await Product.find().lean().exec();
  console.log(`\n=== Products (${products.length}) ===\n`);

  const menId = catByName.get('Men');
  const womenId = catByName.get('Women');
  const unisexId = catByName.get('Unisex');

  const issues = {
    nameVsCategoryMismatch: [],
    bothGenders: [],
    noGender: [],
    duplicateNames: [],
    emptyCategories: [],
    multiGender: [], // Ürün hem (Men or Women) hem Unisex — Unisex'i kaldırmamız gerek
  };

  const byName = new Map();
  for (const p of products) {
    const list = byName.get(p.name) ?? [];
    list.push(p);
    byName.set(p.name, list);
  }
  for (const [name, list] of byName) {
    if (list.length > 1) {
      issues.duplicateNames.push({ name, count: list.length, ids: list.map((p) => p._id.toString()) });
    }
  }

  for (const p of products) {
    const ids = (p.categoryIds ?? []).map(String);
    const names = ids.map((id) => catById.get(id)?.name ?? `?(${id})`);

    const hasMen = ids.includes(menId);
    const hasWomen = ids.includes(womenId);
    const hasUnisex = ids.includes(unisexId);

    if (ids.length === 0) {
      issues.emptyCategories.push({ id: p._id.toString(), name: p.name });
    }

    if (hasMen && hasWomen) {
      issues.bothGenders.push({ id: p._id.toString(), name: p.name, categories: names });
    }

    if (hasUnisex && (hasMen || hasWomen)) {
      issues.multiGender.push({ id: p._id.toString(), name: p.name, categories: names });
    }

    if (!hasMen && !hasWomen && !hasUnisex && ids.length > 0) {
      issues.noGender.push({ id: p._id.toString(), name: p.name, categories: names });
    }

    const hint = genderHintFromName(p.name);
    if (hint === 'Men' && hasWomen && !hasMen) {
      issues.nameVsCategoryMismatch.push({
        id: p._id.toString(),
        name: p.name,
        currentCategories: names,
        nameHints: 'Men',
        suggested: { add: menId, remove: womenId },
      });
    } else if (hint === 'Women' && hasMen && !hasWomen) {
      issues.nameVsCategoryMismatch.push({
        id: p._id.toString(),
        name: p.name,
        currentCategories: names,
        nameHints: 'Women',
        suggested: { add: womenId, remove: menId },
      });
    }

    if (VERBOSE) {
      const tag = (hasMen ? 'M' : '-') + (hasWomen ? 'W' : '-') + (hasUnisex ? 'U' : '-');
      console.log(`  [${tag}] ${p.name.padEnd(35)} -> ${names.join(', ')}`);
    }
  }

  console.log('\n=== ISSUES ===\n');

  console.log(`Duplicate product names (${issues.duplicateNames.length}):`);
  for (const d of issues.duplicateNames) {
    console.log(`  "${d.name}" appears ${d.count}x  ids=${d.ids.join(', ')}`);
  }

  console.log(`\nIn BOTH Men and Women (${issues.bothGenders.length}):`);
  for (const p of issues.bothGenders) {
    console.log(`  ${p.id}  "${p.name}"  cats=[${p.categories.join(', ')}]`);
  }

  console.log(`\nIn Unisex AND a specific gender (${issues.multiGender.length}, will drop Unisex on --fix-all):`);
  for (const p of issues.multiGender) {
    console.log(`  ${p.id}  "${p.name}"  cats=[${p.categories.join(', ')}]`);
  }

  console.log(`\nName/category gender mismatch (${issues.nameVsCategoryMismatch.length}):`);
  for (const p of issues.nameVsCategoryMismatch) {
    console.log(`  ${p.id}  "${p.name}"  hint=${p.nameHints}  current=[${p.currentCategories.join(', ')}]`);
  }

  console.log(`\nNo gender category at all (${issues.noGender.length}):`);
  for (const p of issues.noGender) {
    console.log(`  ${p.id}  "${p.name}"  cats=[${p.categories.join(', ')}]`);
  }

  console.log(`\nNo categories at all (${issues.emptyCategories.length}):`);
  for (const p of issues.emptyCategories) {
    console.log(`  ${p.id}  "${p.name}"`);
  }

  // === Manual reassignments preview (Ege'nin verdiği listeden) ===
  const manualMatches = [];
  for (const rule of MANUAL_REASSIGNMENTS) {
    const targetId = catByName.get(rule.addCategory);
    if (!targetId) continue;
    const removeIds = (rule.removeCategories ?? [])
      .map((n) => catByName.get(n))
      .filter(Boolean);
    for (const p of products) {
      if (rule.namePattern.test(p.name)) {
        manualMatches.push({
          id: p._id.toString(),
          name: p.name,
          currentCategoryIds: (p.categoryIds ?? []).map(String),
          addId: targetId,
          removeIds,
          addName: rule.addCategory,
        });
      }
    }
  }

  console.log(`\nManual reassignments queued (${manualMatches.length}):`);
  for (const m of manualMatches) {
    const currentNames = m.currentCategoryIds.map((id) => catById.get(id)?.name ?? id);
    console.log(`  ${m.id}  "${m.name}"  current=[${currentNames.join(', ')}]  -> add ${m.addName}, remove ${m.removeIds.map((id) => catById.get(id)?.name).join('/')}`);
  }

  // === Duplicate handling preview (eski tarihli olan silinir) ===
  const duplicatesToDelete = [];
  for (const d of issues.duplicateNames) {
    const list = byName.get(d.name);
    // createdAt küçük olan = eski. Eski olan(lar) silinir, en yenisi kalır.
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return ta - tb;
    });
    const keep = sorted[sorted.length - 1];
    for (const p of sorted.slice(0, -1)) {
      duplicatesToDelete.push({
        id: p._id.toString(),
        name: p.name,
        createdAt: p.createdAt,
        keepingId: keep._id.toString(),
        keepingCreatedAt: keep.createdAt,
      });
    }
  }

  console.log(`\nDuplicates to delete (oldest createdAt loses, ${duplicatesToDelete.length}):`);
  for (const d of duplicatesToDelete) {
    console.log(`  delete ${d.id}  "${d.name}"  (${d.createdAt})  keeping ${d.keepingId} (${d.keepingCreatedAt})`);
  }

  if (!FIX && !FIX_ALL) {
    console.log('\nDry run. Flags:');
    console.log('  --fix       only name/gender mismatch corrections');
    console.log('  --fix-all   name/gender + manual reassignments + delete oldest duplicate');
    await mongoose.disconnect();
    return;
  }

  console.log('\n=== Applying name/gender mismatch fixes ===');
  let fixed = 0;
  for (const p of issues.nameVsCategoryMismatch) {
    const product = await Product.findById(p.id).exec();
    if (!product) continue;
    const next = new Set((product.categoryIds ?? []).map(String));
    next.delete(p.suggested.remove);
    next.add(p.suggested.add);
    product.categoryIds = [...next];
    await product.save();
    console.log(`  fixed: "${product.name}"  -> ${[...next].map((id) => catById.get(id)?.name ?? id).join(', ')}`);
    fixed++;
  }
  console.log(`Applied ${fixed} name/gender mismatch fixes.`);

  if (FIX_ALL) {
    console.log('\n=== Applying manual reassignments ===');
    let manualFixed = 0;
    for (const m of manualMatches) {
      const product = await Product.findById(m.id).exec();
      if (!product) continue;
      const next = new Set((product.categoryIds ?? []).map(String));
      for (const removeId of m.removeIds) next.delete(removeId);
      next.add(m.addId);
      product.categoryIds = [...next];
      await product.save();
      console.log(`  reassigned: "${product.name}"  -> [${[...next].map((id) => catById.get(id)?.name ?? id).join(', ')}]`);
      manualFixed++;
    }
    console.log(`Applied ${manualFixed} manual reassignments.`);

    console.log('\n=== Stripping Unisex from products that also have Men/Women ===');
    let stripped = 0;
    for (const p of issues.multiGender) {
      const product = await Product.findById(p.id).exec();
      if (!product) continue;
      const next = (product.categoryIds ?? []).map(String).filter((id) => id !== unisexId);
      product.categoryIds = next;
      await product.save();
      const newNames = next.map((id) => catById.get(id)?.name ?? id);
      console.log(`  stripped: "${product.name}"  -> [${newNames.join(', ')}]`);
      stripped++;
    }
    console.log(`Stripped Unisex from ${stripped} product(s).`);

    console.log('\n=== Deleting older duplicates ===');
    let deleted = 0;
    for (const d of duplicatesToDelete) {
      const res = await Product.deleteOne({ _id: d.id });
      if (res.deletedCount > 0) {
        console.log(`  deleted: ${d.id}  "${d.name}"  (kept ${d.keepingId})`);
        deleted++;
      }
    }
    console.log(`Deleted ${deleted} duplicate(s).`);
  } else {
    console.log('\nManual reassignments and duplicate deletions skipped (--fix only). Use --fix-all to apply them.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
