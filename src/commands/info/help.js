const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

/** @typedef {import("../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    data: new SlashCommandBuilder()
       .setName("help")
       .setDescription("Provides information about commands and categories.")

       .addStringOption(option =>
           option.setName("query")
           .setDescription("The command or category to look up.")
           .setAutocomplete(true)
           .setRequired(false)
       ),

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction
    * @param {ExtendedClient} client
    */
    async execute(interaction, client) {
        console.log(client.commands);
        console.log(client.commandCategories);
    }
};


// Usage structure:
// Autocomplete - /help <command>, responds with categories and commands
// Running just /help - responds with a list of categories and counts
// Running /help <command> - responds with detailed info on that command
// Running /help <category> - responds with a list of commands in that category
