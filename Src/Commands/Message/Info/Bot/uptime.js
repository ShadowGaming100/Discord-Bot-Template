const { EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../../../../Functions/format-utils');

module.exports = {
  name: 'uptime',
  aliases: ['up'],
  description: 'Check how long the bot has been running.',
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const uptimeSeconds = process.uptime();
    const startTime = new Date(Date.now() - uptimeSeconds * 1000);
    const uptimeFormatted = formatUptime(uptimeSeconds);

    const embed = new EmbedBuilder()
      .setTitle('⏱️ Bot Uptime')
      .setColor(0x00c2ff)
      .setDescription(`I've been running continuously for:\n**${uptimeFormatted}**`)
      .addFields(
        { name: '📅 Started On', value: `<t:${Math.floor(startTime.getTime() / 1000)}:F>\n(<t:${Math.floor(startTime.getTime() / 1000)}:R>)`, inline: true },
        { name: '🔄 Current Status', value: '✅ **Online & Operational**\n🟢 **Active**', inline: true },
        { name: '💾 Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
      )
      .setFooter({ text: 'Keeping your server awesome 24/7!', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};