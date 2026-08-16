// commands/boysdpz.js
// Wrapper for .dpz boys
const dpz = require('./dpz');

module.exports = async function(...args) {
  try {
    const newArgs = Array.from(args);
    newArgs[4] = 'boys';
    return await dpz(...newArgs);
  } catch (e) {
    console.error('boysdpz error:', e);
  }
};
