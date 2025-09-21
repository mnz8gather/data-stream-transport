import type { CancelToken } from 'axios';
import type { XStreamOptions } from './x-stream';

export type AnyParams = any[];

export type TransformStream<Output> = XStreamOptions<Output>['transformStream'];

export interface RequestEvents<Output> {
  onSuccess?: (chunks: Output[]) => void;
  onError?: (error: Error) => void;
  onUpdate?: (chunk: Output) => void;
  onBatchUpdate?: [number, (chunks: Output[]) => void];
}

export interface FetchStreamRequestRequiredParams {
  signal: AbortSignal;
}

export interface AxiosXHRStreamRequestRequiredParams {
  cancelToken: CancelToken;
  onDownloadProgress: (e: ProgressEvent) => void;
}
