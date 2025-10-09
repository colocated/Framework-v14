const { cyan } = require('chalk');

const { loadFiles } = require('../funcs/fileLoader');
const Logger = require('../funcs/util/Logger');

/** @typedef {import("../funcs/util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function loadModals(client) {
    client.modals.clear();

    const files = await loadFiles("src/modals");
    files.forEach((file) => {
        const modal = require(file);
        if (!modal?.id) return Logger.warn(`[Modals] ${file} does not export a modal (id).`);

        client.modals.set(modal.id, modal);
    });

    if (!client.modals.size) return Logger.warn(`[Modals] None loaded - Folder empty.`);
    else return Logger.success(`Loaded ${cyan(`${client.modals.size} modals`)}.`);
}

module.exports = { loadModals };
