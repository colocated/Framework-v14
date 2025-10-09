const { cyan } = require('chalk');

const Logger = require('../funcs/util/Logger');
const { loadFiles } = require('../funcs/fileLoader');

/** @typedef {import("../funcs/util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function loadButtons(client) {
    client.buttons.clear();
    let aliasCount = 0;

    const files = await loadFiles("src/buttons");
    files.forEach((file) => {
        const button = require(file);
        if (!button?.id) return Logger.warn(`[Buttons] ${file} does not export a button (id).`);
        if (button?.id && button?.id.length > 100) return Logger.warn(`[Buttons] ${file} has an id longer than 100 characters. Skipping.`);

        if (button.aliases) {
            button.aliases.forEach(alias => {
                client.buttons.set(alias, button);
                aliasCount++;
            });
        };

        client.buttons.set(button.id, button);
    });

    if (!client.buttons.size) return Logger.warn(`[Buttons] None loaded - Folder empty.`);
    else return Logger.success(`Loaded ${cyan(`${client.buttons.size - aliasCount} buttons`)} and ${cyan(`${aliasCount} aliases`)}.`);
}

module.exports = { loadButtons };
