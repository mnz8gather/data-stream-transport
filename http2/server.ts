import { createSecureServer } from 'http2';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.resolve(__dirname, 'certs', 'key.pem');
const certPath = path.resolve(__dirname, 'certs', 'cert.pem');

const server = createSecureServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
});

server.on('stream', (stream, headers) => {
  if (headers[':path'] === '/http2-tls-stream') {
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
    const rawPath = (headers[':path'] || '/').toString();
    const reqPath = rawPath.split('?')[0];
    if (reqPath === '/' || reqPath === '/browser.html') {
      const filePath = path.resolve(__dirname, 'browser.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          stream.respond({ ':status': 500 });
          stream.end('Internal Server Error');
          return;
        }
        stream.respond({
          ':status': 200,
          'content-type': 'text/html; charset=utf-8',
        });
        stream.end(data);
      });
    } else {
      stream.respond({ ':status': 404 });
      stream.end();
    }
  }
});

server.listen(51888, () => console.log('HTTP/2 TLS server running on https://localhost:51888'));
