// commands/girlsdpz.js
// Wrapper for .dpz girls
const dpz = require('./dpz');
module.exports = async function girlsdpzCommand(sock, from, msg) {
  // Pass explicit category so dpz doesn't need to rely on positional args
  return dpz(sock, from, msg, 'girls');
};
