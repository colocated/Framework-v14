const { ButtonInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: "job_force_cancel",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        const cancelEmbed = new EmbedBuilder()
            .setTitle('Cancelled')
            .setDescription('You got too scared and cancelled the operation.\nYippee-ki-yay, quitter!')
            .setColor('Red');

        return interaction.update({ embeds: [cancelEmbed], components: [] });
    }
};
