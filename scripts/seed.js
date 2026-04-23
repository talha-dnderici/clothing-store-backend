const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is missing. Add it to .env or your shell environment.');
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
    model: { type: String, default: '', trim: true },
    serialNumber: { type: String, default: '', trim: true, unique: true, sparse: true },
    description: { type: String, required: true, trim: true },
    categoryIds: { type: [String], required: true, default: [] },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    warrantyStatus: { type: Boolean, default: false },
    distributor: { type: String, default: '', trim: true },
    discountRate: { type: Number, default: 0, min: 0, max: 100 },
    discountActive: { type: Boolean, default: false },
    popularity: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true, collection: 'products' },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    taxId: { type: String, default: '' },
    address: { type: String, default: '' },
    wishlistProductIds: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['customer', 'salesManager', 'productManager'],
      default: 'customer',
    },
  },
  { timestamps: true, collection: 'users' },
);

const Category = mongoose.models.SeedCategory || mongoose.model('SeedCategory', categorySchema);
const Product = mongoose.models.SeedProduct || mongoose.model('SeedProduct', productSchema);
const User = mongoose.models.SeedUser || mongoose.model('SeedUser', userSchema);

const categories = [
  {
    name: 'Men',
    slug: 'men',
    description: 'Menswear essentials and seasonal apparel.',
  },
  {
    name: 'Women',
    slug: 'women',
    description: 'Womenswear collection with dresses and statement pieces.',
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: 'Everyday sneakers, runners, and footwear staples.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Bags, scarves, watches, and finishing touches.',
  },
  {
    name: 'Unisex',
    slug: 'unisex',
    description: 'Shared wardrobe basics for every style.',
  },
];

const productSeeds = [
  {
    name: "Classic Men's T-Shirt",
    model: 'AURA-TSHIRT-01',
    serialNumber: 'SN-AURA-1001',
    description:
      'Premium quality men\'s t-shirt designed for comfort, breathability, and all-day wear.',
    categorySlug: 'men',
    price: 24.99,
    stock: 42,
    warrantyStatus: false,
    distributor: 'AURA Global Warehouses',
    discountRate: 0,
    popularity: 95,
    imageUrl:
      'https://images.unsplash.com/photo-1763609973511-77f5caecd0f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: 'Summer Floral Dress',
    model: 'AURA-DRESS-02',
    serialNumber: 'SN-AURA-1002',
    description: 'Lightweight floral dress with a relaxed fit and summer-ready silhouette.',
    categorySlug: 'women',
    price: 59.99,
    stock: 15,
    warrantyStatus: false,
    distributor: 'AURA Fashion Partners',
    discountRate: 10,
    discountActive: true,
    popularity: 98,
    imageUrl:
      'https://images.unsplash.com/photo-1602303894456-398ce544d90b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: 'Urban Stylish Sneakers',
    model: 'AURA-SNEAKER-03',
    serialNumber: 'SN-AURA-1003',
    description: 'Modern everyday sneakers with cushioned comfort and clean streetwear lines.',
    categorySlug: 'shoes',
    price: 89.99,
    stock: 12,
    warrantyStatus: false,
    distributor: 'Sneaks Global Dist.',
    discountRate: 5,
    discountActive: true,
    popularity: 89,
    imageUrl:
      'https://images.unsplash.com/photo-1695459468644-717c8ae17eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: 'Premium Leather Watch',
    model: 'AURA-WATCH-04',
    serialNumber: 'SN-AURA-1004',
    description: 'Elegant leather watch for daily wear with polished metal accents.',
    categorySlug: 'accessories',
    price: 129.99,
    stock: 20,
    warrantyStatus: true,
    distributor: 'AURA Global Warehouses',
    discountRate: 0,
    popularity: 84,
    imageUrl:
      'https://images.unsplash.com/photo-1765446904696-15840809580c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: "Women's Leather Handbag",
    model: 'AURA-BAG-06',
    serialNumber: 'SN-AURA-1006',
    description: 'Structured leather handbag with roomy interior and premium hardware.',
    categorySlug: 'accessories',
    price: 149.99,
    stock: 9,
    warrantyStatus: true,
    distributor: 'AURA Global Warehouses',
    discountRate: 15,
    discountActive: true,
    popularity: 93,
    imageUrl:
      'https://images.unsplash.com/photo-1484527273420-c598cb0601f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: 'Casual Unisex Hoodie',
    model: 'AURA-HOODIE-10',
    serialNumber: 'SN-AURA-1010',
    description: 'Soft brushed-fleece hoodie built for layering and everyday comfort.',
    categorySlug: 'unisex',
    price: 64.99,
    stock: 50,
    warrantyStatus: false,
    distributor: 'AURA Global Warehouses',
    discountRate: 0,
    popularity: 90,
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
];

const userSeeds = [
  {
    name: 'AURA Customer',
    email: 'customer@aura.test',
    password: 'password123',
    address: 'Istanbul Test Street 42',
    taxId: 'TR-CUSTOMER-001',
    role: 'customer',
  },
  {
    name: 'AURA Manager',
    email: 'manager@aura.test',
    password: 'password123',
    address: 'AURA Operations Office',
    taxId: 'TR-MANAGER-001',
    role: 'productManager',
  },
];

async function seed() {
  await mongoose.connect(mongoUri);

  try {
    const categoryIdsBySlug = new Map();

    for (const category of categories) {
      const savedCategory = await Category.findOneAndUpdate(
        { slug: category.slug },
        { $set: category },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      categoryIdsBySlug.set(category.slug, savedCategory._id.toString());
    }

    for (const product of productSeeds) {
      const categoryId = categoryIdsBySlug.get(product.categorySlug);

      if (!categoryId) {
        throw new Error(`Category mapping missing for slug: ${product.categorySlug}`);
      }

      await Product.findOneAndUpdate(
        { serialNumber: product.serialNumber },
        {
          $set: {
            name: product.name,
            model: product.model,
            serialNumber: product.serialNumber,
            description: product.description,
            categoryIds: [categoryId],
            price: product.price,
            stock: product.stock,
            warrantyStatus: product.warrantyStatus,
            distributor: product.distributor,
            discountRate: product.discountRate,
            discountActive: Boolean(product.discountActive),
            popularity: product.popularity,
            imageUrl: product.imageUrl,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    for (const user of userSeeds) {
      await User.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            name: user.name,
            email: user.email,
            password: await bcrypt.hash(user.password, 10),
            address: user.address,
            taxId: user.taxId,
            role: user.role,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    const [categoryCount, productCount, userCount] = await Promise.all([
      Category.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
    ]);

    console.log(
      `Seed complete. Categories: ${categoryCount}, Products: ${productCount}, Users: ${userCount}`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
