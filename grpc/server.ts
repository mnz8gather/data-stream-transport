import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = join(__dirname, 'stream.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const streaming: any = protoDescriptor.streaming;

interface StreamRequest {
  client_id: string;
}

interface StreamResponse {
  message: string;
}

function serverStream(call: grpc.ServerWritableStream<StreamRequest, StreamResponse>): void {
  console.log(`gRPC Client connected: ${call.request.client_id}`);

  // 每秒发送消息
  const interval = setInterval(() => {
    call.write({
      message: `Hello from server at ${new Date().toLocaleString('default', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
    });
  }, 1000);

  // 客户端断开连接
  call.on('end', () => {
    clearInterval(interval);
    call.end();
    console.log('gRPC Client disconnected');
  });
}

const server = new grpc.Server();
server.addService(streaming.StreamService.service, { serverStream });

server.bindAsync('localhost:51888', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running on localhost:51888');
});
