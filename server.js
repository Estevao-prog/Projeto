// Servidor local simples (sem dependências).
// Uso: node server.js          → mostra o endereço (ex.: http://localhost:8000)
//      node server.js --open   → também abre o navegador
// Se a porta estiver ocupada, tenta a próxima automaticamente.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const START_PORT = Number(process.env.PORT) || 8000;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Proibido'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

function listen(port, attempts = 20) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts > 0) listen(port + 1, attempts - 1);
    else throw err;
  });
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Última Carta rodando em ${url}  (Ctrl+C para parar)`);
    if (process.argv.includes('--open')) {
      const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
      exec(cmd);
    }
  });
}
listen(START_PORT);
