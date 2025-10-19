const cron = require('node-cron');
const { cyan, red, gray } = require('chalk');

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

    // We put this message here so runOnStartup Jobs outputs don't confuse the user
    Logger.info(`[Jobs] Scheduling (and running) ${files.length} job${files.length === 1 ? '' : 's'}...`);
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

        if (job.id.length > 75) {
            // Limit Job ID to 75 characters because of Discord Custom ID limits (buttons to disable/run job on demand)
            return Logger.warn(`[Jobs] Job ID too long (max 75 characters): ${job.id} in ${file} - skipping this job.`);
        }

        try {
            const task = cron.schedule(job.schedule, () => job.execute(client), {
                name: job?.name || job.id,
                timezone: client.config.cronTimezone ?? 'UTC',

                noOverlap: job?.noOverlap ?? false,
                maxExecutions: job?.maxExecutions ?? 0,
                maxRandomDelay: job?.maxRandomDelay ?? 0
            });

            // Tasks Events - can inividually disable logs by setting disableLogs array in the job file
            // Example: disableLogs: ['task:started', 'execution:failed']
            // Task-level events
            if (!job?.disableLogs?.includes('task:started')) {
                task.on('task:started', (ctx) => {
                    Logger.info(`[Jobs] Job "${ctx.task.name}" will now run according to schedule: ${job.schedule}`);
                });
            }
            if (!job?.disableLogs?.includes('task:stopped')) {
                task.on('task:stopped', (ctx) => {
                    Logger.info(`[Jobs] Job "${ctx.task.name}" has been stopped and will no longer run.`);
                });
            }
            if (!job?.disableLogs?.includes('task:destroyed')) {
                task.on('task:destroyed', (ctx) => {
                    Logger.info(`[Jobs] Job "${ctx.task.name}" has been destroyed and removed from the scheduler.`);
                });
            }

            // Execution-level events
            if (!job?.disableLogs?.includes('execution:started')) {
                task.on('execution:started', (ctx) => {
                    Logger.info(`[Jobs] Starting execution of "${ctx.task.name}"... ${gray(`(${ctx.task.runner.runCount + 1}${ctx.task.runner.maxExecutions > 0 ? `/${ctx.task.runner.maxExecutions}` : ''} runs since boot)`)}`);
                });
            }
            if (!job?.disableLogs?.includes('execution:finished')) {
                task.on('execution:finished', (ctx) => {
                    Logger.info(`[Jobs] Successfully executed "${ctx.task.name}".`);
                });
            }
            if (!job?.disableLogs?.includes('execution:failed')) {
                task.on('execution:failed', (ctx) => {
                    Logger.error(`[Jobs] Execution of job "${ctx.task.name}" failed with error:\n${ctx.execution?.error?.message || 'Unknown error'}`);
                });
            }
            if (!job?.disableLogs?.includes('execution:missed')) {
                task.on('execution:missed', (ctx) => {
                    Logger.warn(`[Jobs] Execution of job "${ctx.task.name}" was missed!!`);
                });
            }
            if (!job?.disableLogs?.includes('execution:overlap')) {
                task.on('execution:overlap', (ctx) => {
                    Logger.warn(`[Jobs] Execution of job "${ctx.task.name}" was skipped because the previous run is still ongoing.`);
                });
            }
            if (!job?.disableLogs?.includes('execution:maxReached')) {
                task.on('execution:maxReached', (ctx) => {
                    Logger.warn(`[Jobs] Job "${ctx.task.name}" has reached its maximum number of executions and will now be removed...`);
                });
            }

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
