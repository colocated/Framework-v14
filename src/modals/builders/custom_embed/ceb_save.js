const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Save", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_save",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const name = interaction.fields.getTextInputValue('ceb_save_name_i').trim();
        const customEmbed = interaction.message.embeds?.[0];
        if (!customEmbed) return interaction.reply({ embeds: [statusEmbed.create("There was an error fetching the embed, have they been deleted?", 'Red')], flags: [MessageFlags.Ephemeral] });

        const savedEmbed = EmbedBuilder.from(customEmbed).toJSON();
        let newRecord;
        try {
            newRecord = await client.db.embed.create({
                data: {
                    name,

                    createdAt: Math.floor(Date.now() / 1000),
                    updatedAt: Math.floor(Date.now() / 1000),
                    createdBy: interaction.user.id,

                    embedJson: savedEmbed
                }
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({ embeds: [statusEmbed.create("There was an error saving the embed to the database. Please try again later.", 'Red')], flags: [MessageFlags.Ephemeral] });
        }

        return interaction.reply({ embeds: [statusEmbed.create(`Your embed has been saved successfully!\n\n**Embed ID**: ${newRecord.id}\n**Embed Name:** ${newRecord.name}`, 'Green')], flags: [MessageFlags.Ephemeral] });
    }
};
