import { createServer } from 'http2';

const server = createServer();

server.on('stream', (stream, headers) => {
  if (headers[':path'] === '/http2-cleartext-stream') {
    // 设置响应头
    stream.respond({
      ':status': 200,
      'content-type': 'application/json',
    });

    // 模拟流式数据
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 5) {
        clearInterval(interval);
        stream.end();
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
      stream.write(data + '\n');
      count++;
    }, 1000);

    // 客户端断开连接
    stream.on('close', () => {
      clearInterval(interval);
    });
  } else {
    stream.respond({ ':status': 404 });
    stream.end();
  }
});

server.listen(51888, () => console.log('HTTP/2 Cleartext server running on http://localhost:51888'));
