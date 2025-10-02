const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');

const { loadCommands } = require('../../structures/handlers/loadCommands');
const { loadEvents } = require('../../structures/handlers/loadEvents');
const { loadModals } = require('../../structures/handlers/loadModals');
const { loadButtons } = require('../../structures/handlers/loadButtons');
const { loadSelectMenus } = require('../../structures/handlers/loadSelectMenus');
const { loadJobs } = require('../../structures/handlers/loadJobs');

const Logger = require('../../structures/funcs/util/Logger');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reload available commands and events in the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => 
        option.setName("type")
        .setDescription("The type of loader to re-invoke")
        .setChoices(
            { name: "💥 All", value: "all" },
            { name: "✨ Events", value: "events" },
            { name: "🤖 Slash Commands", value: "commands" },
            { name: "📝 Modals", value: "modals" },
            { name: "🔘 Buttons", value: "buttons" },
            { name: "📃 Select Menus", value: "selectmenus" },
            { name: "🔧 Jobs", value: "jobs" }
        )
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    developer: true,
    superUserOnly: true,
    usage: "/reload <type>",

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {ExtendedClient} client 
     * @returns 
     */
    async execute(interaction, client) {
        const type = interaction.options.getString("type");
        let embed = new EmbedBuilder()
        .setTitle(`🔃 Reloaded!`)
        .setDescription(`Successfully reloaded for ${type === 'all' ? '' : 'all '}**${type}**!`)
        .setColor(client.config.color ?? 'DarkButNotBlack');

        switch(type) {
            case "all": {
                await loadEvents(client);
                await loadCommands(client);
                await loadModals(client);
                await loadButtons(client);
                await loadSelectMenus(client);
                await loadJobs(client);
                break;
            };

            case "events": loadEvents(client);
            break;
            
            case "commands": await loadCommands(client);
            break;

            case "modals": await loadModals(client);
            break;

            case "buttons": await loadButtons(client);
            break;

            case "selectmenus": await loadSelectMenus(client);
            break;

            case "jobs": await loadJobs(client);
            break;
        }

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        return Logger.warn(`[Reload] @${interaction.user.username} triggered a reload for all ${type}.`);
    }
};
