import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.DATA_DIR || __dirname;
export const UPLOAD_ROOT = join(DATA_DIR, 'uploads');
export const DB_PATH = join(DATA_DIR, 'discont.db');

export function ensureDataDirs() {
  if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });
  for (const sub of ['avatars', 'banners', 'server-icons']) {
    const dir = join(UPLOAD_ROOT, sub);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}
