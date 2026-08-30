const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: "Get a user's avatar in high quality.",
  category: 'Info',
  cooldown: 5,
  async execute(client, message, args) {
    const target = message.mentions.users.first() || message.author;
    const member = message.guild?.members.cache.get(target.id);
    const type = args[1] === 'server' || args[1] === 'guild' ? 'guild' : 'global';

    let avatarURL, avatarType;
    if (type === 'guild' && member?.avatar) {
      avatarURL = member.displayAvatarURL({ dynamic: true, size: 4096 });
      avatarType = 'Server Avatar';
    } else {
      avatarURL = target.displayAvatarURL({ dynamic: true, size: 4096 });
      avatarType = 'Global Avatar';
    }

    if (!avatarURL) {
      return message.reply({
        embeds: [new EmbedBuilder().setTitle('🖼️ Avatar').setColor(0xed4245).setDescription(`❌ **${target.tag} does not have a custom avatar.**`).setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() }).setTimestamp()]
      });
    }

    const isAnimated = avatarURL.endsWith('.gif');
    const sizes = [256, 512, 1024, 2048, 4096];
    const links = sizes.map(size => `🖼️ [${size}](${avatarURL.replace('4096', size)})`).join(' • ');

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${target.username}'s ${avatarType}`)
      .setColor(0x5865f2)
      .setImage(avatarURL)
      .setDescription(`**${target.tag}** (<@${target.id}>)`)
      .addFields(
        { name: 'Avatar Details', value: `**Type:** ${avatarType}\n**Animated:** ${isAnimated ? 'Yes' : 'No'}\n**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Direct Links', value: links, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};