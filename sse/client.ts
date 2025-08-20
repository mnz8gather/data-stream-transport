import { EventSource } from 'eventsource';

interface SSEData {
  message: string;
}

const startSSE = (): void => {
  const source = new EventSource('http://localhost:51888/sse');

  source.onmessage = (event: MessageEvent<string>) => {
    const data: SSEData = JSON.parse(event.data);
    console.log('Received SSE data:', data.message);
  };

  source.onerror = () => {
    console.error('SSE error occurred');
    source.close();
  };
};

// 启动 SSE
startSSE();
