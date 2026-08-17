// commands/girlsdpz.js - Wrapper for dpgirls command
const { dpgirls } = require('./dpgirls');

module.exports = async function(sock, from, msg, q) {
    return await dpgirls(sock, from, msg, q);
};
