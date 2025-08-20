// Do NOT use in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { connect } from 'node:http2';
import type { ClientHttp2Stream, IncomingHttpHeaders } from 'node:http2';

const HOST = 'https://localhost:51888';
const PATH = '/http2-tls-stream';

function run() {
  const client = connect(HOST);

  client.on('error', (err) => {
    console.error('HTTP/2 TLS client error:', err);
  });

  client.on('connect', () => {
    // Create a request on the same session (h2c)
    const req: ClientHttp2Stream = client.request({
      ':method': 'GET',
      ':path': PATH,
      accept: 'application/json',
    });

    req.setEncoding('utf8');

    req.on('response', (headers: IncomingHttpHeaders) => {
      const status = headers[':status'];
      console.log('HTTP/2 TLS Response status:', status);
    });

    let buffer = '';

    req.on('data', (chunk: string) => {
      buffer += chunk;
      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const data = JSON.parse(line) as { message: string };
          console.log('Received HTTP/2 TLS stream data:', data.message);
        } catch (e) {
          console.error('HTTP/2 TLS Parse error:', e, 'line:', line);
        }
      }
    });

    req.on('end', () => {
      console.log('HTTP/2 TLS stream ended');
      client.close();
    });

    req.on('error', (err) => {
      console.error('HTTP/2 TLS Request error:', err);
      client.close();
    });

    req.end();
  });
}

run();
