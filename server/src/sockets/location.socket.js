// server/src/sockets/location.socket.js
// Preserves the original V1 real-time location broadcast logic untouched.
// Event names/payload shape (send-location / receive-location / user-disconnected)
// are kept identical to the prototype so nothing on the client breaks.

export function registerLocationHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('send-location', (data) => {
      console.log(data);
      io.emit('receive-location', { id: socket.id, ...data });
    });

    socket.on('disconnect', () => {
      io.emit('user-disconnected', { id: socket.id });
      console.log('User disconnected', socket.id);
    });
  });
}