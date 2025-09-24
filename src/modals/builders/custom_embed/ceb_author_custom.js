const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_author_custom",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        await interaction.deferUpdate();

        const statusEmbed = new StatusEmbedBuilder("Author", { name: "Embed Builder", iconURL: client.user.displayAvatarURL() });
        
        let name = interaction.fields.getTextInputValue("ceb_author_name_i");
        let iconURL = interaction.fields.getTextInputValue("ceb_author_icon_i");
        let url = interaction.fields.getTextInputValue("ceb_author_url_i");

        if (!name && !iconURL && !url) {
            return interaction.editReply({
                embeds: [statusEmbed.create("You must provide at least one value for the author.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (url && !name) {
            return interaction.editReply({
                embeds: [statusEmbed.create("You must provide a name if you want to set a URL.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if ((url && !isURL(url)) || iconURL && !isURL(iconURL)) {
            return interaction.editReply({
                embeds: [statusEmbed.create("URLs must start with `http://` or `https://`, and be a well-formed URL.\nExample: `https://google.com`, `https://google.ie/search`", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (iconURL) {
            if (!process.env.ALLOWED_IMAGE_HOSTNAMES?.split(',').includes(new URL(iconURL).hostname) && process.env.ALLOWED_IMAGE_HOSTNAMES !== "*") {
                return interaction.editReply({
                    embeds: [
                        statusEmbed
                            .create("The icon URL must be from a whitelisted domain.\n> You may be required to use a **Direct Image URL**\n> e.g. `i.imgur.com` instead of `imgur.com`", 'Red')
                            .setFields([
                                { name: "Your URL", value: iconURL, inline: false },
                                { name: "Allowed Hostnames", value: "`" + process.env.ALLOWED_IMAGE_HOSTNAMES.split(",").join("`, `") + "`", inline: false }
                            ])
                        ],
                    flags: MessageFlags.Ephemeral
                });
            };

            try {
                const res = await fetch(iconURL, { method: 'HEAD' });
                const contentType = res.headers.get('content-type');
                let supportedTypes = ['image/', 'video/'];

                if (!res.ok) throw new Error(`Invalid response: ${res.status} ${res.statusText}`);
                if (!supportedTypes.some(type => contentType?.includes(type))) throw new Error(`Invalid content type: \`${contentType}\``);
            } catch (e) {
                return await interaction.editReply({
                    embeds: [
                        statusEmbed
                            .create("The icon URL must be a valid image URL.\n\n> **Note:** The image host must return a [MIME Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types) of `image/*` or `video/*` for the Icon URL to be accepted.", 'Red')
                            .setFields([
                                { name: "Error", value: e.message, inline: false },
                                { name: "Your URL", value: iconURL, inline: false }
                            ])
                        ],
                    flags: MessageFlags.Ephemeral
                });
            }
        };

        const referencedMessage = await interaction.message.fetchReference();
        const customEmbed = referencedMessage.embeds[0];
        const instructionsEmbed = referencedMessage.embeds[1];

        if (referencedMessage.embeds.length != 2) {
            return interaction.editReply({
                embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        const existingData = {
            name: customEmbed.author?.name?.toString() || "",
            iconURL: customEmbed.author?.iconURL?.toString() || "",
            url: customEmbed.author?.url?.toString() || ""
        };

        // Check if values have changed
        if (name === existingData.name) name = null;
        if (iconURL === existingData.iconURL) iconURL = null;
        if (url === existingData.url) url = null;

        if (name === null && iconURL === null && url === null) {
            return interaction.editReply({
                embeds: [statusEmbed.create("There were no changes made, exiting.", 'Yellow')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newEmbed = EmbedBuilder.from(customEmbed);
        let doneEmbed = statusEmbed.create("The author has been successfully updated.", 'Green');

        const updates = [
            { field: 'name', setter: 'name', value: name },
            { field: 'iconURL', setter: 'icon_url', value: iconURL },
            { field: 'url', setter: 'url', value: url }
        ];

        updates.forEach(({ field, setter, value }) => {
            if (value == null) return;
            newEmbed.data.author ??= {};

            if (value.length < 1) delete newEmbed.data.author[setter];
            else newEmbed.data.author[setter] = value;
            
            doneEmbed.addFields({ name: field.charAt(0).toUpperCase() + field.slice(1), value: value.length ? value : "> Unset", inline: false });
        });

        if (newEmbed.data.author && (newEmbed.data.author.name || newEmbed.data.author.icon_url) && newEmbed.data.description == "\u200b") newEmbed.setDescription(null);
        if (!newEmbed.data.title && !newEmbed.data.description && (!newEmbed.data.author || !newEmbed.data.author.name)) newEmbed.setDescription("\u200b");

        await referencedMessage.edit({ embeds: [newEmbed, instructionsEmbed] });
        return interaction.followUp({ embeds: [doneEmbed], flags: MessageFlags.Ephemeral });
    }
};

function isURL(string) {
    return /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?$/.test(string)
};
