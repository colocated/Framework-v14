const { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ApplicationCommandOptionType, CommandInteractionOptionResolver } = require("discord.js");
const timestring = require('timestring');

const Logger = require('../util/Logger');
const { getCooldown, setCooldown, generateCooldownEmbed } = require("../util/CooldownManager");

/** @typedef {import("../util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function executeSlashCommand(interaction, client) {
    /** Check if the interaction is actually a modal */
    if (!interaction.isChatInputCommand()) return;

    /** Check if the modal exists */
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        Logger.error(`Command /${interaction.commandName} does not exist.`);
        return interaction.reply({ content: `This command is not linked to a response.`, flags: [MessageFlags.Ephemeral] });
    };

    /** Check if the user is on a cooldown */
    if (command?.cooldown) {
        // Check if the user is on cooldown
        const cooldown = await getCooldown(client, "command", interaction.commandName, interaction.user.id);
        if (cooldown) return interaction.reply({ embeds: [generateCooldownEmbed(client, getCooldown(client, "command", interaction.commandName, interaction.user.id))], flags: [MessageFlags.Ephemeral] });

        // Set the cooldown
        let cmdCooldown;
        try {
            cmdCooldown = timestring(command.cooldown);
        } catch (e) {
            Logger.error(`The cooldown for command /${interaction.commandName} is not a valid timestring.`);
        };

        setCooldown(client, "command", interaction.commandName, interaction.user.id, timestring(cmdCooldown));
    };

    /** Setup permission checking */
    let hasError = false;

    /** Check if the modal requires SuperUser */
    if (command?.superUser && !process.env.SUPER_USERS?.split(/, |,/).includes(interaction.user.id)) hasError = "permission_error_super_user";

    /** Check if the modal requires GuildOwner */
    if (command?.ownerOnly && interaction.member.id !== interaction?.guild.ownerId) hasError = "permission_error_guild_owner";

    /** Check if the modal requires a Role */
    if (command?.reqRoles) {
        if (interaction.channel.isDMBased()) hasError = "permission_error_dm";

        let hasReqRole = false;

        command.reqRoles.forEach((findRole) => {
            if (interaction?.member.roles.cache.has(findRole)) hasReqRole = true;
        });

        if (!hasReqRole) hasError = "permission_error_guild_role";
    };

    /** Process errors */
    if (hasError) {
        let errorEmbed = new EmbedBuilder()
            .setColor(client.config.color);

        switch (hasError) {
            case "permission_error_super_user":
                errorEmbed.setDescription(`❌ This modal is locked to __Super Users__ only!`);
                break;

            case "permission_error_guild_owner":
                errorEmbed.setDescription(`❌ This modal is locked to the __Owner of the Guild__!`);
                break;

            case "permission_error_guild_role":
                errorEmbed.setDescription(`❌ You do not have the required roles to execute this modal`)
                    .addFields({ name: `Required Roles`, value: `<@&${modal.reqRoles.join(">, <@&")}>` });
                break;

            case "permission_error_dm":
                errorEmbed.setDescription(`❌ A server role is required to interact with this modal!\nPlease try again in a server.`);

                break;

            default:
                errorEmbed.setDescription(`❌ There was a permission error, but we're not sure what.`)
        };

        return interaction.reply({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] });
    };

    /** Execute the modal */
    let subcommand = interaction.options.getSubcommand(false);
    let options = formatInteractionOptions(interaction.options);

    Logger.log(`${interaction.channel.isDMBased() ? `DMs` : `${interaction.guild.name}`} | ${interaction.user.tag} | /${interaction.commandName}${subcommand ? ` ${subcommand}` : ``} ${options ?? ``}`);
    return command.execute(interaction, client);
};

module.exports = { executeSlashCommand };

function formatInteractionOptions(options) {
    const acot = ApplicationCommandOptionType;

    let optionsStr = '';
    if (!options) {
        return optionsStr;
    }

    if (options instanceof CommandInteractionOptionResolver) {
        options = options._hoistedOptions;
    }

    for (const option of options) {
        if (option.type === acot.Subcommand) {
            optionsStr += formatInteractionOptions(option);
            continue;
        }

        if (option.type === acot.SubcommandGroup) {
            optionsStr += formatInteractionOptions(option);
            continue;
        }

        const name = option.name;
        let value = option.value;
        if (option.type === acot.User) {
            value = option.user.tag;
        } else if (option.type === acot.Channel) {
            value = option.channel.toString();
        } else if (option.type === acot.Role) {
            value = option.role.name;
        }
        optionsStr += `${name}:${value} `;
    }

    return optionsStr.trim();
};
