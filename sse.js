const SSE = require('sse');

module.exports = (server) => {
    const sse = new SSE(server);
    
    // 1초마다 클라이언트에게 시간 보냄
    sse.on('connection', (client) => {
        setInterval(() => {
            client.send(Date.now().toString());
        }, 1000);
    })
}