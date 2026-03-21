import { io } from 'socket.io-client';

// Use production Render URL here in deployment, or local IP for testing.
// IMPORTANT: Keep the IP as exactly your machine's IP (e.g. 192.168.1.5) not 127.0.0.1 for mobile testing
const SOCKET_URL = 'http://192.168.1.5:4000'; // Replace with backend IP / Prod URL

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually upon successful auth
  reconnection: true,     // Crucial for Offline Support
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('✅ Connected to live tracking server');
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ Disconnected from server:', reason);
});
