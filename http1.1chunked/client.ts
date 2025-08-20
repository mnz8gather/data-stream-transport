interface StreamData {
  message: string;
}

const startHttpStream = async (): Promise<void> => {
  const response = await fetch('http://localhost:51888/http-stream');
  if (!response.body) {
    console.error('No response body');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('HTTP stream ended');
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      try {
        const data: StreamData = JSON.parse(line);
        console.log('Received HTTP stream data:', data.message);
      } catch (error) {
        console.error('Parse error:', error);
      }
    }
  }
};

// 启动 HTTP 流
startHttpStream();
