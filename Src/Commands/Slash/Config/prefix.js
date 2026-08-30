const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'prefix',
  description: 'View or change the server prefix',
  category: 'Config',
  usage: '/config prefix [newPrefix]',
  cooldown: 5,
  guildOnly: true,
  userPermissions: ['ManageGuild'],
  botPermissions: ['SendMessages'],

  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('View or change the server prefix')
    .addStringOption(opt => opt.setName('newprefix').setDescription('New prefix (1-5 chars, no spaces)').setRequired(false)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const newPrefix = interaction.options.getString('newprefix');

    const db = require('../../../Functions/database');
    const settings = require('../../../Settings/settings.json');
    const defaultPrefix = settings.prefix || '!';

    // View current prefix
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
        .setDescription(`Current prefix: \`${current}\`\nDefault: \`${defaultPrefix}\`\n\nChange with \`/config prefix <newPrefix>\` or \`${current}prefix <newPrefix>\``)
        .setFooter({ text: `Guild ID: ${guildId}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    // Validate
    if (newPrefix.length < 1 || newPrefix.length > 5) {
      return interaction.editReply({ content: '❌ Prefix must be 1-5 characters.' });
    }
    if (/\s/.test(newPrefix)) {
      return interaction.editReply({ content: '❌ Prefix cannot contain spaces.' });
    }

    try {
      const prisma = db.getClient();
      await prisma.guildSettings.upsert({
        where: { guildId: String(guildId) },
        update: { prefix: newPrefix },
        create: { guildId: String(guildId), prefix: newPrefix }
      });

      // Update cache for message handler
      try {
        const { setCachedPrefix } = require('../../../Events/Message/messageCreate');
        if (setCachedPrefix) {
          setCachedPrefix(guildId, newPrefix);
        }
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle('✅ Prefix Updated')
        .setColor(0x00ff00)
        .setDescription(`Prefix updated to \`${newPrefix}\`\nTry \`${newPrefix}ping\` or \`/config prefix\` to view.`)
        .setFooter({ text: `Changed by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Prefix update failed:', err);
      return interaction.editReply({ content: '❌ Failed to update prefix. Check database connection.' });
    }
  }
};