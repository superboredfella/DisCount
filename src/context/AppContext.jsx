import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import { applySettings, DEFAULT_SETTINGS } from '../styles/themes';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [voiceState, setVoiceState] = useState({});
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('discont_settings') || '{}') };
    } catch { return DEFAULT_SETTINGS; }
  });
  const [panel, setPanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { on, emit } = useSocket();

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem('discont_settings', JSON.stringify(settings));
  }, [settings]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('discont_token');
    if (!token) { setLoading(false); return; }
    try {
      const u = await api.me();
      setUser(u);
      if (u.clientSettings && Object.keys(u.clientSettings).length) {
        setSettings(s => ({ ...s, ...u.clientSettings }));
      }
      const srv = await api.getServers();
      setServers(srv);
    } catch {
      localStorage.removeItem('discont_token');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (username, displayName, isRegister, avatar) => {
    const data = isRegister
      ? await api.register(username, displayName, avatar)
      : await api.login(username);
    localStorage.setItem('discont_token', data.token);
    setUser(data.user);
    const srv = await api.getServers();
    setServers(srv);
    const { getSocket } = await import('../hooks/useSocket');
    const s = getSocket();
    if (s) { s.connect(); s.emit('auth', data.token); }
    return data;
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem('discont_token');
    setUser(null);
    setServers([]);
    setActiveServer(null);
    setActiveChannel(null);
    setCategories([]);
    setChannels([]);
    setVoiceState({});
  };

  const updateProfile = async (data) => {
    const updated = await api.updateMe(data);
    setUser(updated);
  };

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    if (user) {
      await api.updateMe({ clientSettings: merged });
    }
  };

  const loadLayout = async (serverId) => {
    const layout = await api.getLayout(serverId);
    setCategories(layout.categories);
    setChannels(layout.channels);
    return layout;
  };

  const selectServer = async (server) => {
    if (activeServer?.id) emit('server:leave', activeServer.id);
    if (activeChannel?.id) emit('channel:leave', activeChannel.id);
    setActiveServer(server);
    setActiveChannel(null);
    setMessages([]);
    setVoiceState({});
    if (server) {
      emit('server:join', server.id);
      const [layout, mem] = await Promise.all([
        loadLayout(server.id),
        api.getMembers(server.id),
      ]);
      setMembers(mem);
      const voiceChannels = layout.channels.filter(c => c.type === 'voice');
      const voiceEntries = await Promise.all(
        voiceChannels.map(async ch => [ch.id, await api.getVoiceParticipants(ch.id)])
      );
      setVoiceState(Object.fromEntries(voiceEntries));
      const textCh = layout.channels.find(c => c.type === 'text');
      if (textCh) selectChannel(textCh, server);
    } else {
      setCategories([]);
      setChannels([]);
      setMembers([]);
    }
  };

  const selectChannel = async (channel, serverOverride) => {
    if (activeChannel?.id) emit('channel:leave', activeChannel.id);
    setActiveChannel(channel);
    setMessages([]);
    if (channel) {
      if (channel.type !== 'voice') {
        emit('channel:join', channel.id);
        const msgs = await api.getMessages(channel.id);
        setMessages(msgs);
      }
    }
  };

  const createServer = async (name, icon) => {
    const server = await api.createServer(name, icon);
    setServers(s => [...s, server]);
    selectServer(server);
    return server;
  };

  const updateServer = async (id, data) => {
    const updated = await api.updateServer(id, data);
    setServers(s => s.map(x => x.id === id ? updated : x));
    if (activeServer?.id === id) setActiveServer(updated);
    return updated;
  };

  const joinServer = async (code) => {
    const server = await api.joinServer(code);
    if (!servers.find(s => s.id === server.id)) {
      setServers(s => [...s, server]);
    }
    selectServer(server);
    return server;
  };

  const createCategory = async (name) => {
    await api.createCategory(activeServer.id, name);
    const layout = await loadLayout(activeServer.id);
    return layout.categories.at(-1);
  };

  const createChannel = async (name, type = 'text', categoryId = null) => {
    const channel = await api.createChannel(activeServer.id, name, type, categoryId);
    await loadLayout(activeServer.id);
    return channel;
  };

  const sendMessage = (content) => {
    if (!activeChannel || activeChannel.type === 'voice') return;
    emit('message:send', { channelId: activeChannel.id, content });
  };

  useEffect(() => {
    const unsubs = [
      on('message:new', (msg) => {
        setMessages(m => {
          if (m.find(x => x.id === msg.id)) return m;
          if (activeChannel && msg.channel_id === activeChannel.id) return [...m, msg];
          return m;
        });
      }),
      on('channel:create', (ch) => {
        if (activeServer && ch.server_id === activeServer.id) {
          setChannels(c => c.find(x => x.id === ch.id) ? c : [...c, ch]);
        }
      }),
      on('category:create', (cat) => {
        if (activeServer && cat.server_id === activeServer.id) {
          setCategories(c => c.find(x => x.id === cat.id) ? c : [...c, cat]);
        }
      }),
      on('server:update', (srv) => {
        setServers(s => s.map(x => x.id === srv.id ? srv : x));
        if (activeServer?.id === srv.id) setActiveServer(srv);
      }),
      on('voice:state', ({ channelId, participants }) => {
        setVoiceState(v => ({ ...v, [channelId]: participants }));
      }),
      on('user:update', (u) => {
        setMembers(m => m.map(x => x.id === u.id ? { ...x, ...u } : x));
        if (user?.id === u.id) setUser(u);
      }),
    ];
    return () => unsubs.forEach(fn => fn?.());
  }, [on, activeChannel, activeServer, user]);

  const value = {
    user, servers, activeServer, activeChannel, categories, channels, members, messages,
    voiceState, settings, panel, loading,
    setPanel, login, logout, updateProfile, updateSettings,
    selectServer, selectChannel, createServer, updateServer, joinServer,
    createCategory, createChannel, sendMessage, setMessages, emit,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
