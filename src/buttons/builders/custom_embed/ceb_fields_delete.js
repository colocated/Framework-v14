const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_delete",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const sourceSelect = interaction.message.components?.[0]?.components?.[0];
        const defaultOption = sourceSelect?.data?.options?.find(o => o?.default === true);
        const index = defaultOption ? parseInt(defaultOption.value, 10) : NaN;
        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds?.[0];
        if (!Number.isInteger(index) || !customEmbed || !Array.isArray(customEmbed.fields) || index < 0 || index >= customEmbed.fields.length) return interaction.reply({
            embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
            flags: MessageFlags.Ephemeral
        });
        const field = customEmbed.fields[index];

        const aysRow = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId(`ceb_fields_delete_${index}`)
                    .setLabel(`Delete field #${index + 1}?`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_delete_confirm`)
                    .setLabel(`Yes, delete it`)
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_delete_cancel`)
                    .setLabel(`Return to safety`)
                    .setStyle(ButtonStyle.Success)
            );

        const components = interaction.message.components.map(row => {
            const newRow = ActionRowBuilder.from(row);
            const disabled = row.components.map((comp) => {
                const type = comp.type ?? comp.data?.type;
                if (type === ComponentType.Button) return ButtonBuilder.from(comp).setDisabled(true);
                if (type === ComponentType.StringSelect) return StringSelectMenuBuilder.from(comp).setDisabled(true);
                // Fallback: if the builder API is available, use it; otherwise leave as-is.
                return typeof comp.setDisabled === 'function' ? comp.setDisabled(true) : comp;
            });
            return newRow.setComponents(...disabled);
        });

        components.push(aysRow);
        return interaction.update({ components });

        // const referencedMessage = await interaction.message.fetchReference();
        // const customEmbed = referencedMessage.embeds[0];
        // const field = customEmbed.fields[index];

        // if (!field) return interaction.reply({
        //     embeds: [statusEmbed.create("There was an error locating the field. Has it been deleted?", 'Red')],
        //     flags: MessageFlags.Ephemeral
        // });
    }
};
