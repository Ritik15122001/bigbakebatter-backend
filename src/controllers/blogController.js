import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { BlogPost } from '../models/BlogPost.js';
import { Comment } from '../models/Comment.js';

export const listPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find().sort('-createdAt');
  sendSuccess(res, { data: posts });
});

export const getPublishedPosts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 0;
  let query = BlogPost.find({ status: 'Published' }).sort('-createdAt');
  if (limit) query = query.limit(limit);
  sendSuccess(res, { data: await query });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!post) throw ApiError.notFound('Article not found');
  sendSuccess(res, { data: post });
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.create(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Article created', data: post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!post) throw ApiError.notFound('Article not found');
  sendSuccess(res, { message: 'Article updated', data: post });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) throw ApiError.notFound('Article not found');
  await Comment.deleteMany({ post: post._id });
  sendSuccess(res, { message: 'Article deleted', data: post });
});

export const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.id }).sort('-createdAt');
  sendSuccess(res, { data: comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Article not found');
  const comment = await Comment.create({ post: post._id, user: req.user?._id, ...req.body });
  sendSuccess(res, { statusCode: 201, message: 'Comment posted', data: comment });
});
