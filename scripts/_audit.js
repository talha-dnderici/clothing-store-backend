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

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.db.collection('products').deleteOne({ name: "Classic Men's T-Shirt" });
  console.log('Deleted:', result.deletedCount);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
