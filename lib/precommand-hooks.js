async function runPreCommandHooks({
    sock,
    msg,
    isMe = false,
    isStatus = false,
    handleAutoread,
    storeMessage,
    handleSnipe,
    onError = () => {}
} = {}) {
    if (isMe || isStatus) return;

    const hooks = [
        ['autoread', () => handleAutoread?.(sock, msg)],
        ['message storage', () => storeMessage?.(msg)],
        ['snipe cache', () => handleSnipe?.(msg)]
    ];

    for (const [name, run] of hooks) {
        try {
            await run();
        } catch (error) {
            try {
                onError(name, error);
            } catch {}
        }
    }
}

module.exports = { runPreCommandHooks };
