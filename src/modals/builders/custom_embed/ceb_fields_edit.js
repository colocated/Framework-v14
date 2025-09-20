const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

module.exports = {
    id: "ceb_fields_edit",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    */
    async execute(interaction) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const footerText = embed.data.footer?.text ?? '';
        const m = footerText.match(/#(\d+)/);
        const fieldIndex = m ? (parseInt(m[1], 10) - 1) : NaN;
        if (isNaN(fieldIndex)) {
            return interaction.reply({ embeds: [statusEmbed.create("An error occurred while finding the field index. Please try again.")], flags: [MessageFlags.Ephemeral] });
        }
        const fieldName = interaction.fields.getTextInputValue("ceb_fields_edit_name_i").trim();
        const fieldValue = interaction.fields.getTextInputValue("ceb_fields_edit_value_i").trim();
        let inline = interaction.fields.getTextInputValue("ceb_fields_edit_inline_i").trim();

        let allowedYes = ['y', 'ye', 'yep', 'yes', 'true', '1', 'on'];
        if (allowedYes.includes(inline.toLowerCase())) inline = true;
        else inline = false;

        if (fieldName.length < 1 || fieldName.length > 256) return interaction.reply({ embeds: [statusEmbed.create("The field name must be between 1 and 256 characters.")], flags: [MessageFlags.Ephemeral] });
        if (fieldValue.length < 1 || fieldValue.length > 1024) return interaction.reply({ embeds: [statusEmbed.create("The field value must be between 1 and 1024 characters.")], flags: [MessageFlags.Ephemeral] });
        const referencedMessage = await interaction.message.fetchReference();
        let customEmbed = referencedMessage.embeds[0];
        const instructionsEmbed = referencedMessage.embeds[1];

        if (!customEmbed) return interaction.reply({
            embeds: [statusEmbed.create("There was an error locating the custom embed. Has it been deleted?", 'Red')],
            flags: MessageFlags.Ephemeral
        });

        let newCustomEmbed = EmbedBuilder.from(customEmbed);
        if (!newCustomEmbed.data.fields || !newCustomEmbed.data.fields[fieldIndex]) {
            return interaction.reply({ embeds: [statusEmbed.create("An error occurred while finding the field. Please try again.")], flags: [MessageFlags.Ephemeral] });
        }

        newCustomEmbed.data.fields[fieldIndex] = { name: fieldName, value: fieldValue, inline };

        await referencedMessage.edit({ embeds: [newCustomEmbed, instructionsEmbed] });

        return interaction.reply({
            embeds: [statusEmbed.create(`Successfully edited field #${fieldIndex + 1}.`, 'Green').setFields({ name: `Name`, value: fieldName }, { name: `Value`, value: fieldValue }, { name: `Inline`, value: inline ? "True" : "False" })],
            flags: MessageFlags.Ephemeral
        });
    }
};
