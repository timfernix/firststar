const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('Checks if the Minecraft server is online.'),
    async execute(interaction) {
        const ip = '';
        const url = `https://api.mcstatus.io/v2/status/java/${ip}`;

        try {
            await interaction.deferReply();

            const response = await fetch(url);
            if (!response.ok) {
                await interaction.editReply('❌ Could not reach the status API.');
                return;
            }
            const data = await response.json();

            if (!data.online) {
                await interaction.editReply(`❌ The server **${ip}** is offline or unreachable.`);
                return;
            }

            const playerCount = data.players.online;
            const maxPlayers = data.players.max;
            const playerList = data.players.list && data.players.list.length > 0
                ? data.players.list.map(p => p.name_clean).join(', ')
                : 'No players online';

            const embed = new EmbedBuilder()
                .setTitle(`🟢 ${data.motd.clean}`)
                .setDescription(`**Server:** ${ip}\n**Version:** ${data.version.name_clean}`)
                .addFields(
                    { name: 'Players', value: `${playerCount} / ${maxPlayers}`, inline: true },
                    { name: 'Online Players', value: playerList, inline: false }
                )
                .setColor(0x43b581);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('❌ Error fetching server status.');
        }
    }
};
