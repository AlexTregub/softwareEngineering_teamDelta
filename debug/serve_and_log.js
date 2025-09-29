const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = process.cwd();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const logFile = path.join(root, 'server_access.log');

function appendLog(line) {
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {
    // best-effort
    console.error('Failed to write log', e);
  }
}

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  const now = new Date().toISOString();
  const ip = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
  const line = `${now} ${ip} ${req.method} ${req.url}\n`;
  appendLog(line);

  const parsed = url.parse(req.url || '/');
  let requestedPath = decodeURIComponent(parsed.pathname || '/');
  if (requestedPath.indexOf('..') !== -1) return send404(res);
  let filePath = path.join(root, requestedPath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      fs.stat(index, (ie, ist) => {
        if (!ie) {
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(index).pipe(res);
        } else {
          res.statusCode = 403;
          res.end('Forbidden');
        }
      });
      return;
    }

    fs.readFile(filePath, (err2, data) => {
      if (err2) return send404(res);
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp'
      };
      if (mime[ext]) res.setHeader('Content-Type', mime[ext]);
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`serve_and_log listening on http://localhost:${port}`);
  appendLog(`${new Date().toISOString()} SERVER_STARTED port=${port}\n`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught', err);
  appendLog(`${new Date().toISOString()} SERVER_ERROR ${err}\n`);
});

process.on('SIGINT', () => {
  appendLog(`${new Date().toISOString()} SERVER_STOPPING\n`);
  process.exit(0);
});
