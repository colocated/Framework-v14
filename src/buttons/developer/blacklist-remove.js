const { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

const { remove } = require('../../commands/developer/blacklist');

module.exports = {
    id: "blacklist-remove",
    invokerOnly: true,
    developer: true,

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {import('../../structures/funcs/util/Types').ExtendedClient} client 
    */
    async execute(interaction, client) {
        let idField = interaction.message.embeds[0].fields.find(f => f.name === "ID").value;
        if (!idField) return interaction.reply({ content: "This embed is missing an ID field.", flags: [MessageFlags.Ephemeral] });

        idField = idField.replace(/`/g, "");

        let blacklistRemovedActionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("blacklist-remove")
                    .setLabel(`Removed by @${interaction.user.tag}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("✅")
                    .setDisabled(true)
            );

        await interaction.message.edit({ components: [blacklistRemovedActionRow] });
        return remove(interaction, client, idField);
    }
};
