const { StringSelectMenuInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { generateComponents } = require('../../../buttons/builders/custom_embed/ceb_fields_reorder');

module.exports = {
    id: "ceb_fields_reorder_source",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    */
    async execute(interaction) {
        const selectedField = parseInt(interaction.values[0]);

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const customFields = customEmbed.fields;

        if (!customEmbed || !Array.isArray(customFields) || customFields.length < 2 || selectedField < 0 || selectedField >= customFields.length) {
            return interaction.reply({
                content: "There was an error locating the custom embed or it doesn't have the required amount of fields. Has it been deleted?",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const actionRows = generateComponents(customFields, selectedField);
        return interaction.update({ components: [...actionRows] });
    }
};
