const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpDB = require('../xpDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starlight')
        .setDescription('Show the top starlight collectors.'),
    async execute(interaction) {
        xpDB.getTopUsers(10, async (rows) => {
            if (!rows || rows.length === 0) {
                return interaction.reply({ content: 'No Star Guardians have earned XP yet.', flags: 64 });
            }

            let leaderboard = '';
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                let userTag;
                try {
                    const user = await interaction.client.users.fetch(row.user_id);
                    userTag = user ? user.tag : row.user_id;
                } catch {
                    userTag = row.user_id;
                }
                leaderboard += `**${i + 1}.** ${userTag} — ✦ Level ${row.level} (${row.xp} XP)\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🌠 Starlight Leaderboard 🌠')
                .setColor(0xf7cfff)
                .setDescription('The brightest Star Guardians in our constellation:')
                .addFields({ name: 'Top 10', value: leaderboard })
                .setFooter({ text: 'Keep shining and climb the ranks!' });

            interaction.reply({ embeds: [embed] });
        });
    }
};
