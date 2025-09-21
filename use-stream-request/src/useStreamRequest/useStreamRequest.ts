import { message } from 'antd';
import { useCreation } from 'ahooks';
import { useCallback, useState } from 'react';
import { fetchStreamRequest } from './streamRequest/fetchStream';
import { axiosXHRStreamRequest } from './streamRequest/axiosXHRStream';
import type { Canceler } from 'axios';
import type { Service as FetchService } from './streamRequest/fetchStream';
import type { Service as AxiosXHRService } from './streamRequest/axiosXHRStream';
import type { AnyParams, RequestEvents, TransformStream } from './streamRequest/type';

type XGSSEFields = 'data';

type XGSSEOutput = Partial<Record<XGSSEFields, any>> & Record<string, any>;

type Status = 'pending' | 'success' | 'abort' | 'error' | (string & {});

interface Run<T extends AnyParams> {
  (...params: T): void;
}

interface FetchStreamRequestReturn<T extends AnyParams> {
  run: Run<T>;
  abort: (reason?: any) => void;
  status?: Status;
  content?: string;
}

interface AxiosXHRStreamRequestReturn<T extends AnyParams> {
  run: Run<T>;
  abort: Canceler;
  status?: Status;
  content?: string;
}

type AdapterName = 'axios-xhr' | 'fetch' | (string & {});

export function useStreamRequest<TParams extends AnyParams>(service: FetchService<XGSSEOutput, TParams>, adapter: 'fetch'): FetchStreamRequestReturn<TParams>;

export function useStreamRequest<TParams extends AnyParams>(
  service: AxiosXHRService<XGSSEOutput, TParams>,
  adapter?: 'axios-xhr'
): AxiosXHRStreamRequestReturn<TParams>;

export function useStreamRequest<TParams extends AnyParams>(
  service: FetchService<XGSSEOutput, TParams> | AxiosXHRService<XGSSEOutput, TParams>,
  adapter: AdapterName = 'axios-xhr',
  transformStream?: TransformStream<XGSSEOutput>
): FetchStreamRequestReturn<TParams> | AxiosXHRStreamRequestReturn<TParams> {
  const [status, setStatus] = useState<Status>();
  const [lines, setLines] = useState<Record<string, string>[]>([]);

  const requestInstance = useCreation(() => {
    const events: RequestEvents<XGSSEOutput> = {
      onError(error) {
        if (error?.name === 'AbortError') {
          setStatus('abort');
        } else {
          setStatus('error');
        }
      },
      onSuccess() {
        setStatus('success');
      },
      onUpdate(msg) {
        if (msg?.code) {
          message.error(msg?.message);
          return;
        }
        const data = msg?.data;
        setLines((pre) => [...pre, data]);
      },
    };
    if (adapter === 'fetch') {
      return fetchStreamRequest<XGSSEOutput, TParams>(service as FetchService<XGSSEOutput, TParams>, events, transformStream);
    }
    return axiosXHRStreamRequest<XGSSEOutput, TParams>(service as AxiosXHRService<XGSSEOutput, TParams>, events, transformStream);
    // [adapter, service]
    // 写了上面的依赖，要注意 service 保持不变，
    // 要不然一直生成新的 requestInstance
    // 导致 abort 失效
  }, []);

  const run = useCallback<Run<TParams>>((...params) => {
    setStatus('pending');
    setLines([]);
    requestInstance.request(...params).catch((error) => {
      console.error(error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = `${lines.join('\n')}`;

  return {
    run,
    abort: requestInstance.abort,
    status,
    content: content,
  };
}

/**
 *
 * 如果 requestInstance 的依赖是 [adapter, service] 且还是下面的使用方式就会导致 abort 失效
 * ```
 * const { content, run, abort } = useStreamRequest(({ signal }) => {
 *   return fetch('/py/sse', { headers: { accept: 'text/event-stream', 'content-type': 'application/json;charset=UTF-8' }, signal });
 * }, 'fetch');
 * ```
 */

/**
 * 这种使用方式不受依赖项影响
 * ```
 * const request = ({ signal }: any) => {
 *   return fetch('/py/sse', { headers: { accept: 'text/event-stream', 'content-type': 'application/json;charset=UTF-8' }, signal });
 * };
 *
 * function FetchStream() {
 *   const { content, run, abort } = useStreamRequest(request, 'fetch');
 *   // ...
 * }
 * ```
 */
