import 'dotenv/config';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Flavour } from '../models/Flavour.js';
import { Occasion } from '../models/Occasion.js';
import { Addon } from '../models/Addon.js';
import { Banner } from '../models/Banner.js';
import { BlogPost } from '../models/BlogPost.js';
import { Faq } from '../models/Faq.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Enquiry } from '../models/Enquiry.js';
import { Setting } from '../models/Setting.js';
import { Counter } from '../models/Counter.js';

import {
  products, categories, flavours, occasions, addons, banners, blogPosts,
  faqs, reviews, setting, customers, orders, enquiries,
} from './seedData.js';

async function run() {
  await connectDB();
  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Category.deleteMany({}), Flavour.deleteMany({}),
    Occasion.deleteMany({}), Addon.deleteMany({}), Banner.deleteMany({}), BlogPost.deleteMany({}),
    Faq.deleteMany({}), Review.deleteMany({}), Order.deleteMany({}), Enquiry.deleteMany({}),
    Setting.deleteMany({}), Counter.deleteMany({}),
  ]);

  console.log('Seeding catalog content...');
  await Product.insertMany(products);
  await Category.insertMany(categories);
  await Flavour.insertMany(flavours);
  await Occasion.insertMany(occasions);
  await Addon.insertMany(addons);
  await Banner.insertMany(banners);
  await BlogPost.insertMany(blogPosts);
  await Faq.insertMany(faqs);
  await Review.insertMany(reviews);
  await Setting.create(setting);

  console.log('Seeding admin user...');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bigbakebatter.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  await User.create({
    name: 'BigBakeBatter Admin',
    email: adminEmail,
    passwordHash: await User.hashPassword(adminPassword),
    role: 'admin',
  });

  console.log('Seeding customers...');
  const defaultPasswordHash = await User.hashPassword('Customer@123');
  const customerDocs = await User.insertMany(
    customers.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      addr: c.addr || '',
      passwordHash: defaultPasswordHash,
      role: 'customer',
    }))
  );
  const userByEmail = new Map(customerDocs.map((u) => [u.email, u._id]));

  console.log('Seeding orders...');
  await Order.insertMany(
    orders.map(({ customerEmail, ...o }) => ({ ...o, email: customerEmail, user: userByEmail.get(customerEmail) }))
  );

  console.log('Seeding custom cake enquiries...');
  await Enquiry.insertMany(enquiries);

  console.log('Priming order/enquiry code counters...');
  await Counter.create([
    { key: 'order', value: 1048 },
    { key: 'enquiry', value: 1024 },
  ]);

  console.log('\nDone. Seeded:');
  console.log(`  ${products.length} products, ${categories.length} categories, ${banners.length} banners`);
  console.log(`  ${blogPosts.length} blog posts, ${orders.length} orders, ${enquiries.length} enquiries`);
  console.log(`  ${customers.length} customers, 1 admin`);
  console.log(`\nAdmin login: ${adminEmail} / ${adminPassword}`);
  console.log('Customer login (any seeded customer email) / Customer@123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
