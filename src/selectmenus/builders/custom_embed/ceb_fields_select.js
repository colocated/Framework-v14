const { StringSelectMenuInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_select",

    /**
    * 
    * @param {StringSelectMenuInteraction} interaction 
    */
    async execute(interaction) {
        const referencedMessage = await interaction.message.fetchReference();
        const field = referencedMessage.embeds[0].fields[interaction.values[0]];

        if (!field) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        let embed = EmbedBuilder.from(interaction.message.embeds[0]).setFooter({ text: `Selected field: #${parseInt(interaction.values[0]) + 1}` });
        await interaction.update({ embeds: [embed] });
    }
};
