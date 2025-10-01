const { promisify } = require('util');
const { resolve, join } = require('path');
const fs = require('fs-extra');
const exec = promisify(require('child_process').exec);

const Logger = require('../src/structures/funcs/util/Logger');

require('dotenv').config({ quiet: true });

// Constants
const FALLBACK_PATHS = { prisma: './node_modules/prisma/build/index.js' };
const SUPPORTED_PROVIDERS = ['mysql'];
const DB_PROVIDER = process.env.DB_PROVIDER;

// Helper functions
const pathify = (path) => resolve(__dirname, '../', path);

// Loggers
const createLogger = (level) => (...args) => Logger[level]('[+postinstall]', ...args);
const infoLog = createLogger('info');
const debugLog = createLogger('debug');
const warnLog = createLogger('warn');
const errorLog = createLogger('error');

// Main functions
async function executeNPX(cmd) {
    try {
        const [command, ...args] = cmd.split(' ');
        const execPath = pathify(`./node_modules/.bin/${command}`);

        const fullCommand = !fs.existsSync(execPath)
            ? `node ${FALLBACK_PATHS[command]} ${args.join(' ')}`
            : `npx ${cmd}`;

        infoLog(`> ${fullCommand}`);

        const { stderr, stdout } = await exec(fullCommand, { cwd: pathify('./') });

        if (stdout) debugLog(stdout.toString());
        if (stderr) errorLog(stderr.toString());
    } catch (error) {
        throw error.message;
    }
};

function validateEnvironment() {
    infoLog("Validating environment variables...");

    if (!DB_PROVIDER) {
        warnLog('Environment Variables have not been filled out.\nPlease fill out the environment and run the installer again.');
        process.exit(0);
    }

    if (!SUPPORTED_PROVIDERS.includes(DB_PROVIDER)) {
        throw new Error(`DB_PROVIDER must be one of [${SUPPORTED_PROVIDERS.join(", ")}]`);
    }
};

function setupPrismaDirectory() {
    infoLog(`Copying schema & migrations for ${DB_PROVIDER}`);

    try {
        const prismaPath = pathify('./prisma');

        if (fs.existsSync(prismaPath)) {
            fs.rmSync(prismaPath, { force: true, recursive: true });
        } else {
            fs.mkdirSync(prismaPath);
        }

        fs.copySync(pathify(`./db/${DB_PROVIDER}`), prismaPath);
    } catch (error) {
        errorLog(`Error setting up Prisma directory - ${error.message}`);
        process.exit(1);
    }
};

async function runConnectionCheck() {
    try {
        // Import PrismaClient dynamically after generation is complete
        const { PrismaClient } = require('@prisma/client');
        const db = new PrismaClient();

        await db.$connect();
        await db.blacklist.findFirst().catch((err) => {
            errorLog(`Failed to run sample query. Has the migration run successfully?\nFull error: ${err.message}.`);
            process.exit(1);
        });

        await db.$disconnect();
        infoLog('Database test successful.');
    } catch (error) {
        errorLog('Failed to connect to database:', error.message);
        process.exit(1);
    }
};

/* Re-enable when we support SQLite */
// function setupSqliteConnection() {
//     if (DB_PROVIDER === 'sqlite' && !DB_CONNECTION_URL) {
//         DB_CONNECTION_URL = `file:${join(process.cwd(), './user/database.db')}`;
//         log(`set DB_CONNECTION_URL=${DB_CONNECTION_URL}`);
//     }
// }

async function main() {
    infoLog("Starting post-install tasks...");

    try {
        validateEnvironment();

        if (process.env.CI) {
            infoLog('CI detected, skipping');
            process.exit(0);
        };

        // setupSqliteConnection();
        setupPrismaDirectory();

        try {
            await executeNPX('prisma generate');
            await executeNPX('prisma migrate deploy');
        } catch (error) {
            errorLog(error);
            warnLog('If you are migrating a database with existing data, please run `npx prisma db push` manually.');
            // process.exit(1);
        };

        // Add a small delay to ensure Prisma client is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));

        await runConnectionCheck();
    } catch (error) {
        errorLog(`An unexpected error occurred: ${error.message}`);
        process.exit(1);
    };
};

main().catch((error) => {
    errorLog(`Fatal error: ${error.message}`);
    process.exit(1);
});
