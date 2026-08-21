const http = require('http');
const { exec } = require('child_process');

const PORT = 3001;
const API_KEY = process.env.WORKER_ADMIN_KEY || 'agilliza-secret-123';
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'worker-container';

const server = http.createServer((req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && url.pathname === '/status') {
    exec(`docker inspect --format="{{.State.Status}}" ${CONTAINER_NAME}`, (err, stdout) => {
      const status = stdout.trim() || 'stopped';
      res.end(JSON.stringify({ status }));
    });
  } else if (req.method === 'POST' && url.pathname === '/start') {
    exec(`docker start ${CONTAINER_NAME}`, (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/stop') {
    exec(`docker stop ${CONTAINER_NAME}`, (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/restart') {
    exec(`docker restart ${CONTAINER_NAME}`, (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/pause') {
    // Docker pause or custom application-level pause logic
    exec(`docker pause ${CONTAINER_NAME}`, (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else if (req.method === 'POST' && url.pathname === '/unpause') {
    exec(`docker unpause ${CONTAINER_NAME}`, (err) => {
      res.end(JSON.stringify({ success: !err, error: err?.message }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Worker Admin API listening on port ${PORT}`);
});
