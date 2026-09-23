import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Enquiry } from '../models/Enquiry.js';
import { nextSequence } from '../models/Counter.js';
import { notify } from './notificationController.js';

export const createEnquiry = asyncHandler(async (req, res) => {
  const seq = await nextSequence('enquiry');
  const enquiry = await Enquiry.create({ ...req.body, code: `#CC${seq}`, user: req.user?._id });
  await notify({
    type: 'enquiry',
    title: `New custom cake enquiry ${enquiry.code}`,
    message: `${enquiry.name} enquired about a ${enquiry.occasion} cake`,
    link: '/enquiries',
    meta: { enquiryId: enquiry._id, code: enquiry.code },
  });
  sendSuccess(res, { statusCode: 201, message: 'Enquiry sent', data: enquiry });
});

export const listEnquiries = asyncHandler(async (_req, res) => {
  const enquiries = await Enquiry.find().sort('-createdAt');
  sendSuccess(res, { data: enquiries });
});

export const getMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ user: req.user._id }).sort('-createdAt');
  sendSuccess(res, { data: enquiries });
});

export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  sendSuccess(res, { message: `Enquiry marked ${enquiry.status}`, data: enquiry });
});
