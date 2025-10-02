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
    
    let buttonsArray = [];
    let aliasArray = [];

    const files = await loadFiles("src/buttons");
    files.forEach((file) => {
        const button = require(file);
        if (!button?.id) return Logger.warn(`[Buttons] ${file} does not export a button (id).`);
        if (button?.id && button?.id.length > 100) return Logger.warn(`[Buttons] ${file} has an id longer than 100 characters. Skipping.`);

        if (button.aliases) {
            button.aliases.forEach(alias => {
                client.buttons.set(alias, button);
                aliasArray.push(alias + `-` + button?.id);
            });
        };

        client.buttons.set(button.id, button);

        buttonsArray.push(button);
    });

    if (!buttonsArray.length) return Logger.warn(`[Buttons] None loaded - Folder empty.`);
    else return Logger.success(`Loaded ${cyan(`${buttonsArray.length} buttons`)} and ${cyan(`${aliasArray.length} aliases`)}.`);
}

module.exports = { loadButtons };
