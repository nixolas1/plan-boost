import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { router } from './routes.js';
import { bus } from './events.js';
import type { WSMessage } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startWebServer(): Promise<number> {
  const app = express();
  app.use(express.json());
  app.use(router);

  // Serve built UI
  const uiPath = join(__dirname, '..', '..', 'ui');
  if (existsSync(uiPath)) {
    app.use(express.static(uiPath));
    app.get('*', (_req, res) => {
      res.sendFile(join(uiPath, 'index.html'));
    });
  }

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    const msg: WSMessage = { type: 'connected', message: 'Connected to Boost' };
    ws.send(JSON.stringify(msg));
    ws.on('close', () => clients.delete(ws));
  });

  function broadcast(message: WSMessage) {
    const data = JSON.stringify(message);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  // Forward events to WebSocket clients
  bus.on('plan:created', (plan) => broadcast({ type: 'plan:created', plan }));
  bus.on('plan:updated', (plan) => broadcast({ type: 'plan:updated', plan }));
  bus.on('section:updated', (section) => broadcast({ type: 'section:updated', section }));
  bus.on('comments:answered', (sectionId, comments) => broadcast({ type: 'comments:answered', section_id: sectionId, comments }));
  bus.on('provocations:added', (sectionId, provocations) => broadcast({ type: 'provocations:added', section_id: sectionId, provocations }));
  bus.on('review:submitted', (planId) => broadcast({ type: 'review:submitted', plan_id: planId }));

  return new Promise((resolve, reject) => {
    const ports = [3456, 3457, 3458, 3459, 3460];
    let idx = 0;

    function tryPort() {
      const port = ports[idx];
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && idx < ports.length - 1) {
          idx++;
          tryPort();
        } else {
          reject(err);
        }
      });
      server.listen(port, '127.0.0.1', () => {
        console.error(`[boost] Web server listening on http://127.0.0.1:${port}`);
        resolve(port);
      });
    }
    tryPort();
  });
}
