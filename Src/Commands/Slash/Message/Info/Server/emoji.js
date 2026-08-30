const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'emoji',
  aliases: ['emojis', 'emote'],
  description: 'Display server emoji information',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message, args) {
    const guild = message.guild;
    const emojis = guild.emojis.cache;
    const emojiInput = args[0];

    if (emojiInput) {
      const emoji = emojis.find(e => e.name === emojiInput || e.id === emojiInput.replace(/\D/g, ''));
      if (!emoji) {
        return message.reply(`❌ Could not find an emoji matching \`${emojiInput}\`.`);
      }
      const embed = new EmbedBuilder()
        .setTitle('🎨 Emoji Info')
        .setColor(guild.members.me?.displayHexColor || 0x5865f2)
        .setImage(emoji.url)
        .setDescription(`${emoji} **${emoji.name}**`)
        .addFields(
          { name: 'Emoji Details', value: `**ID:** ${emoji.id}\n**Animated:** ${emoji.animated ? 'Yes' : 'No'}\n**Managed:** ${emoji.managed ? 'Yes' : 'No'}`, inline: true },
          { name: '🔗 Direct Link', value: `🔗 [Open Emoji](${emoji.url})`, inline: true }
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎨 Server Emojis')
      .setColor(guild.members.me?.displayHexColor || 0x5865f2)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setDescription(`**${guild.name}** emoji overview`)
      .addFields(
        { name: '📊 Statistics', value: `**Total:** ${emojis.size}\n**Animated:** ${emojis.filter(e => e.animated).size}\n**Static:** ${emojis.filter(e => !e.animated).size}`, inline: true },
        { name: '🆕 Recent Emojis', value: emojis.size > 0 ? emojis.sort((a, b) => b.createdTimestamp - a.createdTimestamp).first(5).map(e => `${e} \`${e.name}\``).join('\n') : 'None', inline: true }
      )
      .setFooter({ text: `Server ID: ${guild.id} • Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};