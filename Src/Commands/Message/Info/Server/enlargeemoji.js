const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'enlargeemoji',
  aliases: ['enlarge', 'bigemoji'],
  description: 'Enlarge a custom emoji to view it in full size',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message, args) {
    const emojiInput = args[0];
    if (!emojiInput) {
      return message.reply('❌ Please provide a custom emoji. Example: `!enlargeemoji <:name:id>`');
    }

    const emojiRegex = /^<(a?):([^:]+):(\d+)>$/;
    const match = emojiInput.match(emojiRegex);
    let emojiUrl, emojiName, isAnimated;

    if (match) {
      isAnimated = Boolean(match[1]);
      emojiName = match[2];
      const emojiId = match[3];
      emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=4096&quality=lossless`;
    } else {
      const idMatch = emojiInput.match(/^\d+$/);
      if (idMatch) {
        const emoji = message.guild.emojis.cache.get(emojiInput);
        if (emoji) {
          emojiUrl = emoji.url; emojiName = emoji.name; isAnimated = emoji.animated;
        } else {
          emojiUrl = `https://cdn.discordapp.com/emojis/${emojiInput}.png?size=4096&quality=lossless`; emojiName = 'unknown'; isAnimated = false;
        }
      } else {
        const emoji = message.guild.emojis.cache.find(e => e.name === emojiInput);
        if (emoji) {
          emojiUrl = emoji.url; emojiName = emoji.name; isAnimated = emoji.animated;
        } else {
          return message.reply('❌ Please provide a valid custom emoji. I can accept: emoji, ID, or name');
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔍 Enlarged Emoji')
      .setColor(message.guild?.members.me?.displayHexColor || 0x5865f2)
      .setDescription(`**Name:** ${emojiName}${isAnimated ? '\n**Type:** Animated' : ''}`)
      .setImage(emojiUrl)
      .addFields(
        { name: '🔗 Direct Link', value: `[\`Open Image\`](${emojiUrl})`, inline: true },
        { name: '📥 Download', value: `[\`Download ${isAnimated ? 'GIF' : 'PNG'}\`](${emojiUrl})`, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};