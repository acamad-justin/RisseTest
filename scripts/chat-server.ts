import http from 'http';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { POST } from '../app/api/chat/route';

const PORT = process.env.CHAT_PORT || 5173;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url ? req.url.split('?')[0] : '';
  if (url === '/api/chat' && req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const json = body ? JSON.parse(body) : {};

      const webReq = new Request(`http://localhost:${PORT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const webRes = await POST(webReq);

      res.statusCode = webRes.status || 200;
      webRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      if (webRes.body) {
        const reader = webRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        res.end();
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Server error' }));
    }
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🤖 Risse AI Chat Server running on http://localhost:${PORT}/api/chat`);
});
