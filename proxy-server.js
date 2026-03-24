const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3131;

const server = http.createServer((clientReq, clientRes) => {
  // CORS 설정
  clientRes.setHeader('Access-Control-Allow-Origin', '*');
  clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, anthropic-version, anthropic-dangerous-direct-browser-access');

  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(200);
    clientRes.end();
    return;
  }

  if (clientReq.method === 'POST') {
    let body = '';
    clientReq.on('data', chunk => body += chunk);
    clientReq.on('end', () => {
      let targetHost, targetPath, options = {};

      if (clientReq.url.startsWith('/proxy/openai')) {
        targetHost = 'api.openai.com';
        targetPath = '/v1/chat/completions';
        options = {
          hostname: targetHost,
          path: targetPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': clientReq.headers['authorization']
          }
        };
      } else if (clientReq.url.startsWith('/proxy/gemini')) {
        targetHost = 'generativelanguage.googleapis.com';
        // /proxy/gemini 뒤의 파라미터를 그대로 전달 (API 키 등)
        targetPath = clientReq.url.replace('/proxy/gemini', '');
        options = {
          hostname: targetHost,
          path: targetPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };
      } else {
        clientRes.writeHead(404);
        clientRes.end('Not Found');
        return;
      }

      const proxyReq = https.request(options, (apiRes) => {
        // 스트리밍을 위한 헤더 설정 전달
        clientRes.writeHead(apiRes.statusCode, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': apiRes.headers['content-type'] || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        // 응답 스트림을 클라이언트로 파이핑 (Piping)
        apiRes.pipe(clientRes);
      });

      proxyReq.on('error', (e) => {
        console.error('Proxy Error:', e);
        clientRes.writeHead(500);
        clientRes.end(e.message);
      });

      // 바디 전송 및 요청 종료
      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    clientRes.writeHead(405);
    clientRes.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Proxy server is running at http://localhost:${PORT}`);
  console.log(`- OpenAI Proxy : http://localhost:${PORT}/proxy/openai`);
  console.log(`- Gemini Proxy : http://localhost:${PORT}/proxy/gemini/...`);
});