import mongoose from 'mongoose';

/**
 * Singleton holding the outgoing-mail (SMTP) settings. Kept out of the public
 * `Setting` document because GET /settings is readable by anyone; the password
 * is stored encrypted (utils/secretBox) and never returned by the API.
 */
const smtpConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'smtp', unique: true },
    enabled: { type: Boolean, default: false },
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    // 'ssl' = implicit TLS (usually 465), 'starttls' = upgrade (usually 587), 'none' = plain (testing only)
    security: { type: String, enum: ['ssl', 'starttls', 'none'], default: 'starttls' },
    username: { type: String, default: '' },
    passwordEnc: { type: String, default: '' },
    fromName: { type: String, default: 'BigBakeBatter' },
    fromEmail: { type: String, default: '' },
    replyTo: { type: String, default: '' },
    notifyEmail: { type: String, default: '' }, // where admin alerts (new orders, enquiries) should go
    lastTest: {
      at: { type: Date, default: null },
      ok: { type: Boolean, default: null },
      message: { type: String, default: '' },
      to: { type: String, default: '' },
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SmtpConfig = mongoose.model('SmtpConfig', smtpConfigSchema);
