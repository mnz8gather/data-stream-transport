import axios from 'axios';
import { BaseStreamRequest } from './baseStream';
import type { Canceler } from 'axios';
import type { AnyParams, AxiosXHRStreamRequestRequiredParams, RequestEvents, TransformStream } from './type';

const CancelToken = axios.CancelToken;

export type Service<TData, TParams extends AnyParams> = (requiredParams: AxiosXHRStreamRequestRequiredParams, ...args: TParams) => Promise<TData>;

class AxiosXHRStreamRequest<TOutput, TParams extends AnyParams> extends BaseStreamRequest<TOutput, TParams, Service<TOutput, TParams>> {
  private cancelTokenSource;
  private requiredServiceParams: Pick<AxiosXHRStreamRequestRequiredParams, 'cancelToken'>;

  private constructor(service: Service<TOutput, TParams>, events?: RequestEvents<TOutput>, transformStream?: TransformStream<TOutput>) {
    super(service, events, transformStream);
    this.cancelTokenSource = CancelToken.source();
    const cancelToken = this.cancelTokenSource.token;
    this.requiredServiceParams = {
      cancelToken,
    };
  }

  public static create<TOutput, TParams extends AnyParams>(
    service: Service<TOutput, TParams>,
    events?: RequestEvents<TOutput>,
    transformStream?: TransformStream<TOutput>
  ) {
    return new AxiosXHRStreamRequest<TOutput, TParams>(service, events, transformStream);
  }

  public async request(...params: TParams) {
    // fetch API 的设计原生支持流式响应（返回一个带有 ReadableStream 的 Response 对象），
    // 而传统的 axios（基于 XMLHttpRequest）并不直接返回流，
    // 而是通过 onDownloadProgress 事件来渐进式地获取数据。
    // 利用 axios 的 onDownloadProgress 配置，
    // 手动创建一个 ReadableStream，
    // 然后用这个流来构建一个 Response 对象。
    // 这样，AxiosXHRStreamRequest 就能和 fetchStreamRequest 一样，
    // 向基类的 handleResponse 方法提供一个标准化的输入。
    try {
      // 它的核心作用是记录上一次 onDownloadProgress 事件触发时，我们已经处理过的数据的末尾位置。
      // axios 的 onDownloadProgress 事件有一个特点：每次触发时，
      // 它提供的 responseText 都包含了从请求开始到当前时刻接收到的全部数据，
      // 而不是仅仅包含新接收到的增量数据。
      // 避免重复处理： 如果我们不使用 lastIndex，
      // 每次事件触发时都直接处理整个 responseText，
      // 那么我们就会一遍又一遍地重复处理已经处理过的数据。
      let lastIndex = 0;
      // 手动创建 ReadableStream
      const stream = new ReadableStream({
        start: (controller) => {
          this.service(
            {
              ...this.requiredServiceParams,
              // 注入 onDownloadProgress 回调
              onDownloadProgress: (event: ProgressEvent) => {
                const { responseText } = event.target as XMLHttpRequest;
                const chunk = responseText.slice(lastIndex);
                lastIndex = responseText.length;
                // 数据“投喂”给流
                //
                // 使用 new TextEncoder().encode(chunk) 的原因是：
                // ReadableStream 的 controller.enqueue() 方法期望接收的是 Uint8Array 类型的数据（即字节流），
                // 而不是 JavaScript 的字符串（string）。
                //
                // 数据源的格式：在 onDownloadProgress 回调中，
                // 我们从 XMLHttpRequest 的 responseText 中截取出的 chunk 是一个标准的 JavaScript 字符串。
                //
                // 流的目标格式： Web API 中的流（Streams API）被设计为一种通用的数据传输机制，
                // 它们不仅可以传输文本，还可以传输图片、视频等任何二进制数据。
                // 因此，流在底层处理的是字节（bytes），而不是特定于语言的字符串。
                // Uint8Array 正是 JavaScript 中用来表示字节数组的标准类型。
                //
                // 编码转换的桥梁： TextEncoder 就是连接这两者之间的桥梁。它扮演着“编码器”的角色，
                // 其 encode() 方法可以将一个 JavaScript 字符串按照 UTF-8 编码规则，
                // 转换成一个 Uint8Array 字节数组。
                controller.enqueue(new TextEncoder().encode(chunk));
              },
            },
            ...params
          )
            .then(() => {
              controller.close();
            })
            .catch((error) => {
              controller.error(error);
            });
        },
      });

      // 模拟 Response 对象
      // 用这个正在被持续填充数据的 ReadableStream 作为 body，创建了一个标准的 Response 对象，
      const response = new Response(stream, {
        // 并手动设置了 Content-Type 头信息。
        headers: { 'Content-Type': 'text/event-stream' },
      });

      await this.handleResponse(response);
    } catch (error) {
      const temp = error instanceof Error ? error : new Error('Unknown error!');
      this.events?.onError?.(temp);
      throw temp;
    }
  }

  public abort: Canceler = (message?: string) => {
    this.cancelTokenSource.cancel(message);
  };
}

export const axiosXHRStreamRequest = AxiosXHRStreamRequest.create;
