const { ButtonInteraction } = require('discord.js');
const { mainMenuMessage } = require('../../commands/info/help');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "help_mainmenu",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        return interaction.update(mainMenuMessage(interaction, client));
    }
};
