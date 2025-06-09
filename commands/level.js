const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpDB = require('../xpDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Show your current XP and level.'),
    async execute(interaction) {
        xpDB.getXP(interaction.user.id, (row) => {
            if (!row) {
                interaction.reply({ content: 'You have no XP yet.', flags: 64 });
            } else {
                const nextLevelXP = row.level * 100;
                const embed = new EmbedBuilder()
                    .setTitle(`✨ ${interaction.user.username}'s Starlight Progress ✨`)
                    .setColor(0x8e5cff)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        { name: 'Level', value: `${row.level}`, inline: true },
                        { name: 'XP', value: `${row.xp} / ${nextLevelXP}`, inline: true },
                        { name: 'Progress', value: `▰`.repeat(Math.floor((row.xp/nextLevelXP)*10)).padEnd(10, '▱') }
                    )
                    .setFooter({ text: 'Keep shining and level up your constellation!' });
                interaction.reply({ embeds: [embed] });
            }
        });
    }
};
