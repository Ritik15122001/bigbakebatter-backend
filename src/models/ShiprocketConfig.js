import mongoose from 'mongoose';

const credsSchema = new mongoose.Schema(
  {
    email: { type: String, default: '' },
    passwordEnc: { type: String, default: '' },
    // Pickup location NICKNAME as registered under Shiprocket → Settings → Pickup Addresses.
    pickupLocation: { type: String, default: '' },
    pickupPincode: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Singleton holding Shiprocket courier settings. Kept out of the public
 * `Setting` document for the same reason as SmtpConfig — passwords are
 * stored encrypted (utils/secretBox) and never returned by the API.
 * Test and Live credentials are both stored so the admin can flip `mode`
 * without re-entering anything.
 */
const shiprocketConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'shiprocket', unique: true },
    mode: { type: String, enum: ['test', 'live'], default: 'test' },
    apiBaseUrl: { type: String, default: 'https://apiv2.shiprocket.in/v1/external' },
    test: { type: credsSchema, default: () => ({}) },
    live: { type: credsSchema, default: () => ({}) },
    lastTest: {
      at: { type: Date, default: null },
      ok: { type: Boolean, default: null },
      message: { type: String, default: '' },
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ShiprocketConfig = mongoose.model('ShiprocketConfig', shiprocketConfigSchema);
