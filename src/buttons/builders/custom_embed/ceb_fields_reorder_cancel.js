const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { generateComponents } = require('./ceb_fields_reorder');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder(`Reorder Fields`)

module.exports = {
    id: "ceb_fields_reorder_cancel",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds?.[0];

        if (!customEmbed || !Array.isArray(customEmbed.fields)) { 
            return interaction.reply({
                embeds: [statusEmbed.create('We could not find the custom embed or its fields. Has it been deleted?', 'Red')],
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const customFields = customEmbed.fields;

        const actionRows = generateComponents(customFields);
        return interaction.update({ components: [...actionRows] });
    }
};
