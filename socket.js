const SocketIO = require('socket.io');

module.exports = (server, app) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io);
  io.on('connection', (socket) => { // 웹 소켓 연결 시
    const req = socket.request;
    const { headers: { referer } } = req;
    const roomId = new URL(referer).pathname.split('/').at(-1);
    socket.join(roomId); // 방 안에서 실시간으로 채팅과 경매를 할 수 있게끔 해줌
    socket.on('disconnect', () => {
      socket.leave(roomId);
    });
  });
};