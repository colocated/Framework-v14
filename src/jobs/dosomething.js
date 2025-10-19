/** @typedef {import("../src/structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    // Job Meta
    id: "dosomething",
    name: "",
    description: "",

    // Job Options
    schedule: "*/5 * * * * *", // https://crontab.guru/
    noOverlap: false,
    maxExecutions: 5,
    maxRandomDelay: 0,
    runOnStartup: false,
    dangerous: false,
    disableLogs: [],

    /**
     * Execute the job
     * @param {ExtendedClient} client 
     */
    execute: async (client) => {
        console.log("Doing something...");
    }
};
