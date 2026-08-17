const { spawn } = require('child_process');
const http = require('http');

const port = Number(process.env.BENCHMARK_PORT || 3470);
const startedAt = Date.now();
const child = spawn(process.execPath, ['index.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (chunk) => { logs += chunk.toString(); });
child.stderr.on('data', (chunk) => { logs += chunk.toString(); });

function requestHealth() {
  const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const elapsedMs = Date.now() - startedAt;
      const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
      console.log(JSON.stringify({ elapsedMs, benchmarkRssMb: rssMb, statusCode: res.statusCode, health: body }));
      console.log(logs.trim());
      child.kill('SIGTERM');
      setTimeout(() => process.exit(0), 100);
    });
  });
  req.on('error', () => setTimeout(requestHealth, 100));
}

setTimeout(requestHealth, 100);
setTimeout(() => {
  console.error('Startup benchmark timed out');
  child.kill('SIGTERM');
  process.exit(1);
}, 10000);
