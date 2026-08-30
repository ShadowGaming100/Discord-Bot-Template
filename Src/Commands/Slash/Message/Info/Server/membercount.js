const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'membercount',
  aliases: ['members', 'mc'],
  description: 'Display member count statistics',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message) {
    const guild = message.guild;
    await guild.members.fetch();
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;

    const embed = new EmbedBuilder()
      .setTitle(`👥 Member Count — ${guild.name}`)
      .setColor(Colors.Blurple)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👥 Total', value: `**${total.toLocaleString()}**`, inline: true },
        { name: '👤 Humans', value: `**${humans.toLocaleString()}**`, inline: true },
        { name: '🤖 Bots', value: `**${bots.toLocaleString()}**`, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};