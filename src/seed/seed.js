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
import { Transaction } from '../models/Transaction.js';
import { Enquiry } from '../models/Enquiry.js';
import { Setting } from '../models/Setting.js';
import { Counter } from '../models/Counter.js';
import { Notification } from '../models/Notification.js';

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
    Setting.deleteMany({}), Counter.deleteMany({}), Transaction.deleteMany({}), Notification.deleteMany({}),
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
      addresses: c.addr
        ? [{ label: 'Home', line: c.addr, city: c.city || '', pin: '', isDefault: true }]
        : [],
      passwordHash: defaultPasswordHash,
      role: 'customer',
    }))
  );
  const userByEmail = new Map(customerDocs.map((u) => [u.email, u._id]));

  console.log('Seeding orders...');
  const now = Date.now();
  const orderDocs = await Order.insertMany(
    orders.map(({ customerEmail, ...o }, i) => ({
      ...o,
      email: customerEmail,
      user: userByEmail.get(customerEmail),
      razorpayOrderId: `order_seed${1000 + i}`,
      razorpayPaymentId: `pay_seed${1000 + i}`,
      // spread the seeded orders over the last week so finance charts have shape
      createdAt: new Date(now - (orders.length - i) * 22 * 60 * 60 * 1000),
    })),
    { timestamps: false }
  );

  console.log('Seeding payment transactions...');
  await Transaction.insertMany(
    orderDocs.map((o, i) => ({
      txnId: `TXN${10001 + i}`,
      order: o._id,
      orderCode: o.code,
      user: o.user,
      customer: o.customer,
      email: o.email,
      amount: o.amount,
      method: o.pay,
      status: o.status === 'Cancelled' ? 'Refunded' : 'Paid',
      razorpayOrderId: o.razorpayOrderId,
      razorpayPaymentId: o.razorpayPaymentId,
      paidAt: o.createdAt,
      ...(o.status === 'Cancelled' ? { refundedAt: new Date(o.createdAt.getTime() + 3600000) } : {}),
    }))
  );

  console.log('Seeding custom cake enquiries...');
  const enquiryDocs = await Enquiry.insertMany(enquiries);

  console.log('Seeding notifications...');
  const orderNotifs = orderDocs.slice(-4).map((o, i, arr) => ({
    type: 'order',
    title: `New order ${o.code}`,
    message: `${o.customer} placed an order for ₹${o.amount.toLocaleString('en-IN')}`,
    link: '/orders',
    meta: { orderId: o._id, code: o.code },
    read: i < arr.length - 2, // only the 2 most recent stay unread
    createdAt: o.createdAt,
  }));
  const enquiryNotifs = enquiryDocs.map((e) => ({
    type: 'enquiry',
    title: `New custom cake enquiry ${e.code}`,
    message: `${e.name} enquired about a ${e.occasion} cake`,
    link: '/enquiries',
    meta: { enquiryId: e._id, code: e.code },
    read: e.status !== 'New',
    createdAt: e.createdAt || new Date(),
  }));
  await Notification.insertMany([...orderNotifs, ...enquiryNotifs], { timestamps: false });

  console.log('Priming order/enquiry code counters...');
  await Counter.create([
    { key: 'order', value: 1048 },
    { key: 'enquiry', value: 1024 },
    { key: 'transaction', value: orders.length },
  ]);

  console.log('\nDone. Seeded:');
  console.log(`  ${products.length} products, ${categories.length} categories, ${banners.length} banners`);
  console.log(`  ${blogPosts.length} blog posts, ${orders.length} orders, ${enquiries.length} enquiries`);
  console.log(`  ${customers.length} customers, 1 admin, ${orders.length} transactions`);
  console.log(`\nAdmin login: ${adminEmail} / ${adminPassword}`);
  console.log('Customer login (any seeded customer email) / Customer@123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
