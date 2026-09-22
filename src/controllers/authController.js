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

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect');
  }
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  sendSuccess(res, { message: 'Password updated' });
});

/** Keeps exactly one default address and mirrors it onto the legacy `addr` field. */
function syncDefaultAddress(user, defaultId) {
  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(defaultId);
  });
  const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
  if (def) {
    def.isDefault = true;
    user.addr = [def.line, def.city, def.pin].filter(Boolean).join(', ');
  } else {
    user.addr = '';
  }
}

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const isFirst = user.addresses.length === 0;
  user.addresses.push({ ...req.body, isDefault: isFirst || !!req.body.isDefault });
  const added = user.addresses[user.addresses.length - 1];
  if (isFirst || req.body.isDefault) syncDefaultAddress(user, added._id);
  await user.save();
  sendSuccess(res, { statusCode: 201, message: 'Address added', data: user });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  Object.assign(address, req.body);
  if (req.body.isDefault || address.isDefault) syncDefaultAddress(user, address._id);
  await user.save();
  sendSuccess(res, { message: 'Address updated', data: user });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault) syncDefaultAddress(user, user.addresses[0]?._id);
  await user.save();
  sendSuccess(res, { message: 'Address removed', data: user });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  syncDefaultAddress(user, address._id);
  await user.save();
  sendSuccess(res, { message: 'Default address updated', data: user });
});
