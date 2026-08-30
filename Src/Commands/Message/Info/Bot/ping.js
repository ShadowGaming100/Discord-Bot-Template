const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  aliases: ['pong', 'latency'],
  description: 'Check the bot latency and connection status.',
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const sent = await message.reply('🏓 Pinging...');
    const botPing = client.ws.ping;
    const apiPing = sent.createdTimestamp - message.createdTimestamp;
    const totalPing = botPing + apiPing;

    let status = '🟢 Excellent';
    let statusColor = 0x00ff00;
    if (totalPing > 200) {
      status = '🟡 Good'; statusColor = 0xffff00;
    }
    if (totalPing > 400) {
      status = '🟠 Moderate'; statusColor = 0xffa500;
    }
    if (totalPing > 600) {
      status = '🔴 Poor'; statusColor = 0xff0000;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏓 Bot Ping & Latency')
      .setColor(statusColor)
      .setDescription(`**Connection Status:** ${status}`)
      .addFields(
        { name: '🤖 Bot Latency', value: `\`${botPing}ms\``, inline: true },
        { name: '🌐 API Latency', value: `\`${apiPing}ms\``, inline: true },
        { name: '⚡ Total Response', value: `\`${totalPing}ms\``, inline: true }
      )
      .addFields({
        name: '📊 Performance Guide',
        value: ['```diff', '+ 🟢 0-200ms   : Excellent', '+ 🟡 200-400ms : Good', '- 🟠 400-600ms : Moderate', '- 🔴 600ms+    : Poor', '```'].join('\n'),
        inline: false
      })
      .setFooter({ text: 'Lower is better! • Last updated', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return sent.edit({ content: null, embeds: [embed] });
  }
};