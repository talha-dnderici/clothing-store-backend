const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('\n=== REFERENTIAL INTEGRITY CHECK ===\n');

  const productIds = new Set((await db.collection('products').find({}, { projection: { _id: 1 } }).toArray()).map(p => p._id.toString()));
  const userIds = new Set((await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id.toString()));
  const categoryIds = new Set((await db.collection('categories').find({}, { projection: { _id: 1 } }).toArray()).map(c => c._id.toString()));

  console.log('Collection counts:');
  console.log('  Products:  ' + productIds.size);
  console.log('  Users:     ' + userIds.size);
  console.log('  Categories:' + categoryIds.size);

  let issues = 0;

  console.log('\nProducts -> Categories:');
  const products = await db.collection('products').find({}).toArray();
  for (const p of products) {
    if (p.categoryIds && p.categoryIds.length) {
      for (const cid of p.categoryIds) {
        if (!categoryIds.has(cid.toString())) {
          console.log('  FAIL: Product "' + p.name + '" -> missing category ' + cid);
          issues++;
        }
      }
    }
  }
  if (issues === 0) console.log('  OK: all products reference valid categories');

  console.log('\nOrders -> Users & Products:');
  const orders = await db.collection('orders').find({}).toArray();
  let orderIssues = 0;
  for (const o of orders) {
    if (o.userId && !userIds.has(o.userId.toString())) {
      console.log('  FAIL: Order ' + o._id + ' -> missing user ' + o.userId);
      orderIssues++;
    }
    if (o.items) {
      for (const item of o.items) {
        if (item.productId && !productIds.has(item.productId.toString())) {
          console.log('  FAIL: Order ' + o._id + ' -> missing product ' + item.productId);
          orderIssues++;
        }
      }
    }
  }
  if (orderIssues === 0) console.log('  OK: all ' + orders.length + ' orders valid');
  issues += orderIssues;

  console.log('\nInvoices -> Orders:');
  const orderIds = new Set(orders.map(o => o._id.toString()));
  const invoices = await db.collection('invoices').find({}).toArray();
  let invIssues = 0;
  for (const inv of invoices) {
    if (inv.orderId && !orderIds.has(inv.orderId.toString())) {
      console.log('  FAIL: Invoice ' + inv._id + ' -> missing order ' + inv.orderId);
      invIssues++;
    }
  }
  if (invIssues === 0) console.log('  OK: all ' + invoices.length + ' invoices valid');
  issues += invIssues;

  console.log('\nCards -> Users:');
  const cards = await db.collection('cards').find({}).toArray();
  let cardIssues = 0;
  for (const c of cards) {
    if (c.userId && !userIds.has(c.userId.toString())) {
      console.log('  FAIL: Card ' + c._id + ' -> missing user ' + c.userId);
      cardIssues++;
    }
  }
  if (cardIssues === 0) console.log('  OK: all ' + cards.length + ' cards valid');
  issues += cardIssues;

  console.log('\n=== RESULT ===');
  if (issues === 0) {
    console.log('PASSED: No orphaned references');
  } else {
    console.log('FAILED: ' + issues + ' issues found');
  }

  await mongoose.disconnect();
}

check().catch(err => { console.error(err); process.exit(1); });
