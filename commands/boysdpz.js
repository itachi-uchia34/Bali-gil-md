// commands/boysdpz.js
// Wrapper for .dpz boys
const dpz = require('./dpz');
module.exports = async function(...args) {
  const newArgs = Array.from(args);
  newArgs[4] = 'boys';
  return dpz(...newArgs);
};
