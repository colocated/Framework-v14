const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { processQueryMessage } = require('../../commands/info/help');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "help_page",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client, extraArgs) {
        // pageIndex is passed as the system (0-based index), so no subtraction needed
        const pageIndex = parseInt(extraArgs[0]);
        if (isNaN(pageIndex)) return interaction.reply({ content: 'Invalid page index.', ephemeral: true });

        const categoryQuery = interaction.message.components[0].components[1].customId;
        return interaction.update(processQueryMessage(`cat_${categoryQuery}`, client, pageIndex));
    }
};
