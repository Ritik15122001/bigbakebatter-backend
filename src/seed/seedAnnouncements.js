import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Announcement } from '../models/Announcement.js';
import { announcements } from './seedData.js';

// Additive and safe on a live database (unlike seed.js, which wipes everything):
// only inserts the default announcement-bar messages when none exist yet.
await connectDB();
if (await Announcement.countDocuments()) {
  console.log('Announcements already exist — nothing to do.');
} else {
  await Announcement.insertMany(announcements);
  console.log(`Inserted ${announcements.length} announcements.`);
}
await mongoose.disconnect();
