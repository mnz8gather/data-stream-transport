HTTP/2 Cleartext

HTTP/2 明文

浏览器/Node 的 `fetch` 不支持 h2c

client.ts 仅用于 Node 侧调试

## 启动

```
node --experimental-transform-types http2cleartext/server.ts

node --experimental-transform-types http2cleartext/client.ts
```
