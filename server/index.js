import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as db from './db.js';
import { saveImage } from './upload.js';
import { UPLOAD_ROOT, ensureDataDirs } from './paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
ensureDataDirs();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// voiceRooms: channelId -> Map<userId, { socketId, muted, deafened, displayName, avatar, accentColor }>
const voiceRooms = new Map();
// socketId -> { channelId, userId }
const socketVoice = new Map();

app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT));

function formatUser(user) {
  if (!user) return null;
  let clientSettings = {};
  try { clientSettings = JSON.parse(user.client_settings || '{}'); } catch {}
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatar: user.avatar,
    bannerColor: user.banner_color,
    bannerImage: user.banner_image || '',
    bio: user.bio,
    status: user.status,
    customStatus: user.custom_status,
    accentColor: user.accent_color,
    clientSettings,
  };
}

function formatServer(server) {
  if (!server) return null;
  return {
    id: server.id,
    name: server.name,
    icon: server.icon,
    ownerId: server.owner_id,
    inviteCode: server.invite_code,
  };
}

function getVoiceParticipants(channelId) {
  const room = voiceRooms.get(channelId);
  if (!room) return [];
  return [...room.entries()].map(([userId, data]) => ({
    userId,
    muted: data.muted,
    deafened: data.deafened,
    displayName: data.displayName,
    avatar: data.avatar,
    accentColor: data.accentColor,
  }));
}

function leaveVoice(socket) {
  const info = socketVoice.get(socket.id);
  if (!info) return;
  const { channelId, userId } = info;
  const room = voiceRooms.get(channelId);
  if (room) {
    room.delete(userId);
    if (room.size === 0) voiceRooms.delete(channelId);
    else io.to(`voice:${channelId}`).emit('voice:participants', getVoiceParticipants(channelId));
    const participants = getVoiceParticipants(channelId);
    const ch = db.getChannel(channelId);
    if (ch) io.to(`server:${ch.server_id}`).emit('voice:state', { channelId, participants });
  } else {
    const ch = db.getChannel(channelId);
    if (ch) io.to(`server:${ch.server_id}`).emit('voice:state', { channelId, participants: [] });
  }
  socket.leave(`voice:${channelId}`);
  socketVoice.delete(socket.id);
}

// Auth
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, avatar } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }
  if (db.getUserByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const id = uuid();
  const user = db.createUser({ id, username, displayName, avatar });
  const token = uuid();
  db.createSession(token, id);
  res.json({ token, user: formatUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  const user = db.getUserByUsername(username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const token = uuid();
  db.createSession(token, user.id);
  res.json({ token, user: formatUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) db.deleteSession(token);
  res.json({ ok: true });
});

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = db.getSessionUser(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
}

app.get('/api/me', auth, (req, res) => {
  res.json(formatUser(db.getUser(req.userId)));
});

app.patch('/api/me', auth, (req, res) => {
  const user = db.updateUser(req.userId, req.body);
  const formatted = formatUser(user);
  io.emit('user:update', formatted);
  res.json(formatted);
});

app.post('/api/upload', auth, (req, res) => {
  try {
    const { type, image } = req.body;
    const url = saveImage(type, image);
    res.json({ url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Servers
app.get('/api/servers', auth, (req, res) => {
  const servers = db.getUserServers(req.userId).map(formatServer);
  res.json(servers);
});

app.post('/api/servers', auth, (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Server name required' });
  const server = db.createServer({ id: uuid(), name, icon, ownerId: req.userId });
  res.json(formatServer(server));
});

app.patch('/api/servers/:id', auth, (req, res) => {
  const server = db.getServer(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const updated = db.updateServer(req.params.id, req.body);
  io.to(`server:${req.params.id}`).emit('server:update', formatServer(updated));
  res.json(formatServer(updated));
});

app.post('/api/servers/join/:code', auth, (req, res) => {
  const server = db.getServerByInvite(req.params.code);
  if (!server) return res.status(404).json({ error: 'Invalid invite code' });
  db.joinServer(server.id, req.userId);
  res.json(formatServer(server));
});

app.get('/api/servers/:id', auth, (req, res) => {
  const server = db.getServer(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json(formatServer(server));
});

app.post('/api/servers/:id/invite/refresh', auth, (req, res) => {
  const server = db.getServer(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.owner_id !== req.userId) return res.status(403).json({ error: 'Only owner can refresh invite' });
  const code = db.refreshInviteCode(server.id);
  res.json({ inviteCode: code });
});

app.get('/api/servers/:id/layout', auth, (req, res) => {
  res.json(db.getServerLayout(req.params.id));
});

app.get('/api/servers/:id/channels', auth, (req, res) => {
  res.json(db.getServerChannels(req.params.id));
});

app.post('/api/servers/:id/categories', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  const category = db.createCategory({ id: uuid(), serverId: req.params.id, name });
  io.to(`server:${req.params.id}`).emit('category:create', category);
  res.json(category);
});

app.post('/api/servers/:id/channels', auth, (req, res) => {
  const { name, type, categoryId } = req.body;
  if (!name) return res.status(400).json({ error: 'Channel name required' });
  const channel = db.createChannel({
    id: uuid(),
    serverId: req.params.id,
    name,
    type: type || 'text',
    categoryId: categoryId || null,
  });
  io.to(`server:${req.params.id}`).emit('channel:create', channel);
  res.json(channel);
});

app.get('/api/servers/:id/members', auth, (req, res) => {
  res.json(db.getServerMembers(req.params.id));
});

app.get('/api/voice/:channelId/participants', auth, (req, res) => {
  res.json(getVoiceParticipants(req.params.channelId));
});

// Messages
app.get('/api/channels/:id/messages', auth, (req, res) => {
  const { before, limit } = req.query;
  res.json(db.getChannelMessages(req.params.id, limit ? +limit : 50, before ? +before : null));
});

// Serve production build
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// WebSocket
io.on('connection', (socket) => {
  let userId = null;

  socket.on('auth', (token) => {
    userId = db.getSessionUser(token);
    if (!userId) return socket.emit('auth:error', 'Invalid token');
    socket.userId = userId;
    socket.join(`user:${userId}`);
    db.updateUser(userId, { status: 'online' });
    const user = formatUser(db.getUser(userId));
    io.emit('user:update', user);
    socket.emit('auth:ok', user);
  });

  socket.on('server:join', (serverId) => {
    socket.join(`server:${serverId}`);
  });

  socket.on('server:leave', (serverId) => {
    socket.leave(`server:${serverId}`);
  });

  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('message:send', ({ channelId, content }) => {
    if (!userId || !content?.trim()) return;
    const msg = db.createMessage({ id: uuid(), channelId, userId, content: content.trim() });
    io.to(`channel:${channelId}`).emit('message:new', msg);
  });

  socket.on('typing:start', ({ channelId }) => {
    if (!userId) return;
    const user = db.getUser(userId);
    socket.to(`channel:${channelId}`).emit('typing:start', {
      userId, displayName: user.display_name,
    });
  });

  socket.on('typing:stop', ({ channelId }) => {
    if (!userId) return;
    socket.to(`channel:${channelId}`).emit('typing:stop', { userId });
  });

  socket.on('status:update', (status) => {
    if (!userId) return;
    db.updateUser(userId, { status });
    io.emit('user:update', formatUser(db.getUser(userId)));
  });

  // Voice
  socket.on('voice:join', ({ channelId }) => {
    if (!userId) return;
    leaveVoice(socket);

    const user = db.getUser(userId);
    if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
    const room = voiceRooms.get(channelId);
    room.set(userId, {
      socketId: socket.id,
      muted: false,
      deafened: false,
      displayName: user.display_name,
      avatar: user.avatar,
      accentColor: user.accent_color,
    });
    socketVoice.set(socket.id, { channelId, userId });
    socket.join(`voice:${channelId}`);

    const participants = getVoiceParticipants(channelId);
    socket.emit('voice:participants', participants);
    socket.to(`voice:${channelId}`).emit('voice:user-joined', {
      userId,
      displayName: user.display_name,
      avatar: user.avatar,
      accentColor: user.accent_color,
    });
    socket.to(`voice:${channelId}`).emit('voice:participants', participants);
    socket.to(`voice:${channelId}`).emit('voice:state', { channelId, participants });
    const channel = db.getChannel(channelId);
    if (channel) {
      io.to(`server:${channel.server_id}`).emit('voice:state', { channelId, participants });
    }
  });

  socket.on('voice:leave', () => {
    leaveVoice(socket);
  });

  socket.on('voice:mute', ({ muted }) => {
    const info = socketVoice.get(socket.id);
    if (!info) return;
    const room = voiceRooms.get(info.channelId);
    const entry = room?.get(info.userId);
    if (entry) {
      entry.muted = muted;
      const participants = getVoiceParticipants(info.channelId);
      io.to(`voice:${info.channelId}`).emit('voice:participants', participants);
      const ch = db.getChannel(info.channelId);
      if (ch) io.to(`server:${ch.server_id}`).emit('voice:state', { channelId: info.channelId, participants });
    }
  });

  socket.on('voice:deafen', ({ deafened }) => {
    const info = socketVoice.get(socket.id);
    if (!info) return;
    const room = voiceRooms.get(info.channelId);
    const entry = room?.get(info.userId);
    if (entry) {
      entry.deafened = deafened;
      const participants = getVoiceParticipants(info.channelId);
      io.to(`voice:${info.channelId}`).emit('voice:participants', participants);
      const ch = db.getChannel(info.channelId);
      if (ch) io.to(`server:${ch.server_id}`).emit('voice:state', { channelId: info.channelId, participants });
    }
  });

  socket.on('voice:signal', ({ channelId, targetUserId, signal }) => {
    const room = voiceRooms.get(channelId);
    const target = room?.get(targetUserId);
    if (target) {
      io.to(target.socketId).emit('voice:signal', { fromUserId: userId, signal });
    }
  });

  socket.on('disconnect', () => {
    leaveVoice(socket);
    if (!userId) return;
    db.updateUser(userId, { status: 'offline' });
    io.emit('user:update', formatUser(db.getUser(userId)));
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Discont server running on http://${HOST}:${PORT}`);
});
