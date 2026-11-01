import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { SmtpConfig } from '../models/SmtpConfig.js';
import { encryptSecret } from '../utils/secretBox.js';
import { loadSmtpConfig, buildTransport, sendMail } from '../services/mailer.js';

/** What the admin panel sees: everything except the password itself. */
const publicView = (doc) => {
  // eslint-disable-next-line no-unused-vars
  const { passwordEnc, _id, __v, key, ...rest } = (doc || new SmtpConfig()).toObject();
  return { ...rest, hasPassword: !!passwordEnc };
};

export const getSmtp = asyncHandler(async (_req, res) => {
  const doc = await SmtpConfig.findOne({ key: 'smtp' });
  sendSuccess(res, { data: publicView(doc) });
});

/**
 * Save settings. `password` is only changed when a non-empty value is sent;
 * `clearPassword: true` removes the saved one.
 */
export const updateSmtp = asyncHandler(async (req, res) => {
  const { password, clearPassword, ...fields } = req.body;
  const update = { ...fields, updatedBy: req.user.email };
  if (clearPassword) update.passwordEnc = '';
  else if (password) update.passwordEnc = encryptSecret(password);
  if (update.enabled) {
    const merged = { ...(await loadSmtpConfig()), ...update };
    if (!merged.host || !merged.fromEmail) throw ApiError.badRequest('Add the SMTP server and the From email before switching email on.');
  }
  const doc = await SmtpConfig.findOneAndUpdate({ key: 'smtp' }, update, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  sendSuccess(res, { message: 'Email settings saved', data: publicView(doc) });
});

/** Turn SMTP errors into something a shop owner can act on. */
function explain(err) {
  const msg = err?.message || 'Unknown error';
  if (err?.code === 'EAUTH' || /auth|535|534|Invalid login|Username and Password/i.test(msg)) {
    return 'The server rejected the username or password. For Gmail/Outlook use an app password, not your normal password.';
  }
  if (err?.code === 'ECONNECTION' || err?.code === 'ETIMEDOUT' || /timeout|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(msg)) {
    return `Could not reach the mail server — check the host and port. (${msg})`;
  }
  if (/wrong version number|ssl|tls|certificate/i.test(msg)) {
    return `Secure connection failed — try the other security option (SSL for port 465, STARTTLS for 587). (${msg})`;
  }
  if (/sender|from address|not owned|553|550/i.test(msg)) {
    return `The server refused the From address — it usually has to be an address on the account you log in with. (${msg})`;
  }
  return msg;
}

/**
 * Check the connection and send a test email. Uses the settings in the request
 * body merged over the saved ones, so the admin can test before saving.
 */
export const testSmtp = asyncHandler(async (req, res) => {
  const { to, password, ...overrides } = req.body;
  const saved = (await loadSmtpConfig()) || {};
  const cfg = { ...saved, ...overrides, password: password || saved.password || '' };
  if (!cfg.host) throw ApiError.badRequest('Enter the SMTP server first.');
  if (!cfg.fromEmail) throw ApiError.badRequest('Enter the From email first.');

  let result;
  try {
    await buildTransport(cfg).verify();
    await sendMail({
      to,
      subject: 'Test email from your BigBakeBatter admin panel',
      text: `Your email settings work.\n\nServer: ${cfg.host}:${cfg.port} (${cfg.security})\nSent at: ${new Date().toISOString()}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
        <h2 style="margin:0 0 8px">Your email settings work 🎉</h2>
        <p style="margin:0 0 12px">This test was sent from the BigBakeBatter admin panel.</p>
        <p style="margin:0;color:#666;font-size:13px">Server: ${cfg.host}:${cfg.port} (${cfg.security})<br>Sent at: ${new Date().toUTCString()}</p>
      </div>`,
    }, cfg);
    result = { ok: true, message: `Test email sent to ${to}` };
  } catch (err) {
    result = { ok: false, message: explain(err) };
  }
  await SmtpConfig.updateOne({ key: 'smtp' }, { lastTest: { at: new Date(), ok: result.ok, message: result.message, to } }, { upsert: true });
  if (!result.ok) throw ApiError.badRequest(result.message);
  sendSuccess(res, { message: result.message, data: result });
});
