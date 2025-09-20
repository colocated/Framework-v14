const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const { buildModal } = require('./ceb_fields_add');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_edit",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const footerText = embed.data.footer?.text ?? '';
        const m = footerText.match(/#(\d+)/);
        const index = m ? (parseInt(m[1], 10) - 1) : NaN;

        if (isNaN(index)) return interaction.reply({
            embeds: [statusEmbed.create("There was an error locating the field index.\nMake sure to select the field you're trying to edit using the menu above.", 'Red')],
            ephemeral: true
        });

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const field = customEmbed.fields[index];

        if (!field) return interaction.reply({
            embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
            flags: MessageFlags.Ephemeral
        });

        const modal = buildModal({
            title: `Edit field #${index + 1}`,
            customId: "ceb_fields_edit",
            field_name: {
                id: "ceb_fields_edit_name_i",
                value: field.name
            },
            field_value: {
                id: "ceb_fields_edit_value_i",
                value: field.value
            },
            field_inline: {
                id: "ceb_fields_edit_inline_i",
                value: field.inline ? "true" : "false"
            }
        });

        return interaction.showModal(modal);
    }
};
