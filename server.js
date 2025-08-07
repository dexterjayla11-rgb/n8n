import http from 'node:http';
import { URL } from 'node:url';

export function createServer() {
  const clients = [];
  const tasks = [];
  const ads = [];
  let nextClientId = 1;
  let nextTaskId = 1;

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    // Helper to send JSON responses
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const body = await getBody(req);

    if (req.method === 'POST' && parsedUrl.pathname === '/clients') {
      const client = { id: nextClientId++, name: body.name };
      clients.push(client);
      return sendJson(201, client);
    }

    const clientTaskMatch = parsedUrl.pathname.match(/^\/clients\/(\d+)(?:\/tasks(?:\/(\d+))?)?$/);
    if (clientTaskMatch) {
      const clientId = Number(clientTaskMatch[1]);

      if (clientTaskMatch[2]) {
        // specific task not implemented
      }

      if (parsedUrl.pathname.endsWith('/tasks')) {
        if (req.method === 'POST') {
          const task = { id: nextTaskId++, clientId, title: body.title, status: body.status || 'todo' };
          tasks.push(task);
          return sendJson(201, task);
        }
        if (req.method === 'GET') {
          const clientTasks = tasks.filter(t => t.clientId === clientId);
          return sendJson(200, clientTasks);
        }
      } else if (req.method === 'GET') {
        const client = clients.find(c => c.id === clientId);
        if (client) return sendJson(200, client);
      }
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/ads') {
      ads.push({ clientId: body.clientId, impressions: body.impressions || 0, clicks: body.clicks || 0 });
      return sendJson(201, { ok: true });
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/analytics/ads') {
      const result = {};
      for (const ad of ads) {
        if (!result[ad.clientId]) result[ad.clientId] = { impressions: 0, clicks: 0 };
        result[ad.clientId].impressions += ad.impressions;
        result[ad.clientId].clicks += ad.clicks;
      }
      return sendJson(200, result);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return server;
}

function getBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
