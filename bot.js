const { Client, GatewayIntentBits, EmbedBuilder, Collection, REST, Routes, GuildMemberFlagsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const xpDB = require('./xpDatabase');

const TOKEN = '';
const CLIENT_ID = ''; 
const GUILD_ID = ''; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessagePolls
    ]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
});

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered.');
    } catch (error) {
        console.error(error);
    }
})();


client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const hadCompleted = oldMember.flags?.has?.(GuildMemberFlagsBitField.Flags.CompletedOnboarding);
    const hasCompleted = newMember.flags?.has?.(GuildMemberFlagsBitField.Flags.CompletedOnboarding);

    if (!hadCompleted && hasCompleted) {
        const chosenRoles = newMember.roles.cache
            .filter(role => role.id !== newMember.guild.id)
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'No roles selected yet';

        const embed = new EmbedBuilder()
            .setTitle('Welcome to Starlight Nexus ✦彡')
            .setDescription(`Welcome, new Guardian ${newMember}\nYou’ve been chosen by the First Star to join our constellation! ✨`)
            .setColor(0xb72f72)
            .setImage('attachment://welcome.jpg')
            .addFields(
                { name: 'Your Choices', value: chosenRoles }
            )
            .setFooter({ text: 'May the light of the stars guide you!' });

        const channel = newMember.guild.channels.cache.get('');
        if (channel && channel.isTextBased()) {
            await channel.send({
                embeds: [embed],
                files: [require('path').join(__dirname, 'assets/welcome.jpg')]
            });
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId !== '') return;

    if (
        interaction.commandName === 'movie' &&
        interaction.options.getSubcommand() === 'watched' &&
        interaction.user.id !== ''
    ) {
        await interaction.reply({ content: 'You are not allowed to use this command.', flags: 64 });
        return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command.', flags: 64 });
    }
});

const xpCooldown = new Map();

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild || message.guild.id !== '') return;
    if (message.channel.id === '') return;

    const now = Date.now();
    const cooldown = 30 * 1000; 
    const lastXP = xpCooldown.get(message.author.id) || 0;

    if (now - lastXP < cooldown) return; 

    xpCooldown.set(message.author.id, now);

    const randomXP = Math.floor(Math.random() * 11) + 5;
    xpDB.addXP(message.author.id, randomXP);
    console.log(`Added ${randomXP} XP to ${message.author.tag}.`);

    setTimeout(() => {
        xpDB.getXP(message.author.id, async (row) => {
            if (!row) return;
            const member = await message.guild.members.fetch(message.author.id);
            const levelRoles = [
                { level: 250, id: '' },
                { level: 100, id: '' },
                { level: 50, id: '' },
                { level: 1,  id: '' }
            ];
            const earned = levelRoles.find(r => row.level >= r.level);
            if (!earned) return;

            const toRemove = levelRoles.filter(r => r.id !== earned.id).map(r => r.id);
            await member.roles.remove(toRemove).catch(console.error);
            if (!member.roles.cache.has(earned.id)) {
                await member.roles.add(earned.id).catch(console.error);
            }
        });
    }, 1000); 
});

client.once('ready', async () => {
    console.log(`First Star is ready as ${client.user.tag}!`);
    client.user.setPresence({
        activities: [{ name: 'the stars ✦彡', type: 3 }],
        status: 'online'
    });

    const guild = client.guilds.cache.get('');
    if (!guild) return;
    const levelRoles = [
        { level: 250, id: '' },
        { level: 100, id: '' },
        { level: 50, id: '' },
        { level: 1,  id: '' }
    ];
    const members = await guild.members.fetch();
    members.forEach(member => {
        if (member.user.bot) return;
        xpDB.getXP(member.id, async (row) => {
            if (!row) return;
            const earned = levelRoles.find(r => row.level >= r.level);
            if (!earned) return;
            const toRemove = levelRoles.filter(r => r.id !== earned.id).map(r => r.id);
            await member.roles.remove(toRemove).catch(() => {});
            if (!member.roles.cache.has(earned.id)) {
                await member.roles.add(earned.id).catch(() => {});
            }
        });
    });
});

client.login(TOKEN);
