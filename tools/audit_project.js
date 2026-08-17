const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const failures = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) return walk(full);
  return entry.isFile() && full.endsWith('.js') ? [full] : [];
});
for (const file of walk(root)) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
  catch (error) { failures.push(`Syntax error: ${path.relative(root, file)}\n${error.stderr?.toString() || error.message}`); }
}
const pkg = require(path.join(root, 'package.json'));
for (const dependency of Object.keys(pkg.dependencies || {})) {
  try { require.resolve(dependency, { paths: [root] }); }
  catch { failures.push(`Missing dependency: ${dependency}`); }
}
for (const html of ['index.html', 'public/index.html']) {
  const file = path.join(root, html);
  if (!fs.existsSync(file)) failures.push(`Missing HTML: ${html}`);
  else {
    const text = fs.readFileSync(file, 'utf8');
    for (const marker of ['<!doctype html>', '<html', '<head', '<body', '</html>', '/socket.io/socket.io.js', 'pair-request', 'pairing-code']) {
      if (!text.toLowerCase().includes(marker.toLowerCase())) failures.push(`Missing ${marker} in ${html}`);
    }
  }
}
if (!fs.existsSync(path.join(root, 'public', 'index.html'))) failures.push('Express static entry public/index.html is missing');
if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}
console.log('Project audit passed: JavaScript syntax, dependencies, HTML markers, and static entry are valid.');
