// test-device-socket.mjs — temporary, delete after testing
import { io } from 'socket.io-client';

const DEVICE_KEY = 'dev_f0a7abc8a05f86af32cc6118609ac52dcc9ba84f';

const socket = io('http://localhost:5000', {
  auth: { deviceKey: DEVICE_KEY },
});

socket.on('connect', () => {
  console.log('Connected as device, socket id:', socket.id);
  socket.emit('send-location', { latitude: 25.4610, longitude: 68.7183 });
  setTimeout(() => {
    socket.emit('send-location', { latitude: 25.4615, longitude: 68.7190 });
  }, 3000);
});

socket.on('receive-location', (data) => {
  console.log('Broadcast received:', data);
});