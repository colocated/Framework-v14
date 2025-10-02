const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_send",
    invokerOnly: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        let embed = new EmbedBuilder()
            .setTitle("Send Embed")
            .setDescription(`Please select a channel from the below dropdown to send the embed to.`)
            .setColor(client.config.color ?? 'DarkButNotBlack');

        let actionRow = new ActionRowBuilder()
            .setComponents(
                new ChannelSelectMenuBuilder()
                    .setChannelTypes(ChannelType.GuildText)
                    .setCustomId("ceb_send_channel")
                    .setMaxValues(1)
                    .setPlaceholder("Select a channel")
                )

        return interaction.reply({
            embeds: [embed],
            components: [actionRow],
            flags: MessageFlags.Ephemeral
        });
    }
};
