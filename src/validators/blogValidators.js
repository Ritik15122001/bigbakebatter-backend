import { z } from 'zod';

export const blogPostSchema = z.object({
  title: z.string().min(1),
  cat: z.string().optional().default('Guides'),
  excerpt: z.string().optional().default(''),
  body: z.string().optional().default(''),
  img: z.string().optional().default(''),
  ph: z.array(z.string()).optional().default([]),
  status: z.enum(['Draft', 'Published']).optional().default('Draft'),
  read: z.string().optional().default('4 min'),
});

export const blogPostUpdateSchema = blogPostSchema.partial();

export const commentSchema = z.object({
  name: z.string().min(2).max(60),
  text: z.string().min(2).max(1000),
});
