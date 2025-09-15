const { ActivityType } = require('discord.js');
const { cyan } = require('chalk');

const { loadCommands } = require("../../structures/handlers/loadCommands");
const { loadModals } = require("../../structures/handlers/loadModals");
const { loadButtons } = require("../../structures/handlers/loadButtons");
const { loadSelectMenus } = require('../../structures/handlers/loadSelectMenus');
const { loadJobs } = require('../../structures/handlers/loadJobs');

const Logger = require('../../structures/funcs/util/Logger');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    name: "clientReady",
    once: true,
    /**
     *
     * @param {ExtendedClient} client
     * @returns 
     */
    async execute(client) {
        await loadCommands(client);
        await loadModals(client);
        await loadButtons(client);
        await loadSelectMenus(client);
        await loadJobs(client);

        Logger.success(`Connected to Discord as ${cyan(`${client.user.tag}`)}!\n`);
        Logger.info(`Interaction Logging started.`)

        client.user.setStatus("online");
        client.user.setActivity(`you. 👁👄👁`, { type: ActivityType.Watching });

        let state = 0;
        let presences = [
            { type: ActivityType.Playing, message: 'Minecraft' }, // Playing Minecaft
            { type: ActivityType.Listening, message: 'Spotify' }, // Listening to Spotify
            { type: ActivityType.Watching, message: 'Netflix' }, // Watching Netflix
        ];

        setInterval(() => {
            state = (state + 1) % presences.length;
            let presence = presences[state];
            client.user.setActivity(presence.message, { type: presence.type });
        }, 7500);
    }
};
