import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (orgId) => {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token: localStorage.getItem('uems_token') },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
    if (orgId) socket.emit('join_org', orgId);
  });

  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
