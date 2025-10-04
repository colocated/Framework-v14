const cron = require('node-cron');
const { cyan, red } = require('chalk');

const Logger = require('../funcs/util/Logger');
const { loadFiles } = require('../funcs/fileLoader');

/** @typedef {import("../funcs/util/Types").ExtendedClient} ExtendedClient */

/**
 * Load and start cron jobs
 * @param {ExtendedClient} client 
 */
async function loadJobs(client) {
    client.jobs.forEach(job => {
        try { job.task?.destroy(); }
        catch (error) { Logger.error(`[Jobs] Failed to destroy ${job?.id ?? 'unknown job'}: ${error.message}`); }
    });
    client.jobs.clear();

    const files = await loadFiles("src/jobs");
    if (!files.length) return Logger.warn(`[Jobs] Not preparing. No job files found!`);

    files.forEach((file) => {
        const job = require(file);
        if (!job?.id || !job?.schedule || !job?.execute) {
            const required = ['id', 'schedule', 'execute'];
            const missing = required.filter(prop => !job[prop]);
            if (missing.length) return Logger.warn(`[Jobs] ${file} is missing required properties: ${missing.join(', ')}`);
        }

        if (client.jobs.find(j => j.id === job.id)) {
            return Logger.warn(`[Jobs] Duplicate job ID found: ${job.id} in ${file} - skipping duplicate instances.`);
        }

        try {
            const task = cron.schedule(job.schedule, () => job.execute(client), {
                name: job?.name ?? job.id,
                timezone: client.config.cronTimezone ?? 'UTC',

                noOverlap: job?.noOverlap ?? false,
                maxExecutions: job?.maxExecutions ?? 0,
                maxRandomDelay: job?.maxRandomDelay ?? 0
            });

            if (job?.runOnStartup) job.execute(client);
            job.task = task;

            client.jobs.set(job.id, job);
        } catch (error) {
            Logger.error(`[Jobs] Failed to schedule ${job.id}: ${error.message}`);
        }
    });

    const dangerousJobs = client.jobs.filter(job => job?.dangerous);
    Logger.success(`[Jobs] Prepared with ${red(`${dangerousJobs.size} dangerous jobs`)} and ${cyan(`${client.jobs.size - dangerousJobs.size} safe jobs`)}!`);
}

module.exports = { loadJobs };
