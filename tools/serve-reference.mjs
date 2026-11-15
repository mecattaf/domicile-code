import http from 'node:http';
import { parseArgs } from 'node:util';
import { realpath, readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: { root: { type: 'string', default: 'dist/browser' }, port: { type: 'string', default: '5178' } } });
const root = await realpath(values.root);
assert((await stat(root)).isDirectory(), 'Build the browser reference first');
const port = Number(values.port);
assert(Number.isInteger(port) && port > 1024 && port < 65536, 'Invalid port');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  try {
    assert(['GET', 'HEAD'].includes(request.method), 'Read-only server');
    assert([`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host), 'Use the loopback address');
    const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
    const file = await realpath(resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname)));
    assert(file.startsWith(root + sep), 'The requested file is outside the browser build');
    assert((await stat(file)).isFile(), 'Directory listings are unavailable');
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch (error) {
    response.statusCode = error.code === 'ENOENT' ? 404 : 400;
    response.setHeader('Content-Type', 'text/plain');
    response.end(`Reference asset unavailable: ${error.code ?? error.message}\n`);
  }
});
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ reference: `http://127.0.0.1:${port}`, crossOriginIsolation: 'COOP same-origin + COEP require-corp' })));
const stop = () => { server.close(); server.closeAllConnections(); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
