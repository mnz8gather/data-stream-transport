interface WebSocketMessage {
  message: string;
}

const startWebSocket = (): void => {
  const ws = new WebSocket('ws://localhost:51888');

  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ message: 'Hello from client' }));
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    const data: WebSocketMessage = JSON.parse(event.data);
    console.log('Received WebSocket data:', data.message);
  };

  ws.onerror = (error: Event) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
  };
};

// 启动 WebSocket
startWebSocket();
