const { SlashCommandBuilder, AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, ApplicationCommandOptionType, Collection, ButtonBuilder, ButtonStyle
} = require('discord.js');
const timestring = require('timestring');
const humanizeDuration = require('humanize-duration');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Provides information about commands and categories.")

        .addStringOption(option =>
            option.setName("query")
                .setDescription("The command or category to look up.")
                .setAutocomplete(true)
                .setRequired(false)
        ),

    /**
     * 
     * @param {AutocompleteInteraction} interaction 
     * @param {ExtendedClient} client 
     */
    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();

        const commandChoices = client.commands
            .filter(cmd => !cmd.developer || interaction.guild.id === process.env.DEVELOPER_GUILD_ID) // filter out developer commands unless in dev guild
            .map((cmd) => ({
                name: `${getCategoryEmoji(cmd?.category, client)} /${cmd?.data?.name}`,
                value: `cmd_${cmd?.data?.name}`
            }));
        const categoryChoices = Object.keys(client.commandCategories)
            .filter(cat => cat.toLowerCase() !== 'developer' || interaction.guild.id === process.env.DEVELOPER_GUILD_ID) // filter the 'developer' folder of commands unless in dev guild
            .map(cat => ({
                name: `${getCategoryEmoji(cat, client)} ${cat.split('/').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' → ')} (Category)`,
                value: `cat_${cat}`
            }));

        const choices = [...commandChoices, ...categoryChoices];
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25);

        await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.value })),
        );
    },

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction
    * @param {ExtendedClient} client
    */
    async execute(interaction, client) {
        const query = interaction.options.getString("query");
        if (query) return interaction.reply(processQueryMessage(query, client));
        else return interaction.reply(mainMenuMessage(interaction, client));
    },

    processQueryMessage, mainMenuMessage
};

function mainMenuMessage(interaction, client) {
    const embed = new EmbedBuilder()
        .setTitle(`✨ ${interaction?.guild?.members.me.displayName ?? client.user.displayName} - Help Menu`)
        .setDescription(`Select a category below to view available commands and usage.\nYou may also use \`/help [category name]\` or \`/help [command name]\` directly.\n**Need extra support?** Open a ticket!`)
        .addFields(
            Object.entries(client.commandCategories).map(([name, count]) => ({
                name: `${getCategoryEmoji(name, client)} ${name.split('/').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' → ')}`,
                value: `${count} command${count === 1 ? "" : "s"}`,
                inline: true
            })).slice(0, 25)
        )
        .setColor(client.config.color)

    const options = Object.keys(client.commandCategories).map(cat => new StringSelectMenuOptionBuilder()
        .setLabel(cat.split('/').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' → '))
        .setValue(`cat_${cat}`)
        .setDescription(`${client.commandCategories[cat]} command${client.commandCategories[cat] === 1 ? "" : "s"}`)
        .setEmoji(getCategoryEmoji(cat, client))
    ).slice(0, 25);

    const row = new ActionRowBuilder()
        .setComponents(
            new StringSelectMenuBuilder()
                .setCustomId("help_category")
                .setPlaceholder("Select a category...")
                .addOptions(options)
        )

    return { embeds: [embed], flags: [MessageFlags.Ephemeral], components: [row] };
}

/**
 * 
 * @param {string} category 
 * @param {ExtendedClient} client 
 * @returns 
 */
function getCategoryEmoji(category, client) {
    category = category.toLowerCase();
    return client.config.helpCategoryEmojis[category] || `❔`;
}

/**
 * 
 * @param {String} query 
 * @param {ExtendedClient} client 
 * @returns 
 */
function processQueryMessage(query, client, pageIndex = null, withBackButton = false) {
    const isCommand = query.startsWith("cmd_");
    if (!isCommand && !query.startsWith("cat_")) return { content: "❌ Invalid query format.", embeds: [], flags: [MessageFlags.Ephemeral] };

    const embed = new EmbedBuilder()
        .setColor(client.config.color);

    if (isCommand) {
        const command = client.commands.get(query.slice(4));
        if (!command) return { content: "❌ Command not found.", embeds: [], flags: [MessageFlags.Ephemeral] };
        const permissions = new PermissionsBitField(BigInt(command?.data?.default_member_permissions || 0)).toArray().map(p => `\`${p}\``).join(", ") || null;

        embed.setTitle(`${getCategoryEmoji(command.category, client)} /${command.data.name} (${command?.category.charAt(0).toUpperCase() + command?.category?.slice(1) || "Uncategorised"})`)
            .setDescription(command.data.description ?? "No description provided.");

        if (command?.cooldown) embed.addFields({ name: "Cooldown", value: `${humanizeDuration(timestring(command.cooldown, 'ms'))}` || "None", inline: true });
        if (permissions) embed.addFields({ name: "Default Permissions", value: permissions, inline: true });
        if (command?.reqRoles && command.reqRoles.length) embed.addFields({ name: "Required Roles", value: command.reqRoles.map(r => `<@&${r}>`).join(", "), inline: command?.reqRoles.length <= 3 });

        const flags = [];
        if (command?.developer) flags.push("developer");
        if (command?.superUserOnly) flags.push("superUserOnly");
        if (command?.ownerOnly) flags.push("ownerOnly");
        if (flags.length) embed.addFields({ name: "Restrictions", value: getCommandFlags(flags), inline: false });

        // There can either be subcommands or options, not both
        // When there is subcommands, command.data.options will be filled with SlashCommandSubcommandBuilder
        // Else, it'll be filled with SlashCommandOptionBuilder
        const subcommands = command.data.options.filter(opt => opt instanceof SlashCommandSubcommandBuilder || opt instanceof SlashCommandSubcommandGroupBuilder);
        const options = command.data.options.filter(opt => opt.type != null);

        if (subcommands.length) {
            subcommands.forEach(sub => {
                const subOpts = sub.options.filter(opt => opt.type != null);
                sub.name += ` ${subOpts.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(" ")}`;
            });
            embed.addFields({ name: "Subcommands", value: subcommands.length ? subcommands.map(sub => `\`/${command.data.name} ${sub.name}\` - ${sub.description || "No description"}`).join("\n") : "None", inline: false });
        } else if (options.length) {
            embed.addFields({ name: "Options", value: options.length ? options.map(opt => `\`${opt.name}\` (${ApplicationCommandOptionType[opt.type]}) - ${opt.description || "No description"}`).join("\n") : "None", inline: false });
        };

        return { embeds: [embed], components: [], flags: [MessageFlags.Ephemeral] };
    } else if (query.startsWith("cat_")) {
        const category = query.slice(4);
        if (!client.commandCategories[category]) return { content: "❌ Category not found.", embeds: [], flags: [MessageFlags.Ephemeral] };

        const commandsInCategory = client.commands.filter(cmd => (cmd?.category).toLowerCase() === category.toLowerCase());
        const commandLines = commandsInCategory.size ? commandsInCategory.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description || "No description"}`) : ["None"];

        const commandPages = [];
        for (let i = 0; i < commandLines.length; i += 30) {
            commandPages.push(commandLines.slice(i, i + 30));
        }

        const safePageIndex = pageIndex !== null && pageIndex < commandPages.length ? pageIndex : commandPages.length - 1;

        const embed = new EmbedBuilder()
            .setTitle(`${getCategoryEmoji(category, client)} Category: ${category.split('/').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' → ')}`)
            .setDescription(`This category contains ${commandsInCategory.size} command${commandsInCategory.size === 1 ? "" : "s"}.\n\n**Commands**\n${commandPages[safePageIndex].join("\n")}`)
            .setFooter({ text: `To learn more about each command and its permissions or usages, use /help [command name]` })
            .setColor(client.config.color);

        const backButton = withBackButton ? [
            new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId("help_mainmenu")
                        .setLabel("Back to Main Menu")
                        .setStyle(ButtonStyle.Secondary)
                )
        ] : [];

        if (commandPages.length > 1) {
            const actionRow = new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId(`help_page$$${safePageIndex - 1}`)
                        .setLabel(`Previous Page`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(safePageIndex <= 0),
                    new ButtonBuilder()
                        .setCustomId(category)
                        .setLabel(`Page ${safePageIndex + 1}/${commandPages.length}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`help_page$$${safePageIndex + 1}`)
                        .setLabel(`Next Page`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(safePageIndex >= commandPages.length - 1),
                );

            return { embeds: [embed], components: [...backButton, actionRow], flags: [MessageFlags.Ephemeral] };
        }

        return { embeds: [embed], components: [...backButton], flags: [MessageFlags.Ephemeral] };
    };
};

/**
 * @param {Array<string>} flags 
 * @returns {string}
 */
function getCommandFlags(flags) {
    if (!flags || !flags.length) return "None";

    const flagMap = {
        developer: "* 👨‍💻 Only registered in the Developer Guild",
        superUserOnly: "* 🌟 Super User (Bot config) Only",
        ownerOnly: "* 👑 Guild Owner Only"
    };

    const mappedFlags = flags
        .map(flag => flagMap[flag])
        .filter(Boolean);

    return mappedFlags.length
        ? mappedFlags.join("\n")
        : "Flags provided; but not recognised.";
};

// @todo: support for merging command subcategories into the parent or showing them as separate
// @todo: pagination on main menu for when there's 25+ categories
// @todo: Max length (field, select option value/desc, etc) checks and truncation
