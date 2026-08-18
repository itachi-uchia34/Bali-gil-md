const fs = require('fs');
const path = require('path');

function loadPlugins(pluginDirectory, reservedCommands = []) {
    const resolvedDirectory = path.resolve(pluginDirectory);
    const reserved = new Set(reservedCommands);
    const registry = {
        commands: {},
        themes: {},
        plugins: []
    };

    if (!fs.existsSync(resolvedDirectory)) return registry;

    const pluginFiles = fs.readdirSync(resolvedDirectory)
        .filter((file) => file.endsWith('.js') && file !== 'index.js')
        .sort();

    for (const file of pluginFiles) {
        const pluginPath = path.join(resolvedDirectory, file);
        const plugin = require(pluginPath);
        const pluginName = plugin.name || path.basename(file, '.js');

        if (!plugin.commands || typeof plugin.commands !== 'object') {
            throw new TypeError(`Plugin ${pluginName} must export a commands object`);
        }

        for (const [commandName, handler] of Object.entries(plugin.commands)) {
            if (!/^[a-z0-9_-]+$/i.test(commandName)) {
                throw new TypeError(`Plugin ${pluginName} has an invalid command name: ${commandName}`);
            }
            if (typeof handler !== 'function') {
                throw new TypeError(`Plugin ${pluginName} command ${commandName} must be a function`);
            }
            if (registry.commands[commandName] || reserved.has(commandName)) {
                throw new Error(`Plugin command conflicts with an existing command: ${commandName}`);
            }
            registry.commands[commandName] = handler;
        }

        if (plugin.themes && typeof plugin.themes === 'object') {
            Object.assign(registry.themes, plugin.themes);
        }
        registry.plugins.push({ name: pluginName, file, commandCount: Object.keys(plugin.commands).length });
    }

    return registry;
}

module.exports = { loadPlugins };
