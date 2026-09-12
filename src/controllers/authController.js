import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { generateToken } from '../utils/token.js';
import { User } from '../models/User.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, addr } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, phone, addr, passwordHash });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created',
    data: { user, token: generateToken(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  sendSuccess(res, { message: 'Signed in', data: { user, token: generateToken(user) } });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, addr } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(phone !== undefined && { phone }), ...(addr !== undefined && { addr }) },
    { new: true, runValidators: true }
  );
  sendSuccess(res, { message: 'Profile updated', data: user });
});
