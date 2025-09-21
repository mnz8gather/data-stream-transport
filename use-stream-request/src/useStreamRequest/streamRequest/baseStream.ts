import XStream from './x-stream';
import type { AnyParams, RequestEvents, TransformStream } from './type';

// 防止基类被直接实例化
export abstract class BaseStreamRequest<TOutput, TParams extends AnyParams, TService> {
  protected service: TService;
  protected events?: RequestEvents<TOutput>;
  protected transformStream?: TransformStream<TOutput>;

  constructor(service: TService, events?: RequestEvents<TOutput>, transformStream?: TransformStream<TOutput>) {
    this.service = service;
    this.events = events;
    this.transformStream = transformStream;
  }

  private customResponseHandler = async (response: Response) => {
    const chunks: TOutput[] = [];
    const frequency = this.events?.onBatchUpdate?.[0];
    const batchUpdate = this.events?.onBatchUpdate?.[1];
    const isBatch = typeof frequency === 'number' && frequency !== 0;
    const buffer: TOutput[] = [];

    for await (const chunk of XStream({
      readableStream: response.body!,
      transformStream: this.transformStream,
    })) {
      chunks.push(chunk);
      this.events?.onUpdate?.(chunk);
      if (isBatch) {
        buffer.push(chunk);
        if (buffer.length === frequency) {
          batchUpdate?.([...buffer]);
          buffer.length = 0;
        }
      }
    }
    if (isBatch && buffer.length > 0) {
      batchUpdate?.([...buffer]);
    }

    this.events?.onSuccess?.(chunks);
  };

  private sseResponseHandler = async (response: Response) => {
    const chunks: TOutput[] = [];
    const stream = XStream<TOutput>({ readableStream: response.body! });
    const frequency = this.events?.onBatchUpdate?.[0];
    const batchUpdate = this.events?.onBatchUpdate?.[1];
    const isBatch = typeof frequency === 'number' && frequency !== 0;
    const buffer: TOutput[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
      this.events?.onUpdate?.(chunk);
      if (isBatch) {
        buffer.push(chunk);
        if (buffer.length === frequency) {
          batchUpdate?.([...buffer]);
          buffer.length = 0;
        }
      }
    }
    if (isBatch && buffer.length > 0) {
      batchUpdate?.([...buffer]);
    }
    this.events?.onSuccess?.(chunks);
  };

  private jsonResponseHandler = async (response: Response) => {
    const chunk: TOutput = await response.json();
    this.events?.onUpdate?.(chunk);
    this.events?.onBatchUpdate?.[1]?.([chunk]);
    this.events?.onSuccess?.([chunk]);
  };

  protected async handleResponse(response: any) {
    if (this.transformStream && response instanceof Response) {
      await this.customResponseHandler(response);
      return;
    }
    if (response instanceof Response) {
      const contentType = response.headers.get('content-type') || '';
      const mimeType = contentType.split(';')[0].trim();
      switch (mimeType) {
        // SSE
        case 'text/event-stream':
          await this.sseResponseHandler(response);
          break;
        // JSON
        case 'application/json':
          await this.jsonResponseHandler(response);
          break;
        default:
          throw new Error(`The response content-type: ${contentType} is not support!`);
      }
    }
  }

  // 强制子类实现特定方法
  public abstract request(...params: TParams): Promise<void>;
  public abstract abort(...args: any[]): void;
}
