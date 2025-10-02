const { ButtonInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    id: "ceb_thumbnail",
    invokerOnly: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        const existingThumbnail = interaction.message.embeds[0]?.thumbnail?.url ?? "";
        const existingImage = interaction.message.embeds[0]?.image?.url ?? "";

        let modal = new ModalBuilder()
            .setCustomId("ceb_thumbnail")
            .setTitle("Thumbnail & Image")
            .setComponents(
                new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId("ceb_thumbnail_i")
                        .setLabel("Thumbnail URL")
                        .setPlaceholder("Enter a URL...")
                        .setValue(existingThumbnail)

                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                ),

                new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId("ceb_image_i")
                        .setLabel("Image URL")
                        .setPlaceholder("Enter a URL...")
                        .setValue(existingImage)

                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                )
            )

        return interaction.showModal(modal);
    }
};
