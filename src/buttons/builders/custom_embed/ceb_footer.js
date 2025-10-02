const { ButtonInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    id: "ceb_footer",
    invokerOnly: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        const existingEmbed = interaction.message.embeds[0];
        const existingData = {
            text: existingEmbed.footer?.text,
            icon_url: existingEmbed.footer?.iconURL,
        };

        let modal = new ModalBuilder()
            .setTitle("Footer")
            .setCustomId("ceb_footer")
            .setComponents(
                new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId("ceb_footer_text_i")
                        .setLabel("Footer Text")
                        .setPlaceholder("Enter some inspiring text...")
                        .setValue(existingData.text ?? "")

                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                ),

                new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId("ceb_footer_icon_i")
                        .setLabel("Footer Icon URL")
                        .setPlaceholder("Enter a URL...")
                        .setValue(existingData.icon_url ?? "")

                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                ),

                new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId("ceb_footer_timestamp_i")
                        .setLabel("Timestamp")
                        .setPlaceholder("Enter a timestamp...")
                        .setValue(existingEmbed.timestamp ?? "")

                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                )
            )

        return interaction.showModal(modal);
    }
};
