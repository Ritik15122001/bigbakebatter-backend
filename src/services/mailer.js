import nodemailer from 'nodemailer';
import { SmtpConfig } from '../models/SmtpConfig.js';
import { decryptSecret } from '../utils/secretBox.js';

/** The saved SMTP settings (with the decrypted password), or null if never saved. */
export async function loadSmtpConfig() {
  const doc = await SmtpConfig.findOne({ key: 'smtp' }).lean();
  if (!doc) return null;
  return { ...doc, password: decryptSecret(doc.passwordEnc) };
}

export function buildTransport(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: Number(cfg.port),
    secure: cfg.security === 'ssl',
    requireTLS: cfg.security === 'starttls',
    ignoreTLS: cfg.security === 'none',
    auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

const fromHeader = (cfg) => (cfg.fromName ? `"${cfg.fromName.replace(/"/g, '')}" <${cfg.fromEmail}>` : cfg.fromEmail);

/**
 * Send an email with the saved settings. Resolves to { sent: false, reason }
 * when email is switched off or not set up, so callers never crash a request
 * just because mail isn't configured. Pass `cfg` to send with unsaved settings.
 */
export async function sendMail({ to, subject, html, text }, cfg = null) {
  const config = cfg || (await loadSmtpConfig());
  if (!config || !config.host || !config.fromEmail) return { sent: false, reason: 'Email is not set up yet' };
  if (!cfg && !config.enabled) return { sent: false, reason: 'Email sending is switched off' };
  const info = await buildTransport(config).sendMail({
    from: fromHeader(config),
    replyTo: config.replyTo || undefined,
    to,
    subject,
    text,
    html,
  });
  return { sent: true, messageId: info.messageId };
}
