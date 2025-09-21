import axios from 'axios';
import { Button, Space, Tabs } from 'antd';
import { useStreamRequest } from './useStreamRequest/useStreamRequest';
import type { TabsProps } from 'antd';

const items: TabsProps['items'] = [
  {
    key: 'FetchStream',
    label: 'FetchStream',
    children: <FetchStream />,
  },
  {
    key: 'AxiosXHRStream',
    label: 'AxiosXHRStream',
    children: <AxiosXHRStream />,
  },
];

export function App() {
  return (
    <>
      <Tabs destroyOnHidden items={items} defaultActiveKey="FetchStream" />
    </>
  );
}

function FetchStream() {
  const { content, run, abort } = useStreamRequest(({ signal }) => {
    return fetch('/py/sse', { headers: { accept: 'text/event-stream', 'content-type': 'application/json;charset=UTF-8' }, signal });
  }, 'fetch');
  return (
    <>
      <Space>
        <Button onClick={run}>Run</Button>
        <Button
          onClick={() => {
            abort('fetch abort');
          }}
        >
          Abort
        </Button>
      </Space>
      <div>{content}</div>
    </>
  );
}

function AxiosXHRStream() {
  const { content, run, abort } = useStreamRequest(({ cancelToken, onDownloadProgress }) =>
    axios.get('/py/sse', {
      headers: { accept: 'text/event-stream' },
      cancelToken,
      onDownloadProgress: ({ event }) => onDownloadProgress(event),
    })
  );
  return (
    <>
      <Space>
        <Button onClick={run}>Run</Button>
        <Button
          onClick={() => {
            abort('axios xhr abort');
          }}
        >
          Abort
        </Button>
      </Space>
      <div>{content}</div>
    </>
  );
}
