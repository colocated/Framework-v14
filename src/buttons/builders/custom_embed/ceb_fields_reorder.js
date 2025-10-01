const { ButtonInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');
const statusEmbed = new StatusEmbedBuilder("Fields", { name: "Embed Builder" });

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_fields_reorder",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const reorderEmbed = new EmbedBuilder()
            .setColor(client.config.color ?? 'DarkButNotBlack')
            .setTitle('Reorder Fields')
            .setDescription('Use the 2 select menus below to select a field to move, and where it should move to. The select field in the top menu will be inserted **after** the field selected in the bottom menu.\n\nIf you want to move a field to the top, select **Move to top** in the bottom menu.')

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds?.[0];
        const instructionsEmbed = referencedMessage.embeds?.[1];
        const customFields = customEmbed?.fields;

        if (!customEmbed || !instructionsEmbed || !Array.isArray(customFields) || customFields.length < 2) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error locating the custom embed or it doesn't have the required amount of fields. Has it been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        const actionRows = generateComponents(customFields);
        return interaction.update({ embeds: [reorderEmbed], components: [...actionRows], flags: MessageFlags.Ephemeral });
    },

    generateComponents
};

/**
 * Generates the action rows and select menus for the fields reorder process.
 * @param {Array<Object>} sourceFields 
 * @param {Number} sourceIndex 
 * @param {Number} destinationIndex
 * @returns 
 */
function generateComponents(sourceFields = [], sourceIndex = null, destinationIndex = null) {
    const actionRows = [];

    // Source select menu
    const sourceSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('ceb_fields_reorder_source')
        .setPlaceholder('Error: No fields available')
        .setMaxValues(1)
        .setDisabled(true)
        .setOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('No fields available')
                .setValue('none')
                .setDescription('There are no fields to move.')
                .setEmoji('⚠️')
        )
    
    if (sourceFields.length > 0) {
        sourceSelectMenu
            .setPlaceholder('Select a field to move')
            .setDisabled(false)
            .setOptions(
                sourceFields.map((field, index) => {
                    const name = field?.name ?? 'Untitled';
                    const value = field?.value ?? '—';
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(name.length > 100 ? name.slice(0, 96) + '...' : name)
                        .setValue(index.toString())
                        .setDescription(value.length > 100 ? value.slice(0, 96) + '...' : value)
                        .setDefault(sourceIndex !== null && index === sourceIndex);
                })
            );
    }

    const destinationSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('ceb_fields_reorder_destination')
        .setPlaceholder('Select a source field to move above')
        .setMaxValues(1)
        .setDisabled(true)
        .setOptions(
            // Users will never see this while it's disabled, so we'll set it to a
            // value we know we'll use later to avoid repetetive code
            new StringSelectMenuOptionBuilder()
                .setLabel('Move to top')
                .setValue('-1')
                .setDescription('Move this field to the first position.')
        );

    if (sourceIndex !== null) {
        // Find the option on the source menu and run setDefault on it
        const selectedOption = sourceSelectMenu.options.find(option => option.data.value === sourceIndex.toString());
        if (selectedOption) selectedOption.setDefault(true);

        destinationSelectMenu
            .setPlaceholder('Select where to move the field')
            .setDisabled(false)
            .addOptions(
                sourceFields.map((field, index) => ({ field, index })) // map with original index
                    .filter(({ index }) => index !== parseInt(sourceIndex)) // remove source
                    .map(({ field, index }) => new StringSelectMenuOptionBuilder()
                        .setLabel(field.name.length > 100 ? field.name.slice(0, 96) + '...' : field.name)
                        .setValue(index.toString())
                        .setDescription(field.value.length > 100 ? field.value.slice(0, 96) + '...' : field.value)
                    )
            )
    }

    // Build confirmation buttons pre-logic, and set the label in the logic, so they can be accessed outside of the check block.
    const questionButton = new ButtonBuilder()
        .setCustomId('ceb_fields_reorder_question')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Move field?')
        .setDisabled(true);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ceb_fields_reorder_cancel')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Back to safety');

    const confirmButton = new ButtonBuilder()
        .setCustomId('ceb_fields_reorder_confirm')
        .setStyle(ButtonStyle.Success)
        .setLabel('Confirm');

    if (destinationIndex !== null) {
        // Find the option on the destination menu and run setDefault on it
        const selectedOption = destinationSelectMenu.options.find(option => option.data.value === destinationIndex.toString());
        if (selectedOption) selectedOption.setDefault(true);

        // Prettify the question button to make it more obvious for the user
        // destinationIndex is +2 because we need to +1 to make it human-readable, and then +1 again because reoder positions it AFTER the "destination"
        questionButton.setLabel(`Move field #${sourceIndex + 1} to ${(destinationIndex + 2) == 1 ? `Top` : ((destinationIndex + 2 === 26) ? `Bottom` : `position #${destinationIndex + 2}`)}?`)
    }

    // Back Button
    const backButton = new ButtonBuilder()
        .setCustomId('ceb_fields_back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️');

    actionRows.push(new ActionRowBuilder().setComponents(sourceSelectMenu));
    actionRows.push(new ActionRowBuilder().setComponents(destinationSelectMenu));
    if (destinationIndex !== null) actionRows.push(new ActionRowBuilder().setComponents(questionButton, cancelButton, confirmButton));
    actionRows.push(new ActionRowBuilder().setComponents(backButton));

    return actionRows;
};