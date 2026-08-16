// commands/girlsdpz.js
// Wrapper for .dpz girls
const dpz = require('./dpz');

module.exports = async function(...args) {
  try {
    // call dpz with explicit category 'girls' as 5th argument
    const newArgs = Array.from(args);
    newArgs[4] = 'girls';
    return await dpz(...newArgs);
  } catch (e) {
    console.error('girlsdpz error:', e);
  }
};
