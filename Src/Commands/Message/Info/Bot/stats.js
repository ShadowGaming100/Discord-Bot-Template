const { EmbedBuilder, version: discordVersion } = require('discord.js');
const os = require('os');
const { formatUptime } = require('../../../../Functions/format-utils');

module.exports = {
  name: 'botstats',
  aliases: ['stats', 'botinfo'],
  description: 'Display comprehensive bot statistics',
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const uptimeSeconds = process.uptime();
    const guilds = client.guilds.cache;
    const members = guilds.reduce((acc, g) => acc + g.memberCount, 0);
    const channels = guilds.reduce((acc, g) => acc + g.channels.cache.size, 0);
    const memory = process.memoryUsage();
    const memoryUsage = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (memory.heapTotal / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle('📊 Bot Statistics')
      .setColor(0x5865f2)
      .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
      .setDescription(`Comprehensive statistics for ${client.user.username}`)
      .addFields(
        { name: '📈 General Stats', value: `**Servers:** ${guilds.size}\n**Users:** ${members.toLocaleString()}\n**Channels:** ${channels}`, inline: true },
        { name: '⚙️ System Info', value: `**Uptime:** ${formatUptime(uptimeSeconds)}\n**Memory:** ${memoryUsage}MB / ${totalMemory}MB\n**CPU:** ${os.cpus()[0].model.split('@')[0].trim()}`, inline: true },
        { name: '💻 Technical Data', value: `**Discord.js:** v${discordVersion}\n**Node.js:** ${process.version}\n**Platform:** ${os.platform()} ${os.arch()}`, inline: true },
        { name: '📂 Command Info', value: `**Commands:** ${client.slashCommands.size + client.messageCommands.size}\n**Categories:** ${new Set([...client.slashCommands.values()].map(c => c.category)).size}`, inline: true },
        { name: '🔗 Connections', value: `**WebSocket:** ${client.ws.ping}ms`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Always improving your server experience', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};