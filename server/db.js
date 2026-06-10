import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { DB_PATH, ensureDataDirs } from './paths.js';

ensureDataDirs();
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT DEFAULT '😊',
    banner_color TEXT DEFAULT '#5865f2',
    banner_image TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    status TEXT DEFAULT 'online',
    custom_status TEXT DEFAULT '',
    accent_color TEXT DEFAULT '#5865f2',
    client_settings TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🏠',
    owner_id TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS server_members (
    server_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (server_id, user_id),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channel_categories (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    position INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES channel_categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at);

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function migrate() {
  const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!userCols.includes('banner_image')) {
    db.exec("ALTER TABLE users ADD COLUMN banner_image TEXT DEFAULT ''");
  }

  const channelCols = db.prepare('PRAGMA table_info(channels)').all().map(c => c.name);
  if (!channelCols.includes('category_id')) {
    db.exec('ALTER TABLE channels ADD COLUMN category_id TEXT');
  }

  migrateLegacyServers();
}
migrate();

function migrateLegacyServers() {
  const servers = db.prepare('SELECT id FROM servers').all();
  for (const { id: serverId } of servers) {
    const { c } = db.prepare(
      'SELECT COUNT(*) as c FROM channel_categories WHERE server_id = ?'
    ).get(serverId);
    if (c > 0) continue;

    const now = Date.now();
    const textCatId = crypto.randomUUID();
    const voiceCatId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO channel_categories (id, server_id, name, position, created_at)
      VALUES (?, ?, 'Text Channels', 0, ?)
    `).run(textCatId, serverId, now);

    db.prepare(`
      INSERT INTO channel_categories (id, server_id, name, position, created_at)
      VALUES (?, ?, 'Voice Channels', 1, ?)
    `).run(voiceCatId, serverId, now);

    db.prepare(`
      UPDATE channels SET category_id = ?
      WHERE server_id = ? AND (type IS NULL OR type = 'text') AND category_id IS NULL
    `).run(textCatId, serverId);

    db.prepare(`
      UPDATE channels SET category_id = ?
      WHERE server_id = ? AND type = 'voice' AND category_id IS NULL
    `).run(voiceCatId, serverId);
  }
}

export function createSession(token, userId) {
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)')
    .run(token, userId, Date.now());
}

export function getSessionUser(token) {
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  return row?.user_id || null;
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function generateInviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function createUser({ id, username, displayName, avatar }) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO users (id, username, display_name, avatar, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, username, displayName || username, avatar || '😊', now);
  return getUser(id);
}

export function updateUser(id, fields) {
  const allowed = [
    'display_name', 'avatar', 'banner_color', 'banner_image', 'bio', 'status',
    'custom_status', 'accent_color', 'client_settings',
  ];
  const updates = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowed.includes(col)) {
      updates.push(`${col} = ?`);
      values.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  if (updates.length === 0) return getUser(id);
  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getUser(id);
}

export function getServer(id) {
  return db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
}

export function updateServer(id, fields) {
  const allowed = ['name', 'icon'];
  const updates = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    const col = key === 'name' ? 'name' : key === 'icon' ? 'icon' : null;
    if (col && allowed.includes(col)) {
      updates.push(`${col} = ?`);
      values.push(val);
    }
  }
  if (updates.length === 0) return getServer(id);
  values.push(id);
  db.prepare(`UPDATE servers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getServer(id);
}

export function getServerByInvite(code) {
  return db.prepare('SELECT * FROM servers WHERE invite_code = ?').get(code.toUpperCase());
}

export function getUserServers(userId) {
  return db.prepare(`
    SELECT s.* FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = ?
    ORDER BY s.created_at
  `).all(userId);
}

export function createServer({ id, name, icon, ownerId }) {
  const now = Date.now();
  const inviteCode = generateInviteCode();
  db.prepare(`
    INSERT INTO servers (id, name, icon, owner_id, invite_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, icon || '🏠', ownerId, inviteCode, now);
  db.prepare('INSERT INTO server_members (server_id, user_id, joined_at) VALUES (?, ?, ?)')
    .run(id, ownerId, now);

  const categoryId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO channel_categories (id, server_id, name, position, created_at)
    VALUES (?, ?, 'Text Channels', 0, ?)
  `).run(categoryId, id, now);

  const textCategoryId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO channel_categories (id, server_id, name, position, created_at)
    VALUES (?, ?, 'Voice Channels', 1, ?)
  `).run(textCategoryId, id, now);

  const generalId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO channels (id, server_id, category_id, name, type, position, created_at)
    VALUES (?, ?, ?, 'general', 'text', 0, ?)
  `).run(generalId, id, categoryId, now);

  const voiceId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO channels (id, server_id, category_id, name, type, position, created_at)
    VALUES (?, ?, ?, 'General', 'voice', 0, ?)
  `).run(voiceId, id, textCategoryId, now);

  return getServer(id);
}

export function joinServer(serverId, userId) {
  const existing = db.prepare(
    'SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?'
  ).get(serverId, userId);
  if (existing) return getServer(serverId);
  db.prepare('INSERT INTO server_members (server_id, user_id, joined_at) VALUES (?, ?, ?)')
    .run(serverId, userId, Date.now());
  return getServer(serverId);
}

export function getServerCategories(serverId) {
  return db.prepare(
    'SELECT * FROM channel_categories WHERE server_id = ? ORDER BY position, created_at'
  ).all(serverId);
}

export function createCategory({ id, serverId, name }) {
  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) as p FROM channel_categories WHERE server_id = ?'
  ).get(serverId);
  db.prepare(`
    INSERT INTO channel_categories (id, server_id, name, position, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, serverId, name, maxPos.p + 1, Date.now());
  return db.prepare('SELECT * FROM channel_categories WHERE id = ?').get(id);
}

export function getChannel(id) {
  return db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
}

export function getServerChannels(serverId) {
  return db.prepare(
    'SELECT * FROM channels WHERE server_id = ? ORDER BY position, created_at'
  ).all(serverId);
}

export function getServerLayout(serverId) {
  return {
    categories: getServerCategories(serverId),
    channels: getServerChannels(serverId),
  };
}

export function createChannel({ id, serverId, name, type = 'text', categoryId = null }) {
  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) as p FROM channels WHERE server_id = ? AND category_id IS ?'
  ).get(serverId, categoryId);
  db.prepare(`
    INSERT INTO channels (id, server_id, category_id, name, type, position, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, serverId, categoryId, name, type, maxPos.p + 1, Date.now());
  return db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
}

export function updateChannel(id, fields) {
  const allowed = ['name'];
  const updates = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key) && val != null) {
      updates.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (updates.length === 0) return getChannel(id);
  values.push(id);
  db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getChannel(id);
}

export function deleteChannel(id) {
  const channel = getChannel(id);
  if (!channel) return null;
  db.prepare('DELETE FROM channels WHERE id = ?').run(id);
  return channel;
}

export function getChannelMessages(channelId, limit = 50, before = null) {
  if (before) {
    return db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar, u.accent_color
      FROM messages m JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.created_at < ?
      ORDER BY m.created_at DESC LIMIT ?
    `).all(channelId, before, limit).reverse();
  }
  return db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar, u.accent_color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
    ORDER BY m.created_at DESC LIMIT ?
  `).all(channelId, limit).reverse();
}

export function createMessage({ id, channelId, userId, content }) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO messages (id, channel_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, channelId, userId, content, now);
  return db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar, u.accent_color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(id);
}

export function getMessage(id) {
  return db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar, u.accent_color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(id);
}

export function deleteMessage(id, userId) {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  if (!msg) return null;
  if (msg.user_id !== userId) return false;
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  return msg;
}

export function getServerMembers(serverId) {
  return db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar, u.status, u.custom_status, u.accent_color
    FROM users u JOIN server_members sm ON u.id = sm.user_id
    WHERE sm.server_id = ?
    ORDER BY u.display_name
  `).all(serverId);
}

export function refreshInviteCode(serverId) {
  const code = generateInviteCode();
  db.prepare('UPDATE servers SET invite_code = ? WHERE id = ?').run(code, serverId);
  return code;
}

export default db;
