const fs = require('fs');
const path = require('path');

const commandsDir = __dirname;
const indexName = path.basename(__filename);

// Acceptable extensions (add .ts if you compile/transpile)
const fileExtRegex = /\.(js|cjs|mjs)$/i;

const commands = {};

// Load each JS file (except this index) and attach to commands object
for (const file of fs.readdirSync(commandsDir)) {
  if (!fileExtRegex.test(file) || file === indexName) continue;

  const name = path.basename(file, path.extname(file));
  const fullPath = path.join(commandsDir, file);

  try {
    // Require the module
    let mod = require(fullPath);

    // Support transpiled ES module default export
    if (mod && typeof mod === 'object' && 'default' in mod) mod = mod.default;

    // If module itself is a function -> command is that function
    if (typeof mod === 'function') {
      commands[name] = mod;
      continue;
    }

    // If module is an object, try to pick a sensible handler
    if (mod && typeof mod === 'object') {
      // Common handler property names in order of preference
      const preferredHandlers = ['handler', 'handle', 'execute', 'run'];
      const found = preferredHandlers.find(k => typeof mod[k] === 'function');

      if (found) {
        commands[name] = mod[found];
        continue;
      }

      // If there's exactly one function exported on the object, use it
      const fnKeys = Object.keys(mod).filter(k => typeof mod[k] === 'function');
      if (fnKeys.length === 1) {
        commands[name] = mod[fnKeys[0]];
        continue;
      }

      // No single handler found — export the whole module object so callers can access sub-exports
      commands[name] = mod;
      continue;
    }

    // Fallback: not a function or object (unlikely) — export as-is
    commands[name] = mod;
  } catch (err) {
    // Don't crash the whole app if one command fails — log and provide a failing placeholder
    console.error(`[commands/index] Failed loading command "${file}" from ${fullPath}:`, err);
    commands[name] = (..._args) => {
      throw new Error(`Command module "${file}" failed to load. See server logs for full error: ${err && err.message ? err.message : String(err)}`);
    };
  }
}

module.exports = commands;
