const { cyan } = require('chalk');

const { loadFiles } = require('../funcs/fileLoader');
const Logger = require('../funcs/util/Logger');

/** @typedef {import("../funcs/util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function loadEvents(client) {
    client.events.clear();

    const files = await loadFiles("src/events");
    files.forEach((file) => {
        const event = require(file);
        if (!event?.name || !event?.execute) return Logger.warn(`[Events] ${file} does not export a discord.js event (requires name and execute).`);

        const execute = (...args) => event.execute(...args, client);
        client.events.set(event.name, execute);

        if (event.rest) {
            if (event.once) client.rest.once(event.name, execute);
            else client.rest.on(event.name, execute);
        } else {
            if (event.once) client.once(event.name, execute);
            else client.on(event.name, execute);
        };

    });

    const restEventsCount = client.events.filter(e => e.rest).size;
    if (!client.events.size) return Logger.warn(`[Events] None loaded - Folder empty.`)
    else return Logger.success(`Successfully loaded ${cyan(`${restEventsCount} rest`)} and ${cyan(`${client.events.size - restEventsCount} regular`)} events.`);
};

module.exports = { loadEvents };
