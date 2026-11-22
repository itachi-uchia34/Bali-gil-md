const { createThemedSocket } = require('./akatsuki-theme');

function wrapCommandHandler(handler) {
    if (typeof handler !== 'function') throw new TypeError('Command handler must be a function');
    const wrapped = (sock, ...args) => handler(createThemedSocket(sock), ...args);
    // Some commands expose helpers on the exported function (for example findMatch).
    // Preserve those properties when applying the shared socket response layer.
    return Object.assign(wrapped, handler);
}

module.exports = { wrapCommandHandler };
