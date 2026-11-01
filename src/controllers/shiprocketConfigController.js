import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ShiprocketConfig } from '../models/ShiprocketConfig.js';
import { encryptSecret } from '../utils/secretBox.js';
import { checkServiceability, invalidateTokenCache, ShiprocketUnavailableError } from '../services/shiprocket.js';

/** What the admin panel sees: everything except the two stored passwords. */
const publicView = (doc) => {
  const d = (doc || new ShiprocketConfig()).toObject();
  const strip = (creds) => {
    // eslint-disable-next-line no-unused-vars
    const { passwordEnc, ...rest } = creds || {};
    return { ...rest, hasPassword: !!passwordEnc };
  };
  return {
    mode: d.mode,
    apiBaseUrl: d.apiBaseUrl,
    test: strip(d.test),
    live: strip(d.live),
    lastTest: d.lastTest,
    updatedAt: d.updatedAt,
  };
};

export const getShiprocketConfig = asyncHandler(async (_req, res) => {
  const doc = await ShiprocketConfig.findOne({ key: 'shiprocket' });
  sendSuccess(res, { data: publicView(doc) });
});

/**
 * Save settings. Each mode's `password` is only changed when a non-empty
 * value is sent for that mode; `clearPassword: true` (per mode) removes it.
 */
export const updateShiprocketConfig = asyncHandler(async (req, res) => {
  const { mode, apiBaseUrl, test, live } = req.body;
  const update = { updatedBy: req.user.email };
  if (mode) update.mode = mode;
  if (apiBaseUrl) update.apiBaseUrl = apiBaseUrl;

  const buildCreds = async (incoming, existing) => {
    if (!incoming) return undefined;
    const { password, clearPassword, ...fields } = incoming;
    const creds = { ...existing, ...fields };
    if (clearPassword) creds.passwordEnc = '';
    else if (password) creds.passwordEnc = encryptSecret(password);
    return creds;
  };

  const current = await ShiprocketConfig.findOne({ key: 'shiprocket' });
  const nextTest = await buildCreds(test, current?.test?.toObject?.() || current?.test);
  const nextLive = await buildCreds(live, current?.live?.toObject?.() || current?.live);
  if (nextTest) update.test = nextTest;
  if (nextLive) update.live = nextLive;

  const doc = await ShiprocketConfig.findOneAndUpdate(
    { key: 'shiprocket' },
    update,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  invalidateTokenCache();
  sendSuccess(res, { message: 'Shiprocket settings saved', data: publicView(doc) });
});

/** Turn Shiprocket errors into something a shop owner can act on. */
function explain(err) {
  const msg = err?.message || 'Unknown error';
  if (/invalid|unauthorized|401|login/i.test(msg)) {
    return `Shiprocket rejected the email or password. (${msg})`;
  }
  if (err instanceof ShiprocketUnavailableError) {
    return `Could not reach Shiprocket — check your connection and try again. (${msg})`;
  }
  return msg;
}

/**
 * Checks the connection using the settings in the request body merged over
 * the saved ones for the active mode, so the admin can test before saving.
 */
export const testShiprocketConnection = asyncHandler(async (req, res) => {
  const { mode, test, live } = req.body;
  const current = await ShiprocketConfig.findOne({ key: 'shiprocket' });
  const targetMode = mode || current?.mode || 'test';
  const overrides = targetMode === 'live' ? live : test;
  const saved = (targetMode === 'live' ? current?.live : current?.test)?.toObject?.() || {};

  const merged = { ...saved, ...(overrides || {}) };
  if (!merged.email || (!merged.password && !saved.passwordEnc)) {
    throw ApiError.badRequest('Enter the Shiprocket email and password first.');
  }
  if (!merged.pickupPincode) throw ApiError.badRequest('Enter the pickup pincode first.');

  // Temporarily persist so the shared service (which reads from the DB) picks up the values being tested.
  await ShiprocketConfig.findOneAndUpdate(
    { key: 'shiprocket' },
    {
      mode: targetMode,
      [targetMode]: {
        ...saved,
        ...overrides,
        passwordEnc: overrides?.password ? encryptSecret(overrides.password) : saved.passwordEnc,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  invalidateTokenCache();

  let result;
  try {
    const { serviceable, couriers } = await checkServiceability({ deliveryPincode: merged.pickupPincode, weightKg: 1 });
    result = { ok: true, message: serviceable ? `Connected — ${couriers.length} courier(s) found for your pickup pincode.` : 'Connected, but no couriers were found for your pickup pincode.' };
  } catch (err) {
    result = { ok: false, message: explain(err) };
  }

  await ShiprocketConfig.updateOne({ key: 'shiprocket' }, { lastTest: { at: new Date(), ok: result.ok, message: result.message } });
  if (!result.ok) throw ApiError.badRequest(result.message);
  sendSuccess(res, { message: result.message, data: result });
});
