const { StringSelectMenuInteraction, EmbedBuilder, MessageFlags, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_author_select",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Author", { name: "Embed Builder", iconURL: client.user.displayAvatarURL() });

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const instructionsEmbed = referencedMessage.embeds[1];

        if (referencedMessage.embeds.length != 2) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const existingData = {
            name: customEmbed.author?.name?.toString() || "",
            iconURL: customEmbed.author?.iconURL?.toString() || "",
            url: customEmbed.author?.url?.toString() || ""
        };

        const userOption = interaction.values[0];
        let newEmbed = EmbedBuilder.from(customEmbed);
        
        let response;
        switch(userOption) {
            case 'remove':
                response = await remove(newEmbed);
                break;

            case 'user':
                response = await user(newEmbed, interaction);
                break;

            case 'bot':
                response = await bot(newEmbed, interaction, client);
                break;

            case 'custom':
                await custom(interaction, existingData);
                break;

            default: return interaction.reply({ embeds: [statusEmbed.create("Sorry, that menu option has not been implemented.", 'Red')], flags: [MessageFlags.Ephemeral] });
        };

        if (!response) return;

        let doneEmbed = statusEmbed.create("The author has been successfully updated.", 'Green');
        doneEmbed.setFields({ name: `New value`, value: `${userOption.charAt(0).toUpperCase() + userOption.slice(1)}`, inline: true });
        
        await interaction.deferUpdate();
        await referencedMessage.edit({ embeds: [response, instructionsEmbed] });
        return interaction.editReply({ embeds: [doneEmbed], flags: [MessageFlags.Ephemeral] });
    }
};

/**
 * 
 * @param {EmbedBuilder} newEmbed 
 */
async function remove(newEmbed) {
    newEmbed.data.author = null;
    return newEmbed;
};

/**
 * 
 * @param {EmbedBuilder} newEmbed 
 * @param {StringSelectMenuInteraction} interaction
 */
async function user(newEmbed, interaction) {
    newEmbed.data.author = {
        name: `${interaction.member.displayName ?? `@${interaction.user.tag}`}`,
        icon_url: `${interaction.member.displayAvatarURL() ?? interaction.user.displayAvatarURL()}`
    };

    return newEmbed;
};

/**
 * 
 * @param {EmbedBuilder} newEmbed 
 * @param {StringSelectMenuInteraction} interaction
 * @param {ExtendedClient} client 
 */
async function bot(newEmbed, interaction, client) {
    let clientNickname = (await client.guilds.fetch(interaction.guild.id))?.members?.me?.displayName ?? client.user.displayName;

    newEmbed.data.author = {
        name: `${clientNickname}`,
        icon_url: `${client.user.displayAvatarURL()}`
    };

    return newEmbed;
};

/**
 * 
 * @param {StringSelectMenuInteraction} interaction 
 * @param {ExtendedClient} client 
 * @param {Object} existingData 
 */
async function custom(interaction, existingData) {
    let modal = new ModalBuilder()
        .setCustomId("ceb_author_custom")
        .setTitle("Custom Author")
        .setComponents(
            new ActionRowBuilder().setComponents(
                new TextInputBuilder()
                    .setCustomId("ceb_author_name_i")
                    .setLabel("Name")
                    .setPlaceholder("Enter a name...")
                    .setValue(existingData.name)

                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),

            new ActionRowBuilder().setComponents(
                new TextInputBuilder()
                    .setCustomId("ceb_author_icon_i")
                    .setLabel("Icon URL")
                    .setPlaceholder("Enter an icon URL...")
                    .setValue(existingData.iconURL)

                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),

            new ActionRowBuilder().setComponents(
                new TextInputBuilder()
                    .setCustomId("ceb_author_url_i")
                    .setLabel("URL")
                    .setPlaceholder("Enter a URL...")
                    .setValue(existingData.url)

                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        )

    return interaction.showModal(modal);
};
