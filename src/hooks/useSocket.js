import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Map());

  useEffect(() => {
    if (!socket) {
      socket = io({ path: '/socket.io', autoConnect: false });
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const token = localStorage.getItem('discont_token');
    if (token && !socket.connected) {
      socket.connect();
      socket.emit('auth', token);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const on = (event, handler) => {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  };

  const emit = (event, data) => socket?.emit(event, data);

  return { socket, connected, on, emit };
}

export function getSocket() {
  return socket;
}
