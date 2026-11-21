// Menino vs Menina Royale 2.0 — servidor de demonstração
// Requer Node.js 20+ e o pacote ws.
// Iniciar: npm install && npm run demo
// A versão demo NÃO se conecta a contas TikTok nem recebe presentes reais.

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
const DEMO = process.argv.includes('--demo') || process.env.DEMO === 'true';
const GAME_FILE = path.join(__dirname, 'menino-vs-menina-royale.html');
const MAX_CLIENTS = 30;

const DEMO_GIFTS = [
  'Rosa', 'Bomba', 'Velocidade', 'Fúria', 'Sorvete', 'Curandeiro',
  'Coração', 'Mini dino', 'Cura', 'Capivara', 'Meteoro', 'Leão',
  'Gelo', 'Dragão', 'Universo'
];

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD' });
    return res.end('Method Not Allowed');
  }
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, service: 'menino-vs-menina-royale', mode: DEMO ? 'demo' : 'preview' }));
  }
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not Found');
  }
  fs.readFile(GAME_FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Arquivo menino-vs-menina-royale.html não encontrado.');
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  });
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
server.on('upgrade', (req, socket, head) => {
  // A página hospedada no mesmo domínio é aceita. Origens externas são recusadas.
  const origin = req.headers.origin;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== req.headers.host) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        return socket.destroy();
      }
    } catch {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      return socket.destroy();
    }
  }
  if (wss.clients.size >= MAX_CLIENTS) {
    socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', err => console.warn('WebSocket:', err.message));
  // Este servidor é somente emissor: mensagens recebidas dos navegadores são ignoradas.
  ws.on('message', () => {});
});

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    if (!client.isAlive) { client.terminate(); continue; }
    client.isAlive = false;
    client.ping();
  }
}, 25000);

let demoTimer = null;
if (DEMO) {
  console.log('Modo DEMO ativo: presentes fictícios serão enviados ao jogo.');
  demoTimer = setInterval(() => {
    const gift = DEMO_GIFTS[Math.floor(Math.random() * DEMO_GIFTS.length)];
    const team = Math.random() < 0.5 ? 'b' : 'g';
    const user = '@demo' + Math.floor(Math.random() * 1000);
    broadcast({ team, gift, user, source: 'demo', sentAt: Date.now() });
    console.log(`DEMO ${team === 'b' ? 'Menino' : 'Menina'}: ${user} -> ${gift}`);
  }, 1800);
} else {
  console.log('Modo PREVIEW: servidor e jogo disponíveis; eventos automáticos desligados.');
}

server.listen(PORT, HOST, () => {
  console.log(`Menino vs Menina Royale disponível na porta ${PORT}`);
  console.log(`Health check: /health`);
});

function shutdown() {
  console.log('\nEncerrando servidor...');
  clearInterval(heartbeat);
  if (demoTimer) clearInterval(demoTimer);
  for (const client of wss.clients) client.close(1001, 'Servidor encerrando');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
