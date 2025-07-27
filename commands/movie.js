const { SlashCommandBuilder, EmbedBuilder, PollLayoutType } = require('discord.js');
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
                    opt.setName('link')
                        .setDescription('Link to more information about the movie')
                        .setRequired(true)
                        .setMaxLength(1000))
                .addBooleanOption(opt =>
                    opt.setName('canstream')
                        .setDescription('Can you/Tim stream this movie?')
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
        )
        .addSubcommand(sub =>
            sub.setName('random')
                .setDescription('Starts a poll for a random movie suggestion')
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // /movie suggest
        if (sub === 'suggest') {
            const title = interaction.options.getString('title');
            const link = interaction.options.getString('link') || '';
            const canStream = interaction.options.getBoolean('canstream');

            if (title.length > 255) {
                return interaction.reply({ content: 'Title too long (max 255 characters).', flags: 64 });
            }
            if (link.length > 1000) {
                return interaction.reply({ content: 'Link too long (max 1000 characters).', flags: 64 });
            }

            movieDB.addSuggestion(interaction.user.id, title, link, canStream, (err) => {
                if (err) {
                    return interaction.reply({ content: 'Error saving your suggestion.', flags: 64 });
                }
                interaction.reply('Your movie suggestion has been saved!');
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
                        `**${row.title}** (id: ${row.id})\nSuggested by: ${userMention}\nCan Stream: ${emoji}\n[More info](${row.link})`
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
                interaction.reply(':white_check_mark: Movie watched - removed from the watchlist.');
            });
        }

        // /movie random
        else if (sub === 'random') {
            movieDB.getSuggestions(async (err, results) => {
                if (err || !results.length) {
                    return interaction.reply({ content: 'No movie suggestions found.', flags: 64 });
                }
                const random = results[Math.floor(Math.random() * results.length)];
                let userMention;
                try {
                    const user = await interaction.client.users.fetch(random.user_id);
                    userMention = user ? `<@${user.id}>` : random.user_id;
                } catch {
                    userMention = random.user_id;
                }
                let userName;
                try {
                    const user = await interaction.client.users.fetch(random.user_id);
                    userName = user ? user.username : random.user_id;
                } catch {
                    userName = random.user_id;
                }
                const emoji = random.can_stream ? '✅' : '❌';

                await interaction.reply({
                    content: `Random movie suggestion picked:\n**${random.title}** (id: ${random.id})\nSuggested by: ${userMention}\nCan Stream: ${emoji}\nA poll will be started in this channel!`,
                    flags: 64
                });

                await interaction.channel.send({
                    poll: {
                        question: {
                            text: `Should we watch ${random.title}?\nSuggested by ${userName}`
                        },
                        answers: [
                            { emoji: '👍', text: 'Yes' },
                            { emoji: '👎', text: 'No' },
                            { emoji: '🤷', text: "Cant decide / Not taking part" }
                        ],
                        duration: 1, 
                        allowMultiselect: false,
                        layoutType: PollLayoutType.Default
                    }
                });
            });
        }
    }
};
