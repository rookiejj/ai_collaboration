/**
 * AI Collaboration — Local CORS Proxy
 * 
 * 실행: node proxy-server.js
 * 포트: 3131
 * 
 * 이 서버는 브라우저의 CORS 제한을 우회하기 위해
 * OpenAI / Gemini API 요청을 중계합니다.
 */

const http = require('http');
const https = require('https');

const PORT = 3131;

const ALLOWED_HOSTS = {
  openai:  'api.openai.com',
  gemini:  'generativelanguage.googleapis.com',
};

function forwardRequest(targetHost, targetPath, body, headers, res) {
  const options = {
    hostname: targetHost,
    path: targetPath,
    method: 'POST',
    headers: {
      ...headers,
      'host': targetHost,
      'content-length': Buffer.byteLength(body),
    }
  };

  const req = https.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
    apiRes.pipe(res);
  });

  req.on('error', (e) => {
    res.writeHead(502, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Proxy error: ${e.message}` } }));
  });

  req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Access-Control-Allow-Origin': '*' });
    res.end('Method Not Allowed');
    return;
  }

  // Route: /proxy/openai  → api.openai.com
  // Route: /proxy/gemini  → generativelanguage.googleapis.com
  const match = req.url.match(/^\/proxy\/(openai|gemini)(\/.*)?$/);
  if (!match) {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Unknown proxy route' } }));
    return;
  }

  const service = match[1];
  const subPath = match[2] || '/';
  const targetHost = ALLOWED_HOSTS[service];

  let targetPath;
  if (service === 'openai') {
    targetPath = subPath === '/' ? '/v1/chat/completions' : subPath;
  } else {
    // gemini: /proxy/gemini/v1beta/models/gemini-1.5-pro:generateContent?key=xxx
    // match[2] already contains the full path including ?key=... so use it directly
    targetPath = subPath;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    const fwdHeaders = {
      'Content-Type': 'application/json',
    };
    if (req.headers['authorization']) {
      fwdHeaders['Authorization'] = req.headers['authorization'];
    }
    forwardRequest(targetHost, targetPath, body, fwdHeaders, res);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅  AI Debate Proxy running on http://localhost:${PORT}`);
  console.log(`   OpenAI  → http://localhost:${PORT}/proxy/openai`);
  console.log(`   Gemini  → http://localhost:${PORT}/proxy/gemini/...\n`);
  console.log('   브라우저에서 ai-collaboration.html 을 열어 사용하세요.');
  console.log('   종료: Ctrl + C\n');
});