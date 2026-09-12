import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    cat: { type: String, default: 'Guides' },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    img: { type: String, default: '' },
    ph: { type: [String], default: [] },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    read: { type: String, default: '4 min' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
