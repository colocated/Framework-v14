const { ButtonInteraction, MessageFlags } = require('discord.js');
const { generateComponents } = require('../../commands/developer/jobs');
const Logger = require('../../../src/structures/funcs/util/Logger');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "job_stop",

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
        if (job.task.getStatus() === 'destroyed') {
            const { jobEmbed, row } = generateComponents(job);
            await interaction.update({ embeds: [jobEmbed], components: [row] });
            return interaction.followUp({ content: `Job \`${jobId}\` has already been destroyed.\nYou must restart the bot's process to re-add the job.`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            job.task.stop();
        } catch (error) {
            Logger.error(`Failed to stop job ${jobId}: ${error.message}`);
            return interaction.reply({ content: `Stopping job \`${jobId}\` failed: ${error.message}`, flags: [MessageFlags.Ephemeral] });
        }

        const { jobEmbed, row } = generateComponents(job);
        await interaction.update({ embeds: [jobEmbed], components: [row] });
        return interaction.followUp({ content: `Job \`${jobId}\` has been stopped successfully.`, flags: [MessageFlags.Ephemeral] });
    }
};
