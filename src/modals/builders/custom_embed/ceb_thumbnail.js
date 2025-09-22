const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_thumbnail",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Thumbnail & Image", { name: "Embed Builder", iconURL: client.user.displayAvatarURL() });

        let thumbnail = interaction.fields.getTextInputValue("ceb_thumbnail_i");
        let image = interaction.fields.getTextInputValue("ceb_image_i");

        if ((thumbnail && !isURL(thumbnail)) || (image && !isURL(image))) {
            return interaction.reply({
                embeds: [statusEmbed.create("URLs must be a well-formed.\nExample: `https://google.com`, `https://google.ie/search`", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        for (const [type, url] of Object.entries({ thumbnail, image })) {
            if (!url) continue;

            if (!process.env.ALLOWED_IMAGE_HOSTNAMES?.split(',').includes(new URL(url).hostname) && process.env.ALLOWED_IMAGE_HOSTNAMES !== "*") {
                return interaction.reply({
                    embeds: [
                        statusEmbed
                            .create("The " + type + " URL must be from a whitelisted domain.\n> You may be required to use a **Direct Image URL**\n> e.g. `i.imgur.com` instead of `imgur.com`", 'Red')
                            .setFields([
                                { name: "Your URL", value: url, inline: false },
                                { name: "Allowed Hostnames", value: "`" + process.env.ALLOWED_IMAGE_HOSTNAMES.split(",").join("`, `") + "`", inline: false }
                            ])
                    ],
                    flags: MessageFlags.Ephemeral
                });
            };

            try {
                const res = await fetch(url, { method: 'HEAD' });
                const contentType = res.headers.get('content-type');
                let supportedTypes = ['image/', 'video/'];

                if (!res.ok) throw new Error(`Invalid response: ${res.status} ${res.statusText}`);
                if (!supportedTypes.some(resContentType => contentType?.includes(resContentType))) throw new Error(`Invalid content type: \`${contentType}\``);
            } catch (e) {
                return await interaction.reply({
                    embeds: [
                        statusEmbed
                            .create("URLs must be a valid images.\n\n> **Note:** The image host must return a [MIME Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types) of `image/*` or `video/*` for the URL to be accepted.", 'Red')
                            .setFields([
                                { name: "Error", value: e.message, inline: false },
                                { name: "Your URL", value: url, inline: false }
                            ])
                    ],
                    flags: MessageFlags.Ephemeral
                });
            };
        };

        const customEmbed = interaction.message.embeds[0];
        const instructionsEmbed = interaction.message.embeds[1];

        if (interaction.message.embeds.length != 2) {
            return interaction.reply({
                embeds: [statusEmbed.create("There was an error fetching the embeds, have they been deleted?", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        const existingData = {
            thumbnail: customEmbed?.thumbnail,
            image: customEmbed?.image
        };

        // Check if values have changed
        if (thumbnail === existingData.thumbnail?.url) thumbnail = null;
        if (image === existingData.image?.url) image = null;

        if (thumbnail == null && image == null) {
            return interaction.reply({
                embeds: [statusEmbed.create("No changes detected.", 'Yellow')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newEmbed = EmbedBuilder.from(customEmbed);
        let doneEmbed = statusEmbed.create("The author has been successfully updated.", 'Green');

        const updates = [
            { field: "thumbnail", value: thumbnail },
            { field: "image", value: image }
        ];

        updates.forEach(({ field, value }) => {
            if (value == null) return;

            if (value.length < 1) delete newEmbed.data[field];
            else newEmbed.data[field] = { url: value };
            
            doneEmbed.addFields({ name: field.charAt(0).toUpperCase() + field.slice(1), value: value.length ? value : "> Unset", inline: false });
        });

        if ((newEmbed.data.thumbnail || newEmbed.data.image) && newEmbed.data.description === '\u200b') newEmbed.setDescription(null);
        if (!newEmbed.data.thumbnail && !newEmbed.data.image && newEmbed.data.description == null) newEmbed.setDescription('\u200b');

        await interaction.message.edit({ embeds: [newEmbed, instructionsEmbed] });
        return interaction.reply({ embeds: [doneEmbed], flags: MessageFlags.Ephemeral });
    }
};

function isURL(string) {
    return /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?$/.test(string)
};
