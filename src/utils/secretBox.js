import crypto from 'node:crypto';

/**
 * Small AES-256-GCM helper for secrets stored in the database (e.g. the SMTP
 * password). The key comes from SECRETS_KEY, falling back to JWT_SECRET, so a
 * database dump alone is not enough to read them. Changing the key makes
 * existing secrets unreadable — they then just need to be entered again.
 */
const key = () => {
  const source = process.env.SECRETS_KEY || process.env.JWT_SECRET;
  if (!source) throw new Error('SECRETS_KEY or JWT_SECRET must be set to store secrets');
  return crypto.createHash('sha256').update(source).digest();
};

export function encryptSecret(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

/** Returns '' when the value is empty or can no longer be decrypted (key changed). */
export function decryptSecret(box) {
  if (!box) return '';
  try {
    const [v, iv, tag, data] = box.split(':');
    if (v !== 'v1') return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}
