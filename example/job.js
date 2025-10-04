/** @typedef {import("../src/structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    // Job Meta
    id: "example_job", // Unique identifier for the job
    name: "Example Job", // Name of the job
    description: "This is an example job that runs every 5 minutes", // Description of the job

    // Job Options
    schedule: "*/5 * * * *", // Cron schedule string - this example runs every 5 minutes (https://crontab.guru/)
    noOverlap: true, // Prevent executions if the previous one is still running
    maxExecutions: 0, // Maximum number of executions before stopping the job (0 for unlimited)
    maxRandomDelay: 0, // Random delay in milliseconds to avoid simultaneous executions of tasks
    runOnStartup: true, // Whether to run the job immediately on startup
    dangerous: true, // Mark this job as dangerous (will be highlighted in logs and confirmation will be required on manual runs)

    /**
     * Execute the job
     * @param {ExtendedClient} client 
     */
    execute: async (client) => {
        console.log(`Hi, I'm ${client.user.username}.`);
    }
}
