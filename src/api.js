const API = '/api';

function headers(isJson = true) {
  const token = localStorage.getItem('discont_token');
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  // Determine if the payload is JSON based on whether options.body exists
  const isJsonPayload = options.body ? true : false;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...headers(isJsonPayload),   // Inject standard JSON and Auth headers
      ...(options.headers || {}),  // Deep merge any specific headers passed into the request call
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (username, displayName, avatar) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, displayName, avatar }) }),
  login: (username) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/me'),
  updateMe: (data) => request('/me', { method: 'PATCH', body: JSON.stringify(data) }),
  upload: (type, image) =>
    request('/upload', { method: 'POST', body: JSON.stringify({ type, image }) }),
  getServers: () => request('/servers'),
  createServer: (name, icon) =>
    request('/servers', { method: 'POST', body: JSON.stringify({ name, icon }) }),
  updateServer: (id, data) =>
    request(`/servers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  joinServer: (code) => request(`/servers/join/${code}`, { method: 'POST' }),
  getServer: (id) => request(`/servers/${id}`),
  refreshInvite: (id) => request(`/servers/${id}/invite/refresh`, { method: 'POST' }),
  getLayout: (serverId) => request(`/servers/${serverId}/layout`),
  getChannels: (serverId) => request(`/servers/${serverId}/channels`),
  createCategory: (serverId, name) =>
    request(`/servers/${serverId}/categories`, { method: 'POST', body: JSON.stringify({ name }) }),
  createChannel: (serverId, name, type, categoryId) =>
    request(`/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name, type, categoryId }),
    }),
  updateChannel: (id, name) =>
    request(`/channels/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteChannel: (id) =>
    request(`/channels/${id}`, { method: 'DELETE' }),
  getMembers: (serverId) => request(`/servers/${serverId}/members`),
  getMessages: (channelId, before) =>
    request(`/channels/${channelId}/messages${before ? `?before=${before}` : ''}`),
  deleteMessage: (id) => request(`/messages/${id}`, { method: 'DELETE' }),
  getVoiceParticipants: (channelId) => request(`/voice/${channelId}/participants`),
};