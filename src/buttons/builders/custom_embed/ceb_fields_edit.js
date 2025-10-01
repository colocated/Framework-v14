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
        const sourceSelect = interaction.message.components?.[0]?.components?.[0];
        const defaultOption = sourceSelect?.data?.options?.find(o => o?.default);
        const index = defaultOption ? parseInt(defaultOption.value, 10) : NaN;

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds?.[0];

        if (!Number.isInteger(index) || !customEmbed || !Array.isArray(customEmbed.fields) || index < 0 || index >= customEmbed.fields.length) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }
        const field = customEmbed.fields[index];

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
