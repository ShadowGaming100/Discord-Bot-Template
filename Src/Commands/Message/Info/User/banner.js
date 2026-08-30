const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'userbanner',
  aliases: ['ubanner', 'banner'],
  description: "Get a user's profile banner.",
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const user = message.mentions.users.first() || message.author;
    const fetchedUser = await client.users.fetch(user.id, { force: true });

    if (!fetchedUser.banner) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎨 User Banner')
            .setColor(0xed4245)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(`❌ **${user.tag} does not have a profile banner.**`)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()
        ]
      });
    }

    const bannerURL = fetchedUser.bannerURL({ size: 4096, dynamic: true });
    const isAnimated = fetchedUser.banner.startsWith('a_');
    const png = fetchedUser.bannerURL({ size: 4096, extension: 'png' });
    const jpg = fetchedUser.bannerURL({ size: 4096, extension: 'jpg' });
    const webp = fetchedUser.bannerURL({ size: 4096, extension: 'webp' });
    const links = [`🖼️ [PNG](${png})`, `🖼️ [JPG](${jpg})`, `🖼️ [WEBP](${webp})`].join(' • ');

    const embed = new EmbedBuilder()
      .setTitle('🎨 User Banner')
      .setColor(fetchedUser.hexAccentColor || 0x5865f2)
      .setImage(bannerURL)
      .setDescription(`**${user.tag}**`)
      .addFields(
        { name: 'Banner Details', value: `**Animated:** ${isAnimated ? 'Yes' : 'No'}\n**Accent Color:** ${fetchedUser.hexAccentColor || 'Default'}`, inline: true },
        { name: 'Direct Links', value: links, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};