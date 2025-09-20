const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        let manageFieldsEmbed = new EmbedBuilder()
            .setTitle("🌾 Manage Fields")
            .setDescription("Use this menu to manage fields on your custom embed.")
            .setFields(
            { name: `Adding a field`, value: `Click the green button to add a new field. Limited to **25 fields** per embed.` },
            { name: `Editing a field`, value: `Select a field from the dropdown menu, then click the blue __Edit__ button to modify its name, value, and inline settings.` },
            { name: `Deleting a field`, value: `Select a field from the dropdown menu, then click the red __Delete__ button to remove it.` },
            )
            .setColor(client.config.color ?? `Purple`)

        const fields = interaction.message.embeds[0]?.fields ?? [];
        const [fieldSelectMenuRow, fieldActions] = this.generateComponents(fields);

        return interaction.reply({
            embeds: [manageFieldsEmbed],
            components: [fieldSelectMenuRow, fieldActions],
            flags: [MessageFlags.Ephemeral]
        });
    },

    /**
     * 
     * @param {Array} fields 
     * @returns 
     */
    generateComponents: function (fields) {
        let fieldSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`ceb_fields_select`)
            .setPlaceholder(`Select a field to edit or delete`)

        if (!fields?.length || fields?.length === 0) {
            // If there are no fields, disable the select menu and set a placeholder
            fieldSelectMenu
                .setDisabled(true)
                .setPlaceholder(`No fields to select, add one!`)
                // For some reason we have to provide an option even though they'll never be able to see it!
                .setOptions([new StringSelectMenuOptionBuilder().setValue(`ceb_fields_select_none`).setLabel(`No fields to select`)]);
        } else {
            let fieldMap = fields.map((field, index) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(field.name?.length > 100 ? field.name?.slice(0, 96) + `...` : field.name)
                    .setDescription(`${field.value?.length > 100 ? field.value?.slice(0, 96) + `...` : field.value}`)
                    .setValue(`${index}`)
            });

            fieldSelectMenu.setOptions(fieldMap);
        }

        let fieldSelectMenuRow = new ActionRowBuilder()
            .setComponents(fieldSelectMenu);

        let fieldActionsRow = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId(`ceb_fields_add`)
                    .setLabel(`${fields.length >= 25 ? `Max fields reached` : `Add Field`}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(fields.length >= 25), // Disabled if the field limit is reached

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_edit`)
                    .setLabel(`Edit Field`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(fields.length === 0), // Disabled if there are no fields

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_delete`)
                    .setLabel(`Delete Field`)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(fields.length === 0), // Disabled if there are no fields
            )

        return [fieldSelectMenuRow, fieldActionsRow];
    }
};
