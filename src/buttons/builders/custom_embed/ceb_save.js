const { ButtonInteraction, MessageFlags, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Save", { name: "Embed Builder" });

module.exports = {
    id: "ceb_save",
    invokerOnly: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        if (interaction.message.embeds.length != 2) return interaction.reply({ embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')], flags: [MessageFlags.Ephemeral] });
        if (interaction.message.embeds[0].description === '\u200b') return interaction.reply({ embeds: [statusEmbed.create("You cannot save an empty embed. Please add some content before saving.", 'Red')], flags: [MessageFlags.Ephemeral] });

        const modal = new ModalBuilder()
            .setCustomId('ceb_save')
            .setTitle('Save Custom Embed');

        const nameInput = new TextInputBuilder()
            .setCustomId('ceb_save_name_i')
            .setLabel("Embed Name")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setPlaceholder("My Custom Embed")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().setComponents(nameInput);
        modal.addComponents(firstActionRow);

        return interaction.showModal(modal);
    }
};
