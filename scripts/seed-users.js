const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  role: { type: String, enum: ['customer', 'sales_manager', 'product_manager', 'admin'], default: 'customer' },
  address: { type: String, default: '' },
  taxId: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'users' });

const User = mongoose.models.SeedUser || mongoose.model('SeedUser', userSchema);

const mockUsers = [
  // Customers
  { email: 'ege.customer@test.com', password: 'Customer123!', firstName: 'Ege', lastName: 'Mercan', role: 'customer', address: 'Istanbul, Turkey', taxId: '11111111111' },
  { email: 'ayse.yilmaz@test.com', password: 'Customer123!', firstName: 'Ayse', lastName: 'Yilmaz', role: 'customer', address: 'Ankara, Turkey', taxId: '22222222222' },
  { email: 'mehmet.kaya@test.com', password: 'Customer123!', firstName: 'Mehmet', lastName: 'Kaya', role: 'customer', address: 'Izmir, Turkey', taxId: '33333333333' },
  { email: 'zeynep.demir@test.com', password: 'Customer123!', firstName: 'Zeynep', lastName: 'Demir', role: 'customer', address: 'Bursa, Turkey', taxId: '44444444444' },
  { email: 'can.ozturk@test.com', password: 'Customer123!', firstName: 'Can', lastName: 'Ozturk', role: 'customer', address: 'Antalya, Turkey', taxId: '55555555555' },
  // Sales Managers
  { email: 'sales1@aura.com', password: 'Sales123!', firstName: 'Elif', lastName: 'Arslan', role: 'sales_manager', address: 'HQ Istanbul', taxId: '66666666666' },
  { email: 'sales2@aura.com', password: 'Sales123!', firstName: 'Baran', lastName: 'Celik', role: 'sales_manager', address: 'HQ Istanbul', taxId: '77777777777' },
  // Product Managers
  { email: 'pm1@aura.com', password: 'Manager123!', firstName: 'Emir', lastName: 'Mirza', role: 'product_manager', address: 'HQ Istanbul', taxId: '88888888888' },
  { email: 'pm2@aura.com', password: 'Manager123!', firstName: 'Talha', lastName: 'Dnderici', role: 'product_manager', address: 'HQ Istanbul', taxId: '99999999999' },
  // Admin
  { email: 'admin@aura.com', password: 'Admin123!', firstName: 'Melih', lastName: 'Dilbaz', role: 'admin', address: 'HQ Istanbul', taxId: '10101010101' }
];

async function seedUsers() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const u of mockUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { email: u.email },
      { $set: { ...u, password: hashed } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const counts = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'sales_manager' }),
    User.countDocuments({ role: 'product_manager' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments()
  ]);

  console.log(`\n✅ Users seeded successfully`);
  console.log(`   Customers: ${counts[0]}`);
  console.log(`   Sales Managers: ${counts[1]}`);
  console.log(`   Product Managers: ${counts[2]}`);
  console.log(`   Admins: ${counts[3]}`);
  console.log(`   Total: ${counts[4]}`);
  console.log(`\n🔑 All passwords hashed with bcrypt (rounds=10)`);

  await mongoose.disconnect();
}

seedUsers().catch(err => { console.error(err); process.exit(1); });
