const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'serverbanner',
  aliases: ['sbanner', 'guildbanner'],
  description: 'Get the server banner',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message) {
    const guild = message.guild;
    const color = guild.members.me?.displayHexColor || Colors.Blurple;

    if (!guild.banner) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🏰 Server Banner')
            .setColor(color)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setDescription(`❌ **${guild.name} does not have a server banner.**`)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()
        ]
      });
    }

    const bannerURL = guild.bannerURL({ size: 4096, dynamic: true });
    const links = [
      `🖼️ [PNG](${guild.bannerURL({ size: 4096, extension: 'png' })})`,
      `🖼️ [JPG](${guild.bannerURL({ size: 4096, extension: 'jpg' })})`,
      `🖼️ [WEBP](${guild.bannerURL({ size: 4096, extension: 'webp' })})`
    ].join(' • ');

    const embed = new EmbedBuilder()
      .setTitle('🏰 Server Banner')
      .setColor(color)
      .setImage(bannerURL)
      .setDescription(`**${guild.name}**`)
      .addFields(
        { name: '📊 Server Details', value: `**Members:** ${guild.memberCount}\n**Boost Level:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount}`, inline: true },
        { name: '🔗 Direct Links', value: links, inline: true }
      )
      .setFooter({ text: `Server ID: ${guild.id} • Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};