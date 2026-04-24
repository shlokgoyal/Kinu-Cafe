/* Demo seed — run with `npm run seed:demo`.
 * Populates 3 categories, a handful of menu items, 3 tables (with QR URLs),
 * one active coupon and the Settings singleton. Safe to re-run: uses upserts. */

const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const slugify = require('../utils/slugify');
const { generateQrToken, buildQrUrl } = require('../utils/generateQrToken');

async function run() {
  await connectDb();

  await Settings.getSingleton();

  const categoriesData = [
    { name: 'Coffee', description: 'Hot and cold coffees', displayOrder: 1 },
    { name: 'Pastries', description: 'Fresh baked pastries', displayOrder: 2 },
    { name: 'Sandwiches', description: 'Grilled sandwiches and toasts', displayOrder: 3 },
  ];
  const categories = {};
  for (const c of categoriesData) {
    const slug = slugify(c.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { ...c, slug } },
      { upsert: true, new: true }
    );
    categories[slug] = doc;
  }

  const items = [
    { name: 'Cappuccino', price: 180, category: 'coffee', tags: ['hot', 'milk'], isVeg: true },
    { name: 'Cold Brew', price: 220, category: 'coffee', tags: ['cold'], isVeg: true },
    { name: 'Chocolate Croissant', price: 150, category: 'pastries', tags: ['chocolate'], isVeg: true },
    { name: 'Blueberry Muffin', price: 120, category: 'pastries', tags: ['berry'], isVeg: true },
    { name: 'Grilled Veg Sandwich', price: 200, category: 'sandwiches', tags: ['grilled'], isVeg: true },
    { name: 'Chicken Club Sandwich', price: 260, category: 'sandwiches', tags: ['grilled'], isVeg: false },
  ];
  for (const it of items) {
    const slug = slugify(it.name);
    await MenuItem.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          ...it,
          slug,
          category: categories[it.category]._id,
          isAvailable: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  for (const num of ['T1', 'T2', 'T3']) {
    const existing = await Table.findOne({ number: num });
    if (!existing) {
      const qrToken = generateQrToken();
      await Table.create({
        number: num,
        capacity: 4,
        qrToken,
        qrUrl: buildQrUrl(qrToken),
      });
    }
  }

  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);
  await Coupon.findOneAndUpdate(
    { code: 'WELCOME10' },
    {
      $setOnInsert: {
        code: 'WELCOME10',
        description: '10% off on orders over ₹200',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 100,
        minOrderAmount: 200,
        usageLimit: null,
        usagePerUser: 1,
        validFrom: new Date(),
        validTo,
        isActive: true,
      },
    },
    { upsert: true, new: true }
  );

  const tables = await Table.find().select('number qrUrl');
  console.log('[seed:demo] done. Tables:');
  for (const t of tables) console.log(`  ${t.number} → ${t.qrUrl}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed:demo] failed:', err);
  process.exit(1);
});
