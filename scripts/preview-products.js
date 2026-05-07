// Generates an HTML grid of every product (image + name + current categories)
// so you can eyeball gender assignments visually. Sarı çerçeveli olanların
// hiç gender (Men/Women/Unisex) kategorisi yok.
//
// Usage:  node scripts/preview-products.js
// Output: ./preview-products.html  (then `open ./preview-products.html`)

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
  console.error('MONGODB_URI is missing. Add it to .env or export it.');
  process.exit(1);
}

const categorySchema = new mongoose.Schema(
  { name: String, slug: String },
  { collection: 'categories', strict: false },
);

const productSchema = new mongoose.Schema(
  { name: String, categoryIds: [String], imageUrl: String },
  { collection: 'products', strict: false },
);

const Category = mongoose.models.PreviewCategory || mongoose.model('PreviewCategory', categorySchema);
const Product = mongoose.models.PreviewProduct || mongoose.model('PreviewProduct', productSchema);

const GENDER_NAMES = ['Men', 'Women', 'Unisex'];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function main() {
  await mongoose.connect(mongoUri);
  const cats = await Category.find().lean().exec();
  const catById = new Map(cats.map((c) => [c._id.toString(), c.name]));

  const products = await Product.find().lean().exec();
  const rows = products
    .map((p) => {
      const ids = (p.categoryIds ?? []).map(String);
      const names = ids.map((id) => catById.get(id) ?? `?(${id})`);
      const gender = names.find((n) => GENDER_NAMES.includes(n)) ?? null;
      return {
        id: p._id.toString(),
        name: p.name ?? '(no name)',
        imageUrl: p.imageUrl ?? '',
        categories: names,
        gender,
      };
    })
    .sort((a, b) => {
      // Önce gender'ı olmayanlar (sarı çerçeveli), sonra alfabetik
      if (!a.gender && b.gender) return -1;
      if (a.gender && !b.gender) return 1;
      return a.name.localeCompare(b.name);
    });

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>AURA — Product gender preview</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #fafafa; color: #111; }
  header { background: #111; color: white; padding: 24px 40px; }
  header h1 { margin: 0 0 6px; font-size: 22px; }
  header p { margin: 0; opacity: 0.7; font-size: 14px; }
  .toolbar { padding: 16px 40px; background: white; border-bottom: 1px solid #eee; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .toolbar input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; min-width: 200px; }
  .toolbar button { padding: 8px 14px; border: 1px solid #ddd; background: white; border-radius: 8px; font-size: 13px; cursor: pointer; }
  .toolbar button.active { background: #111; color: white; border-color: #111; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 24px 40px; }
  .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06); border: 2px solid transparent; transition: transform .15s; }
  .card:hover { transform: translateY(-2px); }
  .card.no-gender { border-color: #f59e0b; }
  .card.gender-Men { border-color: #3b82f6; }
  .card.gender-Women { border-color: #ec4899; }
  .card.gender-Unisex { border-color: #10b981; }
  .img-wrap { width: 100%; height: 220px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
  .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .img-wrap.no-img { color: #9ca3af; font-size: 13px; }
  .body { padding: 14px; }
  .name { font-weight: 600; font-size: 14px; margin-bottom: 6px; line-height: 1.3; }
  .cats { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge.no-gender { background: #fef3c7; color: #92400e; }
  .badge.Men { background: #dbeafe; color: #1e40af; }
  .badge.Women { background: #fce7f3; color: #9d174d; }
  .badge.Unisex { background: #d1fae5; color: #065f46; }
  .id { font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: #9ca3af; margin-top: 6px; word-break: break-all; }
</style>
</head>
<body>
<header>
  <h1>AURA — Product gender preview</h1>
  <p>${products.length} ürün. Sarı çerçeveli olanların hiç gender (Men/Women/Unisex) kategorisi yok — onlara karar ver.</p>
</header>
<div class="toolbar">
  <input id="search" placeholder="İsimde ara..." oninput="filter()">
  <button data-filter="all" class="active" onclick="setFilter('all')">Hepsi</button>
  <button data-filter="no-gender" onclick="setFilter('no-gender')">Gender yok (sarı)</button>
  <button data-filter="Men" onclick="setFilter('Men')">Men</button>
  <button data-filter="Women" onclick="setFilter('Women')">Women</button>
  <button data-filter="Unisex" onclick="setFilter('Unisex')">Unisex</button>
</div>
<div class="grid" id="grid">
${rows
  .map(
    (r) => `
  <div class="card ${r.gender ? 'gender-' + r.gender : 'no-gender'}" data-name="${escapeHtml(r.name.toLowerCase())}" data-gender="${r.gender ?? 'no-gender'}">
    <div class="img-wrap${r.imageUrl ? '' : ' no-img'}">
      ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.name)}" onerror="this.parentElement.classList.add('no-img'); this.remove(); this.parentElement.textContent='no image';">` : 'no image'}
    </div>
    <div class="body">
      <div class="name">${escapeHtml(r.name)}</div>
      <div class="cats">${r.categories.map(escapeHtml).join(', ')}</div>
      <span class="badge ${r.gender ? r.gender : 'no-gender'}">${r.gender ?? 'no gender'}</span>
      <div class="id">${escapeHtml(r.id)}</div>
    </div>
  </div>
`,
  )
  .join('')}
</div>
<script>
let activeFilter = 'all';
function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll('.toolbar button').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  filter();
}
function filter() {
  const q = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const matchesName = !q || card.dataset.name.includes(q);
    const matchesFilter = activeFilter === 'all' || card.dataset.gender === activeFilter;
    card.style.display = matchesName && matchesFilter ? '' : 'none';
  });
}
</script>
</body>
</html>`;

  const out = path.resolve(__dirname, '..', 'preview-products.html');
  fs.writeFileSync(out, html);
  console.log(`Wrote ${out}`);
  console.log(`Open it:  open "${out}"`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
