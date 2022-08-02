const { CommandInteraction, Collection, EmbedBuilder, Client } = require('discord.js');
const consola = require('consola');
const { connection } = require('mongoose');
const ms = require('ms');

const Timeout = new Collection();

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        /********************************
         * Check if the command exists  *
         ********************************/
        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({ content: `There is no command with this name.`, ephemeral: true });

        /****************************************************************
         * Check if the database is on (for commands that need the db)  *
         ****************************************************************/
        if (client.config.mongoURL && command.dbDepend && connection.readyState != 1) {
            let noDB = new EmbedBuilder()
            .setTitle(`🌌 Hold on!`)
            .setDescription(`The database isn't quite connected yet, and you cannot use this command without the database.\nThe bot may be starting up, please allow up to 30 seconds before re-running this command.`)
            .setColor(client.config.color)
            .setFooter({ text: `Infinity Development` });

            consola.log(`${interaction.guild.name} | ${interaction.user.tag} | 💿 Tried to use /${interaction.commandName} but the database is not connected.`)
            return interaction.reply({ embeds: [noDB], ephemeral: true });
        }

        /*************************************
         * Check if user has required roles  *
         *************************************/
        if (command.reqRoles) {
            hasReqRole = false;
            command.reqRoles.forEach((findRole) => {
              if (interaction.member.roles.cache.some((role) => role.id === findRole)) hasReqRole = true;
            });

            let notReqRoles = new EmbedBuilder()
              .setTitle(`❌ You do not have the required roles to execute this command`)
              .setDescription(`Required Roles: <@&${command.reqRoles.join(">, <@&")}>`)
              .setColor(client.config.color);
      
            if (!hasReqRole) return interaction.reply({ embeds: [notReqRoles], ephemeral: true });
        }

        /***************************************
         * Various command / permission checks *
         ***************************************/
        let reason = "";
        let baseEmbed = new EmbedBuilder()
        .setTitle(`❌ You cannot use this command.`)
        .setDescription(`${reason}`)
        .setColor(client.config.color)

        if (command.serverOwnerOnly && interaction.member.id !== interaction.guild.ownerId) { reason = `This command can only be used by **the owner of the server**!`; return interaction.reply({ embeds: [baseEmbed] })};
        if (command.permission && !interaction.member.permissions.has(command.permission)) { reason = `You need the \`${command.permission}\` permission to use this command!`; return interaction.reply({ embeds: [baseEmbed] })};
        if (command.disabledChannels && command.disabledChannels.includes(interaction.channel.id)) { reason = `This command cannot be used in this channel`; return interaction.reply({ embeds: [baseEmbed], ephemeral: true })};
        if (command.allowedChannels && !command.allowedChannels.includes(interaction.channel.id)) { reason = `This command cannot be used in this channel`; return interaction.reply({ embeds: [baseEmbed], ephemeral: true })};
        if (command.nfsw && !interaction.channel.nsfw) { reason = `This command can only be used in an **NSFW Channel**`; return interaction.reply({ embeds: [baseEmbed] })};

        /*********************************
         * Check if user is on cooldown  *
         *********************************/
        if(command.cooldown) {
            if(Timeout.has(`${interaction.commandName}${interaction.member.id}`)) {
                let lastUsage = Timeout.get(`${interaction.commandName}${interaction.member.id}`);
                let msTimeout = ms(command.cooldown) / 1000;
                let timestamp = parseInt(lastUsage) + parseInt(msTimeout);

                let cooldownEmbed = new EmbedBuilder()
                .setTitle(`🏃‍♂️💨 Woah! Slow down!`)
                .setDescription(`You are currently on a __cooldown__ for **/${interaction.commandName}**!\nYou can use the command again <t:${timestamp}:R>`)
                .setColor(client.config.color)

                consola.log(`${interaction.guild.name} | ${interaction.user.tag} | 🕕 Tried to use /${interaction.commandName} but is on cooldown.`)
                return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
            }
            
            Timeout.set(`${interaction.commandName}${interaction.member.id}`, (Date.now() / 1000).toFixed(0));

            setTimeout(() => {
                Timeout.delete(`${interaction.commandName}${interaction.member.id}`)
            }, ms(command.cooldown));
        };

        /******************************
         * Log & execute the command  *
         ******************************/
        consola.log(`${interaction.guild.name} | ${interaction.member.user.tag} | /${interaction.commandName}`);
        command.execute(interaction, client);
    }
}

// db: disabled commands?
// db: disabled modules?
