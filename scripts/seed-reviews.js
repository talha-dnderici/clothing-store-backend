/**
 * Seed sample reviews + ratings for products by hitting the gateway API.
 *
 * Usage:
 *   GATEWAY_URL=http://localhost:3000 \
 *   SEED_EMAIL=customer@aura.test \
 *   SEED_PASSWORD=password123 \
 *   node scripts/seed-reviews.js
 *
 * Defaults match the local dev setup, so plain `node scripts/seed-reviews.js`
 * works as long as the gateway is running on localhost:3000.
 *
 * The script:
 *   1. Logs in as a seed customer to obtain a JWT.
 *   2. Fetches the full product catalog.
 *   3. For ~70% of products, posts 1-3 reviews each with a randomized rating
 *      (skewed toward 4-5 stars) and a comment from a curated phrase pool.
 *
 * Idempotency: running twice will create duplicate reviews. Run only when
 * you want to top-up the demo catalog. Comments still go through manager
 * approval before becoming publicly visible — only ratings show immediately.
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const SEED_EMAIL = process.env.SEED_EMAIL || 'customer@aura.test';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'password123';

// Probability that a given product receives any reviews at all.
const REVIEW_COVERAGE = 0.7;
// Range for how many reviews each "covered" product gets.
const MIN_REVIEWS_PER_PRODUCT = 1;
const MAX_REVIEWS_PER_PRODUCT = 3;

const COMMENT_POOL = [
  'Great quality, totally worth it!',
  'Fits perfectly, exactly as described.',
  'Beautiful design — loving it so far.',
  'Comfortable and stylish at the same time.',
  'Better than I expected for the price.',
  'Material feels premium, very pleased.',
  'Shipped fast and arrived in perfect condition.',
  'Got tons of compliments already.',
  'Holds up well after a few washes.',
  'Looks even better in person than in the photos.',
  'Will definitely order more colors.',
  'Solid construction, great stitching.',
  "Runs slightly small — size up if you're between sizes.",
  'Perfect for layering through the season.',
  'My new favorite piece in the closet.',
  'Color is exactly what I expected, very accurate.',
  'Super soft and lightweight.',
  'Five-star piece all around.',
  'Looks more expensive than it is.',
  'Comfortable enough to wear all day.',
  'Versatile — pairs with almost anything.',
  'Tailored fit, looks really clean.',
  'Could use a slightly thicker fabric, but still good.',
  'Packaging was great, very gift-ready.',
  'Bought one for myself and one for my partner!',
  'Subtle details make it feel premium.',
  'Quality is exactly what AURA promises.',
  'Shape held up beautifully after the first wash.',
  'Highly recommended to anyone on the fence.',
  'Will be wearing this on repeat.',
];

const RATING_DISTRIBUTION = [
  // value, weight
  [5, 60],
  [4, 28],
  [3, 8],
  [2, 3],
  [1, 1],
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(rows) {
  const total = rows.reduce((sum, [, w]) => sum + w, 0);
  let n = Math.random() * total;
  for (const [value, weight] of rows) {
    n -= weight;
    if (n <= 0) return value;
  }
  return rows[0][0];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function api(path, options = {}, token) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body.message ? body.message : `HTTP ${res.status}`;
    throw new Error(`${options.method || 'GET'} ${path} → ${msg}`);
  }
  return body;
}

async function main() {
  console.log(`→ Gateway:    ${GATEWAY_URL}`);
  console.log(`→ Seed user:  ${SEED_EMAIL}`);

  const loginRes = await api(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }) },
  );
  const token = loginRes.token;
  if (!token) {
    throw new Error('Login did not return a token. Aborting.');
  }
  console.log('✓ Logged in, JWT acquired.\n');

  const productsRes = await api('/products?limit=200');
  const items = Array.isArray(productsRes?.items)
    ? productsRes.items
    : Array.isArray(productsRes)
    ? productsRes
    : [];
  console.log(`✓ Fetched ${items.length} products from catalog.\n`);

  let totalSubmitted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const product of items) {
    const productId = product.id || product._id;
    if (!productId) continue;

    if (Math.random() > REVIEW_COVERAGE) {
      totalSkipped += 1;
      continue;
    }

    const reviewsForThisProduct = randInt(MIN_REVIEWS_PER_PRODUCT, MAX_REVIEWS_PER_PRODUCT);
    process.stdout.write(
      `· ${product.name?.padEnd(28) || productId.padEnd(28)}  → ${reviewsForThisProduct} review(s) `,
    );

    for (let i = 0; i < reviewsForThisProduct; i += 1) {
      const rating = pickWeighted(RATING_DISTRIBUTION);
      const content = pick(COMMENT_POOL);

      try {
        await api(
          `/products/${productId}/reviews`,
          { method: 'POST', body: JSON.stringify({ rating, content }) },
          token,
        );
        process.stdout.write(`★${rating} `);
        totalSubmitted += 1;
      } catch (err) {
        process.stdout.write(`✗ `);
        totalFailed += 1;
      }
    }
    process.stdout.write('\n');
  }

  console.log('\n────────────────────────────────────────');
  console.log(`✓ Submitted:   ${totalSubmitted}`);
  console.log(`· Skipped:     ${totalSkipped} product(s) (random coverage)`);
  console.log(`✗ Failed:      ${totalFailed}`);
  console.log('────────────────────────────────────────');
  console.log(
    '\nNote: comments require manager approval before they become public.\n' +
      'Sign in as a manager and visit the Playground to approve them.',
  );
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});
