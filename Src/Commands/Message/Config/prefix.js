const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'prefix',
  aliases: ['setprefix', 'changeprefix'],
  description: 'View or change the server prefix',
  category: 'Config',
  guildOnly: true,
  userPermissions: ['ManageGuild'],
  botPermissions: ['SendMessages'],
  cooldown: 5,

  async execute(client, message, args) {
    const guildId = message.guildId;
    const newPrefix = args[0];
    const db = require('../../../Functions/database');
    const settings = require('../../../Settings/settings.json');
    const defaultPrefix = settings.prefix || '!';

    if (!newPrefix) {
      let current = defaultPrefix;
      try {
        if (db.isReady()) {
          const prisma = db.getClient();
          const row = await prisma.guildSettings.findUnique({ where: { guildId: String(guildId) } });
          if (row?.prefix) {
            current = row.prefix;
          }
        }
      } catch {}
      const embed = new EmbedBuilder()
        .setTitle('🔧 Server Prefix')
        .setColor(0x5865f2)
        .setDescription(`Current prefix: \`${current}\`\nDefault: \`${defaultPrefix}\`\n\nChange with \`${current}prefix <newPrefix>\` (1-5 chars, no spaces)`)
        .setFooter({ text: `Guild ID: ${guildId}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (newPrefix.length < 1 || newPrefix.length > 5) {
      return message.reply('❌ Prefix must be 1-5 characters.');
    }
    if (/\s/.test(newPrefix)) {
      return message.reply('❌ Prefix cannot contain spaces.');
    }

    try {
      const prisma = db.getClient();
      await prisma.guildSettings.upsert({
        where: { guildId: String(guildId) },
        update: { prefix: newPrefix },
        create: { guildId: String(guildId), prefix: newPrefix }
      });

      try {
        const { setCachedPrefix } = require('../../../Events/Message/messageCreate');
        if (setCachedPrefix) {
          setCachedPrefix(guildId, newPrefix);
        }
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle('✅ Prefix Updated')
        .setColor(0x00ff00)
        .setDescription(`Prefix updated to \`${newPrefix}\`\nTry \`${newPrefix}ping\` or \`${newPrefix}help\``)
        .setFooter({ text: `Changed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Prefix update failed:', err);
      return message.reply('❌ Failed to update prefix. Check database connection.');
    }
  }
};