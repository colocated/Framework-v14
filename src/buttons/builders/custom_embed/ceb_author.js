const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_author",
    invokerOnly: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Author", { name: `Embed Builder`, iconURL: client.user.displayAvatarURL() });

        if (interaction.message.embeds.length != 2) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        let embed = new EmbedBuilder()
            .setAuthor({ name: `Embed Builder`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`Author`)
            .setDescription(`Please select below from the select menu to choose an author for the embed.`)
            .setColor(client.config.color ?? 'DarkButNotBlack')

        let actionRow = new ActionRowBuilder()
            .setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("ceb_author_select")
                    .setPlaceholder("Select an author...")
                    .setOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Remove Author")
                            .setValue("remove")
                            .setDescription("Remove the author from the embed.")
                            .setEmoji("🗑️"),

                        new StringSelectMenuOptionBuilder()
                            .setLabel("User")
                            .setValue("user")
                            .setDescription("Set the author to your user profile.")
                            .setEmoji("👤"),

                        new StringSelectMenuOptionBuilder()
                            .setLabel("Bot")
                            .setValue("bot")
                            .setDescription("Set the author to the bot profile.")
                            .setEmoji("🤖"),

                        new StringSelectMenuOptionBuilder()
                            .setLabel("Custom")
                            .setValue("custom")
                            .setDescription("Set a custom author.")
                            .setEmoji("🔧")
                    )
            )

        return interaction.reply({
            embeds: [embed],
            components: [actionRow],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
