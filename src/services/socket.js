import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export function connectSocket(userId) {
  if (socket?.connected) return socket;
  socket = io(API_BASE);
  socket.emit('join', userId);
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
