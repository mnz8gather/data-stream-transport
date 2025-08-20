import { createServer } from 'http';

const server = createServer((req, res) => {
  if (req.url === '/http-stream') {
    // 设置流式响应头
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    });

    // 模拟流式数据
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 5) {
        clearInterval(interval);
        res.end();
        return;
      }
      const data = JSON.stringify({
        message: `Chunk ${count} at ${new Date().toLocaleString('default', {
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`,
      });
      res.write(data + '\n');
      count++;
    }, 1000);

    // 客户端断开连接
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(51888, () => console.log('HTTP stream server running on http://localhost:51888'));
