// commands/boysdpz.js - Wrapper for dpboys command
const { dpboys } = require('./dpboys');

module.exports = async function(sock, from, msg, q) {
    return await dpboys(sock, from, msg, q);
};
