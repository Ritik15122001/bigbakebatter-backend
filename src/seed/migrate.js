import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Announcement } from '../models/Announcement.js';
import { AddonCategory } from '../models/AddonCategory.js';
import { Coupon } from '../models/Coupon.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';
import { SiteContent } from '../models/SiteContent.js';
import { announcements, addonCategories, coupons } from './seedData.js';

/**
 * Safe, additive upgrade for an existing (live) database — unlike seed.js it
 * never deletes anything. Run after deploying: `npm run migrate`.
 * Every step is idempotent, so running it twice is harmless.
 */
await connectDB();

async function insertIfEmpty(Model, docs, label) {
  if (await Model.countDocuments()) return console.log(`- ${label}: already present, skipped`);
  await Model.insertMany(docs);
  console.log(`- ${label}: inserted ${docs.length}`);
}

await insertIfEmpty(Announcement, announcements, 'announcements');
await insertIfEmpty(AddonCategory, addonCategories, 'add-on categories');
await insertIfEmpty(Coupon, coupons, 'coupons');

// Box-style categories (sold as a fixed box, no weight choice) used to be hardcoded by name.
const boxed = await Category.updateMany({ name: { $in: ['Brownies', 'Cupcakes'] }, isBox: { $exists: false } }, { $set: { isBox: true } });
console.log(`- categories: marked ${boxed.modifiedCount} as box-style`);

// Build the new indexes (unique payment id on orders, etc.).
// createIndexes only adds missing indexes (syncIndexes would also drop any not in the schema).
for (const Model of [Order, Transaction, Product, Category, AddonCategory, Coupon, SiteContent]) await Model.createIndexes();
console.log('- indexes: created (existing ones untouched)');

await mongoose.disconnect();
console.log('Migration complete.');
