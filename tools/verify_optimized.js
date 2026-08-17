const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const port = Number(process.env.VERIFY_PORT || 3471);
const cwd = path.resolve(__dirname, '..');
const child = spawn(process.execPath, ['index.js'], {
  cwd,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (chunk) => { log += chunk.toString(); });
child.stderr.on('data', (chunk) => { log += chunk.toString(); });

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}${urlPath}`, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    request.on('error', reject);
    request.setTimeout(2000, () => request.destroy(new Error('timeout')));
  });
}

async function main() {
  const deadline = Date.now() + 10000;
  let health;
  while (!health && Date.now() < deadline) {
    try { health = await get('/api/health'); } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  if (!health) throw new Error('server did not become ready');
  const home = await get('/');
  const runtime = await get('/api/runtime-config');
  const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(JSON.stringify({ homeStatus: home.status, healthStatus: health.status, health: health.body, runtimeStatus: runtime.status, runtime: runtime.body, verifierRssMb: rssMb }));
  if (home.status !== 200 || health.status !== 200 || runtime.status !== 200 || !home.body.includes('WhatsApp Pairing')) {
    throw new Error('optimized integration check failed');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  child.kill('SIGTERM');
  setTimeout(() => { console.log(log.trim()); }, 100);
});
