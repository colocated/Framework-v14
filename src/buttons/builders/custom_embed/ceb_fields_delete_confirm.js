const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { generateComponents } = require('./ceb_fields');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_delete_confirm",

    /**
     * @param {ButtonInteraction} interaction 
     * @param {ExtendedClient} client 
     */
    async execute(interaction, client) {
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const instructionsEmbed = referencedMessage.embeds[1];

        if (!customEmbed || !instructionsEmbed) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the custom embed. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        let menuEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        const index = parseInt(menuEmbed.data.footer?.text?.split('#')[1]) - 1;
        menuEmbed.setFooter(null);

        if (isNaN(index)) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the field index.\nMake sure to select the field you're trying to delete using the menu above.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!Array.isArray(customEmbed?.fields)) {
            return interaction.reply({
                embeds: [statusEmbed.create("This embed has no fields to delete.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }
        const field = customEmbed.fields[index];

        if (!field) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the field.\nMake sure to select the field you're trying to delete using the menu above.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newCustomEmbed = EmbedBuilder.from(customEmbed).spliceFields(index, 1);
        if (newCustomEmbed.data.fields.length === 0 && !newCustomEmbed.data.description) newCustomEmbed.setDescription(`\u200b`);
        await referencedMessage.edit({ embeds: [newCustomEmbed, instructionsEmbed] });

        const fields = newCustomEmbed?.data.fields;
        const components = generateComponents(fields);

        await interaction.update({ embeds: [menuEmbed], components });
        return interaction.followUp({
            embeds: [
                statusEmbed.create(`Successfully deleted field #${index + 1}.`, 'Green')
                    .setFields(
                        { name: `Name`, value: field.name },
                        { name: `Value`, value: field.value },
                        { name: `Inline`, value: field.inline ? "True" : "False" }
                    )
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
