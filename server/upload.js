import { writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { UPLOAD_ROOT, ensureDataDirs } from './paths.js';

ensureDataDirs();

const ALLOWED = {
  avatar: { dir: 'avatars', maxBytes: 512 * 1024 },
  banner: { dir: 'banners', maxBytes: 2 * 1024 * 1024 },
  'server-icon': { dir: 'server-icons', maxBytes: 512 * 1024 },
};

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

export function saveImage(type, dataUrl) {
  const config = ALLOWED[type];
  if (!config) throw new Error('Invalid upload type');

  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');

  const mime = match[1];
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error('Unsupported image format');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > config.maxBytes) {
    throw new Error(`Image too large (max ${Math.round(config.maxBytes / 1024)}KB)`);
  }

  ensureDataDirs();
  const filename = `${randomUUID()}${ext}`;
  writeFileSync(join(UPLOAD_ROOT, config.dir, filename), buffer);

  return `/uploads/${config.dir}/${filename}`;
}
