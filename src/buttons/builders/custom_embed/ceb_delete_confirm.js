const { ButtonInteraction, MessageFlags } = require('discord.js');

const StatusEmbedBuilder = require("../../../structures/funcs/tools/createStatusEmbed");
const statusEmbed = new StatusEmbedBuilder('Delete Saved Embed', { name: 'Embed Builder' });


/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_delete_confirm",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    * @param {Array} extraArgs 
    */
    async execute(interaction, client, extraArgs) {
        const embedId = extraArgs[0];
        if (!embedId || isNaN(embedId)) return interaction.reply({ embeds: [statusEmbed.create("An error occurred. Please try again.", 'Red')], flags: [MessageFlags.Ephemeral] });

        const embedData = await client.db.embed.findFirst({ where: { id: parseInt(embedId) } });
        if (!embedData) return interaction.reply({ embeds: [statusEmbed.create("This embed no longer exists in the database.", 'Red')], flags: [MessageFlags.Ephemeral] });

        await client.db.embed.delete({ where: { id: parseInt(embedId) } });
        return interaction.update({ embeds: [statusEmbed.create("The embed has been successfully deleted.", 'Green')], components: [], flags: [MessageFlags.Ephemeral] });
    }
};
