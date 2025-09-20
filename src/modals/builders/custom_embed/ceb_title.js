const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_title",

    /**
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Title, Description, and Color", { name: `Embed Builder`, iconURL: client.user.displayAvatarURL() });

        let title = interaction.fields.getTextInputValue("ceb_title_i");
        let description = interaction.fields.getTextInputValue("ceb_description_i");
        let color = interaction.fields.getTextInputValue("ceb_color_i");

        if (!title && !description && !color) {
            return interaction.reply({
                embeds: [statusEmbed.create("You must provide a title **or** description.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (color && !/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
            return interaction.reply({
                embeds: [statusEmbed.create("You must provide a valid hex code for the embed **color**.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.message.embeds.length != 2) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        const customEmbed = interaction.message.embeds[0];
        const instructionsEmbed = interaction.message.embeds[1];

        // Check if values have changed
        if (title === customEmbed.title) title = null;
        if (description === customEmbed.description) description = null;
        if (color === customEmbed.hexColor) color = null;

        if (title === null && description === null && color === null) {
            return interaction.reply({
                embeds: [statusEmbed.create("There were no changes made, exiting.", 'Yellow')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newEmbed = EmbedBuilder.from(customEmbed);
        let doneEmbed = statusEmbed.create("The title, description, and color have been successfully updated.", 'Green');

        const updates = [
            { field: 'title', setter: 'title', value: title },
            { field: 'description', setter: 'description', value: description },
            { field: 'color', setter: 'color', value: color ? parseInt(color.replace(/^#/, ''), 16).toString(10) : color }
        ];

        updates.forEach(({ field, setter, value }) => {
            if (value == null) return;
            
            if (value.length < 1) delete newEmbed.data[setter];
            else newEmbed.data[setter] = value;

            if (field === 'color' && value) value = parseInt(value, 10);
            doneEmbed.addFields({ name: field.charAt(0).toUpperCase() + field.slice(1), value: value ? value.toString(16) : "> Unset", inline: false });
        });

        if (newEmbed.data.title && newEmbed.data.description == "\u200b") newEmbed.setDescription(null);

        await interaction.message.edit({ embeds: [newEmbed, instructionsEmbed] });
        return interaction.reply({ embeds: [doneEmbed], flags: MessageFlags.Ephemeral });
    }
};
