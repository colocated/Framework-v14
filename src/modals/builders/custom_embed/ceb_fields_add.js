const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const { generateComponents } = require('../../../buttons/builders/custom_embed/ceb_fields');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_add",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder", iconURL: client.user.displayAvatarURL() });

        const name = interaction.fields.getTextInputValue("ceb_fields_add_name_i").trim();
        const value = interaction.fields.getTextInputValue("ceb_fields_add_value_i").trim();
        let inline = interaction.fields.getTextInputValue("ceb_fields_add_inline_i").trim();

        let allowedYes = ['y', 'ye', 'yep', 'yes', 'true', '1', 'on'];
        if (allowedYes.includes(inline.toLowerCase())) inline = true;
        else inline = false;

        const referencedMessage = await interaction.message.fetchReference();
        let customEmbed = referencedMessage.embeds[0];
        const instructionsEmbed = referencedMessage.embeds[1];

        if (!customEmbed || !instructionsEmbed) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the custom embed. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (customEmbed?.fields?.length >= 25) {
            return interaction.reply({
                embeds: [statusEmbed.create("You cannot add more than 25 fields to an embed.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newCustomEmbed = EmbedBuilder.from(customEmbed)
            .addFields({ name, value, inline });

        if (newCustomEmbed.data.description == `\u200b`) newCustomEmbed.data.description = null;
        await referencedMessage.edit({ embeds: [newCustomEmbed, instructionsEmbed] });

        // edit the original interaction message with new components
        let fields = newCustomEmbed?.data.fields;
        const components = generateComponents(fields);
        await interaction.update({ components });

        return interaction.followUp({
            embeds: [statusEmbed.create(`Successfully added a new field to the embed.`, 'Green').setFields({ name: `Name`, value: name }, { name: `Value`, value: value }, { name: `Inline`, value: inline ? "True" : "False" })],
            flags: MessageFlags.Ephemeral
        });
    }
};
