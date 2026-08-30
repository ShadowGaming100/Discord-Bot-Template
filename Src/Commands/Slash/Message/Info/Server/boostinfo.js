const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'boostinfo',
  aliases: ['boost', 'boosts'],
  description: 'Display server boost information',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message) {
    const guild = message.guild;
    const boosters = guild.members.cache.filter(m => m.premiumSince);

    const embed = new EmbedBuilder()
      .setTitle('🚀 Boost Info')
      .setColor(Colors.Gold)
      .setDescription(`**${guild.name}**`)
      .addFields(
        { name: '✨ Boost Stats', value: `**Tier:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount || 0}\n**Boosters:** ${boosters.size}`, inline: true },
        { name: '💎 Active Boosters', value: boosters.size > 0 ? boosters.map(m => `• ${m.user.tag}`).slice(0, 10).join('\n') : 'None', inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};