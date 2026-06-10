import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let socket = null;
let authReady = false;
let authResolvers = [];

function resolveAuth() {
  authReady = true;
  authResolvers.forEach(r => r());
  authResolvers = [];
}

export function waitForSocketAuth() {
  if (authReady && socket?.connected) return Promise.resolve();
  return new Promise(resolve => {
    authResolvers.push(resolve);
    if (socket?.connected && !authReady) {
      const token = localStorage.getItem('discont_token');
      if (token) socket.emit('auth', token);
    }
  });
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [authed, setAuthed] = useState(false);
  const listeners = useRef(new Map());

  useEffect(() => {
    if (!socket) {
      socket = io({ path: '/socket.io', autoConnect: false });
    }

    const onConnect = () => {
      setConnected(true);
      const token = localStorage.getItem('discont_token');
      if (token) socket.emit('auth', token);
    };
    const onDisconnect = () => {
      setConnected(false);
      setAuthed(false);
      authReady = false;
    };
    const onAuthOk = () => {
      setAuthed(true);
      resolveAuth();
    };
    const onAuthError = () => {
      authReady = false;
      setAuthed(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('auth:ok', onAuthOk);
    socket.on('auth:error', onAuthError);

    const token = localStorage.getItem('discont_token');
    if (token && !socket.connected) {
      socket.connect();
    } else if (token && socket.connected && !authReady) {
      socket.emit('auth', token);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('auth:ok', onAuthOk);
      socket.off('auth:error', onAuthError);
    };
  }, []);

  const on = (event, handler) => {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  };

  const emit = (event, data) => socket?.emit(event, data);

  return { socket, connected, authed, on, emit };
}

export function getSocket() {
  return socket;
}
