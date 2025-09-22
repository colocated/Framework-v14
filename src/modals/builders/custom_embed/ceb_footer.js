const { ModalSubmitInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const timestring = require('timestring');

const StatusEmbedBuilder = require('../../../structures/funcs/tools/createStatusEmbed');

/** @typedef {import("../../../structures/funcs/util/Types").ExtendedClient} ExtendedClient */

module.exports = {
    id: "ceb_footer",

    /**
    * 
    * @param {ModalSubmitInteraction} interaction 
    * @param {ExtendedClient} client 
    */
    async execute(interaction, client) {
        const statusEmbed = new StatusEmbedBuilder("Footer", { name: "Embed Builder", iconURL: client.user.displayAvatarURL() });

        let enteredData = {
            "text": interaction.fields.getTextInputValue("ceb_footer_text_i") ?? "",
            "image": interaction.fields.getTextInputValue("ceb_footer_icon_i") ?? "",
            "timestamp": interaction.fields.getTextInputValue("ceb_footer_timestamp_i") ?? ""
        };

        if (enteredData.image && !enteredData.text) {
            return interaction.reply({
                embeds: [statusEmbed.create("You must provide a text if you want to set an icon.", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (enteredData.image && !isURL(enteredData.image)) {
            return interaction.reply({
                embeds: [statusEmbed.create("URLs must start with `http://` or `https://`, and be a well-formed URL.\nExample: `https://google.com`, `https://google.ie/search`", 'Red')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (enteredData.timestamp) {
            if (!isAcceptableTimestamp(enteredData.timestamp)) {
                return interaction.reply({
                    embeds: [statusEmbed.create("Invalid timestamp format. Please provide ISO 8601, a Discord timestamp, or relative time like `in 2 days`.", 'Red')],
                    flags: MessageFlags.Ephemeral
                });
            }
            try {
                enteredData.timestamp = toISO8601(enteredData.timestamp);
            } catch (e) {
                return interaction.reply({
                    embeds: [statusEmbed.create(e.message, 'Red')],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (enteredData.image) {
            if (!process.env.ALLOWED_IMAGE_HOSTNAMES?.split(',').includes(new URL(enteredData.image).hostname) && process.env.ALLOWED_IMAGE_HOSTNAMES !== "*") {
                return interaction.reply({
                    embeds: [
                        statusEmbed
                            .create("The icon URL must be from a whitelisted domain.\n> You may be required to use a **Direct Image URL**\n> e.g. `i.imgur.com` instead of `imgur.com`", 'Red')
                            .setFields([
                                { name: "Your URL", value: enteredData.image, inline: false },
                                { name: "Allowed Hostnames", value: "`" + process.env.ALLOWED_IMAGE_HOSTNAMES.split(",").join("`, `") + "`", inline: false }
                            ])
                    ],
                    flags: MessageFlags.Ephemeral
                });
            };

            try {
                const res = await fetch(enteredData.image, { method: 'HEAD' });
                const contentType = res.headers.get('content-type');
                let supportedTypes = ['image/', 'video/'];

                if (!res.ok) throw new Error(`Invalid response: ${res.status} ${res.statusText}`);
                if (!supportedTypes.some(type => contentType?.includes(type))) throw new Error(`Invalid content type: \`${contentType}\``);
            } catch (e) {
                return interaction.reply({
                    embeds: [
                        statusEmbed
                            .create("The icon URL must be a valid image URL.\n\n> **Note:** The image host must return a [MIME Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types) of `image/*` or `video/*` for the Icon URL to be accepted.", 'Red')
                            .setFields([
                                { name: "Error", value: e.message, inline: false },
                                { name: "Your URL", value: enteredData.image, inline: false }
                            ])
                    ],
                    flags: MessageFlags.Ephemeral
                });
            }
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
            text: customEmbed.footer?.text ?? "",
            iconURL: customEmbed.footer?.iconURL ?? "",
            timestamp: customEmbed?.timestamp ?? ""
        };

        // Check if values have changed
        if (enteredData.text === existingData.text) enteredData.text = null;
        if (enteredData.image === existingData.iconURL) enteredData.image = null;
        if (enteredData.timestamp === existingData.timestamp) enteredData.timestamp = null;

        if (enteredData.text === null && enteredData.image === null && enteredData.timestamp === null) {
            return interaction.reply({
                embeds: [statusEmbed.create("There were no changes made, exiting.", 'Yellow')],
                flags: MessageFlags.Ephemeral
            });
        }

        let newEmbed = EmbedBuilder.from(customEmbed);
        let doneEmbed = statusEmbed.create("The footer has been successfully updated.", 'Green');

        const footerData = {
            text: enteredData.text,
            icon_url: enteredData.image
        };

        // Handle footer updates
        if (Object.values(footerData).some(value => value !== null)) {
            if (!newEmbed.data.footer) newEmbed.data.footer = {};
            
            Object.entries(footerData).forEach(([key, value]) => {
                if (value === null) return;
                if (value.length < 1) {
                    delete newEmbed.data.footer[key];
                } else {
                    newEmbed.data.footer[key] = value;
                }
            });
        }

        // Handle timestamp separately
        if (enteredData.timestamp !== null) {
            if (enteredData.timestamp.length < 1) {
                delete newEmbed.data.timestamp;
            } else {
                newEmbed.data.timestamp = enteredData.timestamp;
            }
        }

        // Add fields to status embed
        const updates = {
            'Text': enteredData.text,
            'Icon URL': enteredData.image,
            'Timestamp': enteredData.timestamp
        };

        Object.entries(updates).forEach(([field, value]) => {
            if (value !== null) {
                doneEmbed.addFields({ 
                    name: field, 
                    value: value.length ? value : '> Unset', 
                    inline: false
                });
            }
        });

        // According to Discord.js, there has to be a description/title if there is only a timestamp in the footer
        // However having a footer text/icon allows for no title/description
        const footerElementPresent = (newEmbed.data.footer && (newEmbed.data.footer.text || newEmbed.data.footer.icon_url));
        if (footerElementPresent && newEmbed.data.description == "\u200b") newEmbed.setDescription(null);
        if (!newEmbed.data.title && !newEmbed.data.description && !footerElementPresent) newEmbed.setDescription("\u200b");

        await interaction.message.edit({ embeds: [newEmbed, instructionsEmbed] });
        return interaction.reply({ embeds: [doneEmbed], flags: MessageFlags.Ephemeral });
    }
};

function isURL(string) {
    return /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?$/.test(string)
};

function normalizeRelativeTime(input) {
    return input
        .replace(/\bin a\b/gi, "in 1")
        .replace(/\ban hour\b/gi, "1 hour")
        .replace(/\ba minute\b/gi, "1 minute")
        .replace(/\ba second\b/gi, "1 second");
}

function toISO8601(input) {
    // Unix seconds
    if (/^\d{9,12}$/.test(input)) {
        return new Date(parseInt(input, 10) * 1000).toISOString();
    }

    // Discord-style <t:1234567890:R>
    const discordMatch = input.match(/^<t:(\d{9,12})(:[a-zA-Z])?>$/);
    if (discordMatch) {
        return new Date(parseInt(discordMatch[1], 10) * 1000).toISOString();
    }

    // ISO 8601 string (return as is if valid)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (isoRegex.test(input)) {
        return input;
    }

    // Relative time using timestring with basic NLP normalization
    try {
        const normalizedInput = normalizeRelativeTime(input);
        const timestamp = timestring(normalizedInput, 'ms');
        const date = new Date(Date.now() + timestamp);
        return date.toISOString();
    } catch {
        throw new Error("Invalid timestamp format. Please provide a valid timestamp.");
    }
};

function isAcceptableTimestamp(input) {
    // ISO 8601 (with optional Z timezone)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (isoRegex.test(input)) return true;

    // Discord-style <t:1234567890:R> or raw digits
    const discordRegex = /^<?t:(\d{9,12})(:[a-zA-Z])?>?$|^\d{9,12}$/;
    if (discordRegex.test(input)) return true;

    // Relative time via timestring with small natural language support
    try {
        const normalizedInput = normalizeRelativeTime(input);
        timestring(normalizedInput, 'ms');
        return true;
    } catch {
        return false;
    }
};
