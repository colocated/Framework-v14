const { ButtonInteraction } = require('discord.js');
const { generateEmbeds, generateComponents } = require('./ceb_fields');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_back",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const manageFieldsEmbed = generateEmbeds(client);
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const fields = customEmbed?.fields ?? [];
        const [fieldSelectMenuRow, fieldActions] = generateComponents(fields);

        return interaction.update({
            embeds: [manageFieldsEmbed],
            components: [fieldSelectMenuRow, fieldActions],
        });
    }
};
