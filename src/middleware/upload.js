import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  // Extension comes from the (filtered) mimetype, never the client's filename,
  // so nothing like "x.html" can be stored and served from the API origin.
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
});

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

function fileFilter(_req, file, cb) {
  if (EXT[file.mimetype]) cb(null, true);
  else cb(new ApiError(400, 'Only image uploads (jpeg, png, webp, gif) are allowed'));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
