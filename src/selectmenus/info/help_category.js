const { StringSelectMenuInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { processQueryMessage } = require('../../commands/info/help');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "help_category",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const categoryQuery = interaction.values[0];
        return interaction.update(processQueryMessage(categoryQuery, client, 0, true));
    }
};
