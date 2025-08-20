import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const server = createServer();
const wss = new WebSocketServer({ server });

interface WebSocketMessage {
  message: string;
}

wss.on('connection', (ws) => {
  console.log('WebSocket Client connected');

  // 每秒发送消息
  const interval = setInterval(() => {
    const data: WebSocketMessage = {
      message: `Hello at ${new Date().toLocaleString('default', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
    };
    ws.send(JSON.stringify(data));
  }, 1000);

  // 接收客户端消息
  ws.on('message', (data: Buffer) => {
    console.log('WebSocket Received:', data.toString());
  });

  // 断开连接
  ws.on('close', () => {
    console.log('WebSocket Client disconnected');
    clearInterval(interval);
  });
});

server.listen(51888, () => console.log('WebSocket server running on ws://localhost:51888'));
