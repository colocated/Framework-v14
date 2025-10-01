const { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    data: new SlashCommandBuilder()
       .setName("embed")
       .setDescription("Create or load a custom embed")
       
       .addSubcommand(subcommand =>
              subcommand
                .setName("create")
                .setDescription("Create a custom embed")
       )

       .addSubcommand(subcommand =>
                subcommand
                    .setName("load")
                    .setDescription("Load a saved custom embed")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the embed")
                            .setRequired(true)
                            .setAutocomplete(true)
                    )
        ),
    
    /**
     * 
     * @param {AutocompleteInteraction} interaction 
     * @param {ExtendedClient} client 
     */
    async autocomplete(interaction, client) {
        let userFocus = interaction.options.getFocused().replace('#', '');

        const idValue = Number.isNaN(parseInt(userFocus)) ? undefined : parseInt(userFocus);
        let savedEmbeds = await client.db.embed.findMany({
            where: {
                OR: [
                    { name: { contains: userFocus } },
                    ...(idValue !== undefined ? [{ id: { equals: idValue } }] : [])
                ]
            },
        });

        let choices = savedEmbeds.map(embed => {
            return {
                name: `#${embed.id} | ${embed.name}`,
                value: embed.id.toString()
            };
        });

        if (!choices.length) choices = [{ name: "No embeds found", value: "none" }];

        return interaction.respond(choices);
    },

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction
    * @param {ExtendedClient} client
    */
    async execute(interaction, client) {
        let subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case "create":
                return create(interaction, client);
            case "load":
                return load(interaction, client);

            default: return interaction.reply({ content: "Sorry, that subcommand hasn't been implemented.", flags: [MessageFlags.Ephemeral] });
        };
    }
};

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function create(interaction, client) {
    const { explainEmbed, customEmbed, actionRow1, actionRow2, actionRow3 } = generateComponents(interaction, client);
    return interaction.reply({ embeds: [customEmbed, explainEmbed], components: [actionRow1, actionRow2, actionRow3] });
};

function generateComponents(interaction, client, embedData = null) {
    const explainEmbed = new EmbedBuilder()
        .setTitle(`Custom Embed Builder`)
        .setDescription(`You can create a custom embed using the options below.\nThe embed above is the preview of the embed you are creating.`)
        .setColor(client.config.color ?? 'DarkButNotBlack')
        .setFooter({ text: `Created by @${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    let embedObj; if (typeof embedData === 'string') embedObj = JSON.parse(embedData); else embedObj = embedData;
    const customEmbed = embedData ? EmbedBuilder.from(embedObj) : new EmbedBuilder().setColor(client.config.color ?? 'DarkButNotBlack').setDescription(`\u200b`);

    const actionRow1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("ceb_title")
                .setLabel("Title, Description & Color")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("ceb_author")
                .setLabel("Author")
                .setStyle(ButtonStyle.Primary),
        );

    const actionRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("ceb_thumbnail")
                .setLabel("Thumbnail & Image")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("ceb_footer")
                .setLabel("Footer")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("ceb_fields")
                .setLabel("Manage Fields")
                .setStyle(ButtonStyle.Primary)
        );

    const actionRow3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("ceb_save")
                .setLabel("Save")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("ceb_send")
                .setLabel("Send")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("ceb_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );

    return { explainEmbed, customEmbed, actionRow1, actionRow2, actionRow3 };
}

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function load(interaction, client) {
    return interaction.reply({ content: `Loading embed: ${interaction.options.getString("name")}` });
};
