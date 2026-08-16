// commands/boysdpz.js
// Wrapper for .dpz boys
const dpz = require('./dpz');
module.exports = async function boysdpzCommand(sock, from, msg) {
  // Pass explicit category so dpz doesn't need to rely on positional args
  return dpz(sock, from, msg, 'boys');
};
