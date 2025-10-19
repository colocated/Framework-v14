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
async function executeModal(interaction, client) {
    /** Check if the interaction is actually a modal */
    if (!interaction.isModalSubmit()) return;

    /** Check if the modal exists */
    const modal = client.modals.get(interaction.customId);
    if (!modal) {
        Logger.error(`Modal ${interaction.customId} does not exist.`);
        return interaction.reply({ content: `This modal is not linked to a response.`, flags: [MessageFlags.Ephemeral] });
    };

    /** Check if the modal needs to be ignored */
    if (client.config.ignoredInteractions.modals.includes(interaction.customId)) return;

    /** Check if the user is on a cooldown */
    if (modal?.cooldown) {
        // Check if the user is on cooldown
        const cooldown = await getCooldown(client, "modal", interaction.customId, interaction.user.id);
        if (cooldown) return interaction.reply({ embeds: [generateCooldownEmbed(client, getCooldown(client, "modal", interaction.customId, interaction.user.id))], flags: [MessageFlags.Ephemeral] });

        // Set the cooldown
        let modalCooldown;
        try {
            modalCooldown = timestring(modal.cooldown);
        } catch (e) {
            Logger.error(`The cooldown for modal ${interaction.customId} is not a valid timestring.`);
        };

        setCooldown(client, "modal", interaction.customId, interaction.user.id, timestring(modalCooldown));
    };

    /** Setup permission checking */
    let hasError = false;

    /** Check if the modal requires SuperUser */
    if (modal?.superUser && !process.env.SUPER_USERS?.split(/, |,/).includes(interaction.user.id)) hasError = "permission_error_super_user";

    /** Check if the modal requires GuildOwner */
    if (modal?.ownerOnly && interaction.member.id !== interaction?.guild.ownerId) hasError = "permission_error_guild_owner";

    /** Check if the modal requires a Permission */
    if (modal?.permission && !interaction.member.permissions.has(modal?.permission)) hasError = "permission_error_guild_permission";

    /** Check if the modal requires a Role */
    if (modal?.reqRoles) {
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
                errorEmbed.setDescription(`❌ You do not have the required roles to use this modal!`)
                    .addFields({ name: `Required Roles`, value: `<@&${modal.reqRoles.join(">, <@&")}>` });
                break;

            case "permission_error_dm":
                errorEmbed.setDescription(`❌ A server role is required to interact with this modal!\nPlease try again in a server.`);
                break;

            default:
                errorEmbed.setDescription(`❌ There was a permission error, but we're not sure what.`);
                break;
        };

        return interaction.reply({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] });
    };

    /** Execute the modal */
    Logger.log(`${interaction.channel.isDMBased() ? `DMs` : `${interaction.guild.name}`} | ${interaction.user.tag} | 📋 ${interaction.customId}`);
    return modal.execute(interaction, client);
};

module.exports = { executeModal };
