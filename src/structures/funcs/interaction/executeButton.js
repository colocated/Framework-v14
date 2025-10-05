const { ButtonInteraction, EmbedBuilder, MessageFlags } = require("discord.js");
const timestring = require('timestring');

const Logger = require('../util/Logger');
const { getCooldown, setCooldown, generateCooldownEmbed } = require("../util/CooldownManager");

/** @typedef {import("../util/Types").ExtendedClient} ExtendedClient */

/**
 * 
 * @param {ButtonInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function executeButton(interaction, client) {
    /** Check if the interaction is actually a button */
    if (!interaction.isButton()) return;

    /** Split the extra args off */
    const [customId, ...extraArgs] = interaction.customId.split("$$");
    interaction.customId = customId;

    /** Check if the button exists */
    const button = client.buttons.get(customId);
    if (!button) {
        Logger.error(`Button ${customId} does not exist.`);
        return interaction.reply({ content: `This button is not linked to a response.`, flags: [MessageFlags.Ephemeral] });
    };

    /** Check if the button needs to be ignored */
    if (client.config.ignoredInteractions.buttons.includes(customId)) return;

    /** Check if the user is on a cooldown */
    if (button?.cooldown) {
        // Check if the user is on cooldown
        const cooldown = await getCooldown(client, "button", customId, interaction.user.id);
        if (cooldown) return interaction.reply({ embeds: [generateCooldownEmbed(client, getCooldown(client, "button", customId, interaction.user.id))], flags: [MessageFlags.Ephemeral] });

        // Set the cooldown
        let btnCooldown;
        try {
            btnCooldown = timestring(button.cooldown);
        } catch (e) {
            Logger.error(`The cooldown for button ${customId} is not a valid timestring.`);
        };

        setCooldown(client, "button", customId, interaction.user.id, timestring(btnCooldown));
    };

    /** Setup permission checking */
    let hasError = false;

    /** Check if the button requires SuperUser */
    if (button?.superUserOnly && !process.env.SUPER_USERS?.split(/, |,/).includes(interaction.user.id)) hasError = "permission_error_super_user";

    /** Check if the button requires GuildOwner */
    if (button?.ownerOnly && interaction.member.id !== interaction?.guild.ownerId) hasError = "permission_error_guild_owner";

    /** Check if the button requires a Permission */
    if (button?.permission && !interaction.member.permissions.has(button?.permission)) hasError = "permission_error_guild_permission";

    /** Check if the button requires a Role */
    if (button?.reqRoles) {
        if (interaction.channel.isDMBased()) hasError = "permission_error_dm";
        let hasReqRole = false;

        button.reqRoles.forEach((findRole) => {
            if (interaction?.member.roles.cache.has(findRole)) hasReqRole = true;
        });

        if (!hasReqRole) hasError = "permission_error_guild_role";
    };

    /** Check if the button is usable by the invoker only */
    if (button?.invokerOnly && interaction.user.id !== interaction?.message?.interactionMetadata.user.id) hasError = "permission_error_invoker_only";

    /** Process errors */
    if (hasError) {
        let errorEmbed = new EmbedBuilder()
            .setColor(client.config.color);

        switch (hasError) {
            case "permission_error_super_user":
                errorEmbed.setDescription(`❌ This button is locked to __Super Users__ only!`);
                break;

            case "permission_error_guild_owner":
                errorEmbed.setDescription(`❌ This button is locked to the __Owner of the Guild__!`);
                break;

            case "permission_error_guild_permission":
                errorEmbed.setDescription(`❌ You do not have permission to use this button!`);
                break;

            case "permission_error_guild_role":
                errorEmbed
                    .setDescription(`❌ You do not have the required roles to execute this button`)
                    .addFields({ name: `Required Roles`, value: `<@&${button.reqRoles.join(">, <@&")}>` });
                break;

            case "permission_error_dm":
                errorEmbed.setDescription(`❌ A server role is required to interact with this button!\nPlease try again in a server.`);
                break;

            case "permission_error_invoker_only":
                errorEmbed.setDescription(`❌ You are not the invoker of this command!`);
                break;

            default:
                errorEmbed.setDescription(`❌ There was a permission error, but we're not sure what.`);
                break;
        };

        return interaction.reply({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] });
    };

    /** Log & Execute the button */
    Logger.log(`${interaction.channel.isDMBased() ? `DMs` : `${interaction.guild.name}`} | ${interaction.user.tag} | 🔘 ${customId} ${extraArgs.length ? `[${extraArgs.join(", ")}]` : ""}`);
    return button.execute(interaction, client, extraArgs);
};

module.exports = { executeButton };
