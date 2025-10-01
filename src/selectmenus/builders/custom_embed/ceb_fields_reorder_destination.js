const { StringSelectMenuInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { generateComponents } = require('../../../buttons/builders/custom_embed/ceb_fields_reorder');

module.exports = {
    id: "ceb_fields_reorder_destination",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    */
    async execute(interaction) {
        const sourceSelectMenu = interaction.message.components[0].components.find(c => c.customId === 'ceb_fields_reorder_source');
        const sourceIndex = parseInt(sourceSelectMenu?.data?.options?.find(o => o.default)?.value, 10);
        const destinationIndex = parseInt(interaction.values[0], 10);

        if (!sourceSelectMenu || Number.isNaN(sourceIndex) || Number.isNaN(destinationIndex)) {
            return interaction.reply({
                content: "There was an error processing your selection. Please try again.",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const customFields = customEmbed.fields;

        const actionRows = generateComponents(customFields, sourceIndex, destinationIndex);
        return interaction.update({ components: [...actionRows] });
    }
};
