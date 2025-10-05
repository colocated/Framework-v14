const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cronstrue = require('cronstrue');

const Logger = require('../../../src/structures/funcs/util/Logger');
const StatusEmbedBuilder = require('../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder('Jobs');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    data: new SlashCommandBuilder()
       .setName("jobs")
       .setDescription("View and manage scheduled cron jobs")
       .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
       
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all scheduled jobs')
    )
    
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View details of a cron job')
            .addStringOption(option =>
                option.setName('job_id')
                    .setDescription('The ID of the job to view')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    )
    
    .addSubcommand(subcommand =>
        subcommand
            .setName('run')
            .setDescription('Manually run the specified job')
            .addStringOption(option =>
                option.setName('job_id')
                    .setDescription('The ID of the job to run')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    ),

    developer: true,
    superUserOnly: true,

    async autocomplete(interaction, client) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'job_id') {
            const filtered = client.jobs.filter(job => job.id.startsWith(focusedOption.value));
            await interaction.respond(filtered.map(job => ({ name: `${job.name} ${job?.dangerous ? '[⚠️] ' : ''}[${job.id}]`, value: job.id })).slice(0, 25));
        }
    },

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction
    * @param {ExtendedClient} client
    */
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch(subcommand) {
            case 'list': return list(interaction, client);
            case 'view': return view(interaction, client);
            case 'run': return run(interaction, client);

            default: return interaction.reply({ content: 'Sorry, that subcommand hasn\'t been implemented.', flags: [MessageFlags.Ephemeral] });
        }
    },

    generateComponents
};

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 */
async function list(interaction, client) {
    if (!client.jobs.size) return interaction.reply({ embeds: [statusEmbed.create("No cron jobs are currently scheduled.", 'Red')], flags: [MessageFlags.Ephemeral] });

    let embedString = client.jobs.map((job) => {
        const interval = cronstrue.toString(job.schedule, { use24HourTimeFormat: true, verbose: false });
        return `**${job?.dangerous ? '⚠️ ' : ''}${job?.name ? job.name : job.id}** - ${interval}${job.description ? `\n> ${job.description}` : ''}`;
    }).join('\n\n');

    return interaction.reply({
        embeds: [statusEmbed.create(`${embedString}`, 'Blue').setTitle(`🕵️‍♂️ List of Cron Jobs`)],
        flags: [MessageFlags.Ephemeral]
    });
};

/**
 * 
 * @param {Object} job 
 * @returns 
 */
function generateComponents(job) {
    const interval = cronstrue.toString(job.schedule, { use24HourTimeFormat: true, verbose: false });
    const jobEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`🕵️‍♂️ View Cron Job - ${job.dangerous ? '⚠️ ' : ''}${job.name ? job.name : job.id}`)
        .addFields(
            { name: 'Job ID', value: `\`${job.id}\``, inline: true },
            { name: 'Schedule', value: interval, inline: true },
            { name: 'Run on startup', value: job?.runOnStartup ? 'Yes' : 'No', inline: true },
            { name: 'Task overlapping', value: job?.noOverlap ? 'Cannot overlap' : 'Can overlap', inline: true },
            { name: 'Maximum Executions', value: job?.maxExecutions ? job.maxExecutions.toLocaleString() : 'Unlimited', inline: true },
            { name: 'Max Random Delay', value: job?.maxRandomDelay ? `${job.maxRandomDelay / 1000} seconds` : 'None', inline: true },
        );
    if (job?.description) jobEmbed.addFields({ name: 'Description', value: job.description });

    const modifyJobStatusButton = new ButtonBuilder()
    switch (job?.task?.getStatus()) {
        case 'stopped':
            modifyJobStatusButton
                .setCustomId(`job_start$$${job.id}`)
                .setLabel('Start Job')
                .setStyle(ButtonStyle.Success);
            break;

        case 'running':
        case 'idle':
            modifyJobStatusButton
                .setCustomId(`job_stop$$${job.id}`)
                .setLabel('Stop Job')
                .setStyle(ButtonStyle.Danger);
            break;

        case 'destroyed':
            modifyJobStatusButton
                .setCustomId(`job_destroyed$$${job.id}`)
                .setLabel('Cannot start/stop - job destroyed')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            break;

        default:
            modifyJobStatusButton
                .setCustomId(`job_unknown$$${job.id}`)
                .setLabel('Unable to get Job Status')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            break;
    }

    const row = new ActionRowBuilder()
        .addComponents(
            modifyJobStatusButton,
            new ButtonBuilder()
                .setCustomId(`job_run$$${job.id}`)
                .setLabel('Run Job Now')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setEmoji('🗑️')
                .setCustomId(`job_delete$$${job.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(job?.task?.getStatus() === 'destroyed')
            );

    return { jobEmbed, row };
}

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 * @returns 
 */
async function view(interaction, client) {
    const jobId = interaction.options.getString('job_id');
    const job = client.jobs.get(jobId);
    if (!job) return interaction.reply({ embeds: [statusEmbed.create(`No job found with ID \`${jobId}\`.`, 'Red')], flags: [MessageFlags.Ephemeral] });

    const { jobEmbed, row } = generateComponents(job);

    return interaction.reply({
        embeds: [jobEmbed],
        components: [row],
        flags: [MessageFlags.Ephemeral]
    });
};

/**
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {ExtendedClient} client 
 */
async function run(interaction, client) {
    const jobId = interaction.options.getString('job_id');
    const job = client.jobs.get(jobId);
    if (!job) return interaction.reply({ embeds: [statusEmbed.create(`No job found with ID \`${jobId}\`.`, 'Red')], flags: [MessageFlags.Ephemeral] });
    if (!job?.task) return interaction.reply({ content: `Job \`${jobId}\` does not have a task. It looks like the object is malformed.`, flags: [MessageFlags.Ephemeral] });

    if (job?.dangerous) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('⚠️ Warning - Dangerous Job')
            .setDescription(`Job "${job?.name ?? job?.id ?? "Unknown Job"}" has been marked as **dangerous** by the developer.\n\nThis means that running it manually may have unintended consequences, such as sending duplicate messages, performing actions that are typically rate-limited, or other side effects.\n\nIf you understand the risks and still wish to proceed, please confirm by clicking the button below.`)
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

    return interaction.reply({ content: `Job \`${jobId}\` has been successfully queued for immediate execution.`, flags: [MessageFlags.Ephemeral] });
}