const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { generateComponents } = require('./ceb_fields');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_delete_cancel",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];

        const components = generateComponents(customEmbed.fields);
        await interaction.update({ components });
    }
};
