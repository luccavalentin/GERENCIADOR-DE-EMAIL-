const http = require('http');
const { exec } = require('child_process');

const PORT = 3001;
const API_KEY = process.env.WORKER_ADMIN_KEY || 'agilliza-secret-123';

const server = http.createServer((req, res) => {
  // Simple auth
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && url.pathname === '/status') {
    // Check docker container status
    exec('docker inspect --format="{{.State.Status}}" worker-container', (err, stdout) => {
      const status = stdout.trim() || 'stopped';
      res.end(JSON.stringify({ status }));
    });
  } else if (req.method === 'POST' && url.pathname === '/start') {
    exec('docker-compose up -d', (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/stop') {
    exec('docker-compose stop', (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/restart') {
    exec('docker-compose restart', (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Worker Admin API listening on port ${PORT}`);
});
