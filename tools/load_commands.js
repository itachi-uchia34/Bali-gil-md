const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const commandDir = path.join(root, 'commands');
const failures = [];
for (const name of fs.readdirSync(commandDir).filter((file) => file.endsWith('.js')).sort()) {
  try {
    const loaded = require(path.join(commandDir, name));
    if (typeof loaded !== 'function' && (!loaded || typeof loaded !== 'object')) failures.push(`${name}: invalid export`);
  } catch (error) {
    failures.push(`${name}: ${error.stack || error.message}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}
console.log(`Command module load passed: ${fs.readdirSync(commandDir).filter((file) => file.endsWith('.js')).length} modules.`);
process.exit(0);
