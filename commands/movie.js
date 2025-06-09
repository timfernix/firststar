const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const movieDB = require('../movieDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movie')
        .setDescription('Movie night suggestions and management')
        .addSubcommand(sub =>
            sub.setName('suggest')
                .setDescription('Suggest a movie for movie night!')
                .addStringOption(opt =>
                    opt.setName('title')
                        .setDescription('Movie title')
                        .setRequired(true)
                        .setMaxLength(255))
                .addStringOption(opt =>
                    opt.setName('description')
                        .setDescription('Description or custom text')
                        .setRequired(true)
                        .setMaxLength(1000))
                .addBooleanOption(opt =>
                    opt.setName('canstream')
                        .setDescription('Can you stream this movie?')
                        .setRequired(true))

        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Show all current movie night suggestions.')
        )
        .addSubcommand(sub =>
            sub.setName('watched')
                .setDescription('Mark a movie as watched (removes it from the list).')
                .addIntegerOption(opt =>
                    opt.setName('id')
                        .setDescription('ID of the suggestion to remove')
                        .setRequired(true))
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // /movie suggest
        if (sub === 'suggest') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description') || '';
            const canStream = interaction.options.getBoolean('canstream');

            if (title.length > 255) {
                return interaction.reply({ content: 'Title too long (max 255 characters).', flags: 64 });
            }
            if (description.length > 1000) {
                return interaction.reply({ content: 'Description too long (max 1000 characters).', flags: 64 });
            }

            movieDB.addSuggestion(interaction.user.id, title, description, canStream, (err) => {
                if (err) {
                    return interaction.reply({ content: 'Error saving your suggestion.', flags: 64 });
                }
                interaction.reply({ content: 'Your movie suggestion has been saved!', flags: 64 });
            });
        }

        // /movie list
        else if (sub === 'list') {
            movieDB.getSuggestions(async (err, results) => {
                if (err || !results.length) {
                    return interaction.reply({ content: 'No movie suggestions found.', flags: 64 });
                }
                let entries = [];
                for (const row of results) {
                    let userMention;
                    try {
                        const user = await interaction.client.users.fetch(row.user_id);
                        userMention = user ? `<@${user.id}>` : row.user_id;
                    } catch {
                        userMention = row.user_id;
                    }
                    const emoji = row.can_stream ? '✅' : '❌';
                    entries.push(
                        `**${row.title}** (id: ${row.id})\nSuggested by: ${userMention}\nCan Stream: ${emoji}\n${row.description || '_No description_'}`
                    );
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎬 Movie Night Suggestions')
                    .setColor(0x8e5cff);

                let desc = '';
                let fields = [];
                for (const entry of entries) {
                    if ((desc + '\n\n' + entry).length <= 4096) {
                        desc += (desc ? '\n\n' : '') + entry;
                    } else if (entry.length <= 1024) {
                        fields.push({ name: '\u200B', value: entry });
                    } else {
                        let remaining = entry;
                        while (remaining.length > 0) {
                            fields.push({ name: '\u200B', value: remaining.slice(0, 1024) });
                            remaining = remaining.slice(1024);
                        }
                    }
                }
                if (desc) embed.setDescription(desc);
                for (const field of fields) embed.addFields(field);

                interaction.reply({ embeds: [embed] });
            });
        }

        // /movie watched
        else if (sub === 'watched') {
            if (interaction.user.id !== '') {
                return interaction.reply({ content: 'Only the server owner can use this command.', flags: 64 });
            }
            const id = interaction.options.getInteger('id');
            movieDB.deleteSuggestion(id, (err, result) => {
                if (err || result.affectedRows === 0) {
                    return interaction.reply({ content: 'Could not remove this suggestion.', flags: 64 });
                }
                interaction.reply({ content: 'Suggestion removed from the list.', flags: 64 });
            });
        }
    }
};
