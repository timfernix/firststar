const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpDB = require('../xpDatabase');

function totalXPForLevel(level) {
    return Array.from({length: level}, (_, i) => (i + 1) * 100).reduce((a, b) => a + b, 0);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Show your current XP and level.'),
    async execute(interaction) {
        xpDB.getXP(interaction.user.id, (row) => {
            if (!row) {
                interaction.reply({ content: 'You have no XP yet.', flags: 64 });
            } else {
                const currentLevelXP = totalXPForLevel(row.level - 1);
                const nextLevelXP = totalXPForLevel(row.level);
                const progressRaw = (row.xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
                const progress = Math.max(0, Math.min(1, progressRaw)); 
                const progressBar = '▰'.repeat(Math.round(progress * 10)).padEnd(10, '▱');

                const embed = new EmbedBuilder()
                    .setTitle(`✨ ${interaction.user.username}'s Starlight Progress ✨`)
                    .setColor(0x8e5cff)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        { name: 'Level', value: `${row.level}`, inline: true },
                        { name: 'XP', value: `${row.xp - currentLevelXP} / ${nextLevelXP - currentLevelXP}`, inline: true },
                        { name: 'Progress', value: progressBar }
                    )
                    .setFooter({ text: 'Keep shining and level up your constellation!' });
                interaction.reply({ embeds: [embed] });
            }
        });
    }
};
