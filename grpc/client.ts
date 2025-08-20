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

const client = new streaming.StreamService('localhost:51888', grpc.credentials.createInsecure());

const startGrpcStream = (): void => {
  const call = client.serverStream({ client_id: 'client-1' });

  call.on('data', (response: StreamResponse) => {
    console.log('Received gRPC stream data:', response.message);
  });

  call.on('end', () => {
    console.log('gRPC stream ended');
  });

  call.on('error', (error: Error) => {
    console.error('gRPC stream error:', error);
  });
};

// 启动 gRPC 流
startGrpcStream();
