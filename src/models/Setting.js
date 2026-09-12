import mongoose from 'mongoose';

/** Singleton document (findOneAndUpdate with upsert) holding editable business info. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'business', unique: true },
    name: { type: String, default: 'BigBakeBatter Homemade Cake' },
    since: { type: Number, default: 2017 },
    phones: { type: [String], default: [] },
    email: { type: String, default: '' },
    addressFull: { type: String, default: '' },
    mapsEmbedSrc: { type: String, default: '' },
    mapsLink: { type: String, default: '' },
    social: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
