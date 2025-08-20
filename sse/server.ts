import { createServer } from 'http';

const server = createServer((req, res) => {
  if (req.url === '/sse') {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    // 每秒发送一条消息
    const interval = setInterval(() => {
      const data = JSON.stringify({
        message: `Hello at ${new Date().toLocaleString('default', {
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`,
      });
      res.write(`data: ${data}\n\n`);
    }, 1000);

    // 客户端断开连接时清理
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(51888, () => console.log('SSE server running on http://localhost:51888'));
