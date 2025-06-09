const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Show the server rules.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('𓆩✧𓆪 Star Guardian Protocols')
            .setColor(0x8e5cff)
            .setDescription('To preserve the light of our constellation, all Star Guardians must follow these sacred protocols.')
            .addFields(
                {   name: '1. ✧ Radiant Respect',
                    value: 'Guardians treat each other with empathy and kindness. Harmful words or toxic behavior invite corruption.'
                },
                {   name: '2. ✧ Signal Harmony',
                    value: 'Avoid spamming, excessive trolling, ghost pings or disruptive pinging. Keep the starlines clear.'
                },
                {   name: '3. ✧ Voidbound Content',
                    value: 'The corruption spreads through NSFW, racist, or offensive material. Such darkness is forbidden.'
                },
                {   name: '4. ✧ Starbound Privacy',
                    value: 'Do not trade or exchange private data in public starlanes. Our bonds are built on trust.'
                },
                {   name: '5. ✧ Channel Constellations',
                    value: 'Use each channel as intended by the cosmic flow. Chaos in purpose weakens the light.'
                }
            )
            .setFooter({ text: '𓆩✧𓆪  Together, we protect the First Star.' })
            .setThumbnail('attachment://sg.webp'); 

        await interaction.reply({ content: 'Rules have been posted in this channel.', flags: 64 });

        await interaction.channel.send({
            embeds: [embed],
            files: [path.join(__dirname, '../assets/sg.webp')]
        });
    }
};
