const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder(`Reorder Fields`);

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_reorder_confirm",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const sourceSelectMenu = interaction.message.components[0].components.find(c => c.customId === 'ceb_fields_reorder_source');
        const sourceIndex = parseInt(sourceSelectMenu?.data?.options?.find(o => o.default)?.value, 10);
        const destinationSelectMenu = interaction.message.components[1].components.find(c => c.customId === 'ceb_fields_reorder_destination');
        const destinationIndex = parseInt(destinationSelectMenu?.data?.options?.find(o => o.default)?.value, 10);

        if (sourceIndex === 0 && destinationIndex === -1) {
            return interaction.reply({ embeds: [statusEmbed.create('You cannot move this field to the top, as it is already there!', 'Red')], flags: [MessageFlags.Ephemeral] });
        }

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds?.[0];
        const instructionsEmbed = referencedMessage.embeds?.[1];
        const fields = customEmbed?.data?.fields;
        if (!Array.isArray(fields) || fields.length < 2 || !Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= fields.length || !(Number.isInteger(destinationIndex) || destinationIndex === -1) || destinationIndex < -1 || destinationIndex >= fields.length) {
            return interaction.reply({ embeds: [statusEmbed.create('There was an error processing your selection. Please try again.', 'Red')], flags: [MessageFlags.Ephemeral] });
        }
        
        // We can't use EmbedBuilder#spliceFields because we duplicate the field before
        // removing it's copy, and at the 25 limit means there's temporarily 26 fields.
        // Discord.js runs validation before we can remove the duplicate, so the first call fails :(
        const moveDown = destinationIndex > sourceIndex;
        const insertAt = moveDown ? destinationIndex + 1 : Math.max(destinationIndex, 0); // -1 => 0 (top)
        const sourceField = fields[sourceIndex];
        fields.splice(insertAt, 0, sourceField);

        // Adjust the removal index because if you move the source field to an earlier destination
        // it'll delete the wrong field because indexes all shift +1 from where source used to be
        const removeIndex = moveDown ? sourceIndex : sourceIndex + 1;
        fields.splice(removeIndex, 1);

        await referencedMessage.edit({ embeds: [customEmbed, instructionsEmbed] });
        return interaction.update({ embeds: [statusEmbed.create(`**Field #${sourceIndex + 1}** has been moved successfully to **position #${destinationIndex + 1}**.`, 'Green')], components: [] });
    }
};
