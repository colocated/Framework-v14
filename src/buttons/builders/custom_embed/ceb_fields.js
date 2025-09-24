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
        const manageFieldsEmbed = this.generateEmbeds(client);
        const fields = interaction.message.embeds[0]?.fields ?? [];
        const [fieldSelectMenuRow, fieldActions] = this.generateComponents(fields, interaction);

        return interaction.reply({
            embeds: [manageFieldsEmbed],
            components: [fieldSelectMenuRow, fieldActions],
            flags: [MessageFlags.Ephemeral]
        });
    },

    /**
     * Returns the Manage Fields embed so we can access it in the back button from Reorder Fields.
     * @param {ExtendedClient} client
     * @returns {EmbedBuilder}
     */
    generateEmbeds: function (client) {
        const manageFieldsEmbed = new EmbedBuilder()
            .setTitle("🌾 Manage Fields")
            .setDescription("Use this menu to manage fields on your custom embed.")
            .setFields(
                { name: `Adding a field`, value: `Click the green button to add a new field. Limited to **25 fields** per embed.` },
                { name: `Editing a field`, value: `Select a field from the dropdown menu, then click the blue __Edit__ button to modify its name, value, and inline settings.` },
                { name: `Deleting a field`, value: `Select a field from the dropdown menu, then click the red __Delete__ button to remove it.` },
                { name: `Reordering fields`, value: `Click the grey __Reorder__ button to change the order of your fields.\nThis action is disabled until there are at least 2 fields on the custom embed.` }
            )
            .setColor(client.config.color ?? `Purple`)

        return manageFieldsEmbed;
    },

    /**
     * 
     * @param {Array} fields 
     * @returns 
     */
    generateComponents: function (fields, defaultIndex = null) {
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
            const fieldMap = fields.map((field, index) => {
                const name = field.name ?? 'Untitled';
                const value = field.value ?? '—';
                const isDefaultOption = (defaultIndex === index) ?? false;

                return new StringSelectMenuOptionBuilder()
                    .setLabel(name.length > 100 ? name.slice(0, 96) + '...' : name)
                    .setDescription(value.length > 100 ? value.slice(0, 96) + '...' : value)
                    .setValue(`${index}`)
                    .setDefault(isDefaultOption)
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
                    .setDisabled(!fieldSelectMenu.options.find(o => o.data?.default)), // Disabled if the select menu hasn't been used

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_delete`)
                    .setLabel(`Delete Field`)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!fieldSelectMenu.options.find(o => o.data?.default)), // Disabled if the select menu hasn't been used

                new ButtonBuilder()
                    .setCustomId(`ceb_fields_reorder`)
                    .setLabel(`Reorder Fields`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(fields.length < 2) // Disabled if there are less than 2 fields
            )

        return [fieldSelectMenuRow, fieldActionsRow];
    }
};
