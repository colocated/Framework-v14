const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require('discord.js');
const Logger = require('../../../src/structures/funcs/util/Logger');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "job_run",
    aliases: ["job_force_run"],

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    * @param {String[]} extraArgs
    */
    async execute(interaction, client, extraArgs) {
        const jobId = extraArgs[0];
        const job = client.jobs.get(jobId);

        if (!job) return interaction.reply({ content: `Unable to find job with ID: \`${jobId}\``, flags: [MessageFlags.Ephemeral] });
        if (!job?.task) return interaction.reply({ content: `Job \`${jobId}\` does not have a task. It looks like the object is malformed.`, flags: [MessageFlags.Ephemeral] });

        // Because both buttons run this (repeated) code, we only show the notice if it's the initial "run" button and not the confirmation button
        if (job?.dangerous && interaction.customId.startsWith('job_run')) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('⚠️ Warning - Dangerous Job')
                .setDescription(`This job has been marked as **dangerous** by the developer.\n\nThis means that running it manually may have unintended consequences, such as sending duplicate messages, performing actions that are typically rate-limited, or other side effects.\n\nIf you understand the risks and still wish to proceed, please confirm by clicking the button below.`)
                .setTimestamp();

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Confirm Run')
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId(`job_force_run$$${job.id}`),
                    new ButtonBuilder()
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('job_force_cancel')
                );

            return interaction.reply({ embeds: [embed], components: [actionRow], flags: [MessageFlags.Ephemeral] });
        }

        try {
            job.task.execute();
        } catch (error) {
            Logger.error(`Failed to execute-on-demand job ${jobId}: ${error.message}`);
        }

        const successMessage = `Job \`${jobId}\` has been successfully queued for immediate execution.`;
        return respond(successMessage);
    }
};

/**
 * Respond to the interaction based on its invocation condition
 * @param {String} message 
 * @returns {Promise<void>}
 */
const respond = (message) => {
    const options = { content: message, embeds: [], components: [], flags: [MessageFlags.Ephemeral] };
    if (interaction.customId.startsWith('job_force_run')) return interaction.update(options);
    return interaction.reply(options);
};
