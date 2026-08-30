const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'userid',
  aliases: ['id', 'uid'],
  description: "Get a user's Discord ID",
  category: 'Info',
  cooldown: 3,
  async execute(client, message) {
    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setTitle('🆔 User ID')
      .setColor(0x5865f2)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(`**${user.tag}**`)
      .addFields(
        { name: 'User ID', value: `\`\`\`\n${user.id}\n\`\`\``, inline: false },
        { name: 'Bot Account', value: user.bot ? 'Yes 🤖' : 'No 👤', inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};