import { BaseStreamRequest } from './baseStream';
import type { AnyParams, FetchStreamRequestRequiredParams, RequestEvents, TransformStream } from './type';

export type Service<TData, TParams extends AnyParams> = (requiredParams: FetchStreamRequestRequiredParams, ...args: TParams) => Promise<TData>;

class FetchStreamRequest<TOutput, TParams extends AnyParams> extends BaseStreamRequest<TOutput, TParams, Service<TOutput, TParams>> {
  private abortController;
  private requiredServiceParams: FetchStreamRequestRequiredParams;

  private constructor(service: Service<TOutput, TParams>, events?: RequestEvents<TOutput>, transformStream?: TransformStream<TOutput>) {
    super(service, events, transformStream);
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.requiredServiceParams = {
      signal,
    };
  }

  public static create<TOutput, TParams extends AnyParams>(
    service: Service<TOutput, TParams>,
    events?: RequestEvents<TOutput>,
    transformStream?: TransformStream<TOutput>
  ) {
    return new FetchStreamRequest<TOutput, TParams>(service, events, transformStream);
  }

  public async request(...params: TParams) {
    try {
      const response = await this.service(this.requiredServiceParams, ...params);
      await this.handleResponse(response);
    } catch (error) {
      const temp = error instanceof Error ? error : new Error('Unknown error!');
      this.events?.onError?.(temp);
      throw temp;
    }
  }

  public abort: typeof AbortController.prototype.abort = (reason?: any) => {
    this.abortController.abort(reason);
    // After aborting, create a new controller for the next request.
    this.abortController = new AbortController();
    this.requiredServiceParams.signal = this.abortController.signal;
  };
}

export const fetchStreamRequest = FetchStreamRequest.create;
