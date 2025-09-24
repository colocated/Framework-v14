const { StringSelectMenuInteraction, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, getInitialSendRateLimitState } = require('discord.js');
const { generateComponents } = require('../../../buttons/builders/custom_embed/ceb_fields');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_select",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    */
    async execute(interaction) {
        const defaultIndex = parseInt(interaction.values[0]);
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];

        if (!customEmbed || !customEmbed.fields[defaultIndex]) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        const [fieldSelectMenuRow, fieldActionsRow] = generateComponents(customEmbed.fields, defaultIndex);
        return interaction.update({ components: [fieldSelectMenuRow, fieldActionsRow] });
    }
};
