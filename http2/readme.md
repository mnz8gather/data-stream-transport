HTTP/2 TLS

Node 的 `fetch` 不支持使用

## mkcert

mkcert localhost 127.0.0.1

生成证书后改名放在 certs 下

## 启动

```
node --experimental-transform-types http2/server.ts
node --experimental-transform-types http2/client.ts
```

## 浏览器访问

https://localhost:51888/http2-tls-stream （会看到浏览器提示不受信证书，手动信任后可查看响应）

https://localhost:51888/

https://localhost:51888/browser.html
