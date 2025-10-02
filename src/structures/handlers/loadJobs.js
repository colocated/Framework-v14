const cron = require('node-cron');
const { cyan } = require('chalk');

const Logger = require('../funcs/util/Logger');
const { loadFiles } = require('../funcs/fileLoader');

/** @typedef {import("../funcs/util/Types").ExtendedClient} ExtendedClient */

/**
 * Load and start cron jobs
 * @param {ExtendedClient} client 
 */
async function loadJobs(client) {
    client.jobs.forEach(job => job.task.stop());
    client.jobs.clear();

    let jobsArray = [];

    const files = await loadFiles("jobs");
    if (!files.length) return Logger.warn(`[Jobs] Not preparing. No job files found!`);

    files.forEach((file) => {
        const job = require(file);
        if (!job?.id || !job?.schedule || !job?.execute) {
            const required = ['id', 'schedule', 'execute'];
            const missing = required.filter(prop => !job[prop]);
            if (missing.length) return Logger.warn(`[Jobs] ${file} is missing required properties: ${missing.join(', ')}`);
        }

        try {
            const task = cron.schedule(job.schedule, () => job.execute(client), {
                name: job.name ?? job.id,

                scheduled: true,
                timezone: client.config.cronTimezone ?? 'UTC',

                recoverMissedExecutions: job.recoverMissedExecutions ?? false,
                runOnInit: job.runOnInit ?? false,
            });

            job.task = task;

            client.jobs.set(job.id, job);
            jobsArray.push(job.id);
        } catch (error) {
            Logger.error(`[Jobs] Failed to schedule ${job.id}: ${error.message}`);
        };
    });

    Logger.success(`[Jobs] Prepared with ${cyan(`${jobsArray.length} jobs`)}!`);
}

module.exports = { loadJobs };
