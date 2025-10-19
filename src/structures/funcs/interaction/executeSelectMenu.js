const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require("discord.js");
const { gray } = require('chalk');
const timestring = require('timestring');

const Logger = require('../util/Logger');
const { getCooldown, setCooldown, generateCooldownEmbed } = require("../util/CooldownManager");

/** @typedef {import("../util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ModalSubmitInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function executeSelectMenu(interaction, client) {
    /** Check if the interaction is actually a select menu */
    if (!interaction.isAnySelectMenu()) return;

    /** Check if the select menu exists */
    const menu = client.selectmenus.get(interaction.customId);
    if (!menu) {
        Logger.error(`Select menu ${interaction.customId} does not exist.`);
        return interaction.reply({ content: `This select menu is not linked to a response.`, flags: [MessageFlags.Ephemeral] });
    };

    /** Check if the user is on a cooldown */
    if (menu?.cooldown) {
        // Check if the user is on cooldown
        const cooldown = await getCooldown(client, "menu", interaction.customId, interaction.user.id);
        if (cooldown) return interaction.reply({ embeds: [generateCooldownEmbed(client, getCooldown(client, "menu", interaction.customId, interaction.user.id))], flags: [MessageFlags.Ephemeral] });

        // Set the cooldown
        let menuCooldown;
        try {
            menuCooldown = timestring(menu.cooldown);
        } catch (e) {
            Logger.error(`The cooldown for select menu ${interaction.customId} is not a valid timestring.`);
        };

        setCooldown(client, "menu", interaction.customId, interaction.user.id, timestring(menuCooldown));
    };

    /** Setup permission checking */
    let hasError = false;

    /** Check if the menu requires SuperUser */
    if (menu?.superUser && !process.env.SUPER_USERS?.split(/, |,/).includes(interaction.user.id)) hasError = "permission_error_super_user";

    /** Check if the menu requires GuildOwner */
    if (menu?.ownerOnly && interaction.member.id !== interaction?.guild.ownerId) hasError = "permission_error_guild_owner";

    /** Check if the menu requires a Permission */
    if (menu?.permission && !interaction.member.permissions.has(menu?.permission)) hasError = "permission_error_guild_permission";

    /** Check if the menu requires a Role */
    if (menu?.reqRoles) {
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

            case "permission_error_guild_permission":
                errorEmbed.setDescription(`❌ You do not have permission to use this modal!`);
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

    /** Log & Execute the menu */
    Logger.log(`${interaction.channel.isDMBased() ? `DMs` : `${interaction.guild.name}`} | ${interaction.user.tag} | 📃 ${interaction.customId}${interaction.values[0] ? ` ${gray(`value=`)}${interaction.values[0]}` : ''}`);
    return menu.execute(interaction, client);
}

module.exports = { executeSelectMenu };
