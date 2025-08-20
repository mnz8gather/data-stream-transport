import { connect } from 'http2';

const client = connect('http://localhost:51888');

client.on('connect', () => {
  const req = client.request({
    ':method': 'GET',
    ':path': '/http2-cleartext-stream',
    accept: 'application/json',
  });

  let buffer = '';

  req.on('data', (chunk) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const data = JSON.parse(line) as { message: string };
        console.log('Received HTTP/2 Cleartext stream data:', data.message);
      } catch (e) {
        console.error('HTTP/2 Cleartext Parse error:', e, 'line:', line);
      }
    }
  });

  req.on('end', () => {
    console.log('HTTP/2 Cleartext stream ended');
    client.close();
  });

  req.end();
});
