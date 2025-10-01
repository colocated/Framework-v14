const { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    id: "ceb_fields_add",

    /**
    * 
    * @param {ButtonInteraction} interaction 
    */
    async execute(interaction) {
        const modal = buildModal();
        return interaction.showModal(modal);
    },

    buildModal
};

function buildModal(overrides = {}) {
    const field_name_question = new TextInputBuilder()
        .setCustomId(overrides?.field_name?.id || "ceb_fields_add_name_i")
        .setLabel("Field Name")
        .setPlaceholder("Enter the name of the field...")
        .setMaxLength(256)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const field_value_question = new TextInputBuilder()
        .setCustomId(overrides?.field_value?.id || "ceb_fields_add_value_i")
        .setLabel("Field Value")
        .setPlaceholder("Enter the value of the field...")
        .setMaxLength(1024)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const field_inline_question = new TextInputBuilder()
        .setCustomId(overrides?.field_inline?.id || "ceb_fields_add_inline_i")
        .setLabel("Inline?")
        .setPlaceholder("Enter true or false...")
        .setMaxLength(5)
        .setValue("false")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    if (overrides?.field_name?.value) field_name_question.setValue(overrides.field_name.value);
    if (overrides?.field_value?.value) field_value_question.setValue(overrides.field_value.value);
    if (overrides?.field_inline?.value) field_inline_question.setValue(overrides.field_inline.value);

    let modal = new ModalBuilder()
        .setCustomId(overrides?.customId || "ceb_fields_add")
        .setTitle(overrides?.title || `Add a field`)
        .setComponents(
            new ActionRowBuilder()
                .setComponents(field_name_question),

            new ActionRowBuilder()
                .setComponents(field_value_question),

            new ActionRowBuilder()
                .setComponents(field_inline_question)
        );

    return modal;
};
