const { EmbedBuilder } = require('discord.js');
const settings = require('../../../Settings/settings.json');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'View all bot commands and information.',
  category: 'Info',
  cooldown: 3,
  async execute(client, message, args) {
    const prefix = settings.prefix || '!';
    const query = args[0]?.toLowerCase();

    // Detail for single command
    if (query) {
      const cmd = client.messageCommands.get(query) || client.slashCommands.get(query);
      if (!cmd) {
        return message.reply(`❌ Command \`${query}\` not found. Try \`${prefix}help\` for a list.`);
      }
      const isDev = (settings.developer?.ids || []).map(String).includes(String(message.author.id));
      if ((cmd.devOnly || cmd.ownerOnly) && !isDev) {
        return message.reply("❌ You don't have permission to view this command!");
      }

      const embed = new EmbedBuilder()
        .setTitle('📖 Command Information')
        .setDescription(`**Command:** \`${prefix}${cmd.name}\`\n${cmd.description || 'No description.'}`)
        .setColor('#5865F2')
        .addFields(
          { name: '📝 Usage', value: `\`${cmd.usage || `${prefix}${cmd.name}`}\``, inline: false },
          { name: '📂 Category', value: `\`${cmd.category || 'Unknown'}\``, inline: true },
          { name: '⏱️ Cooldown', value: `\`${cmd.cooldown || 0}s\``, inline: true }
        )
        .setFooter({ text: `Try ${prefix}help for all commands`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      if (cmd.aliases?.length) {
        embed.addFields({ name: '🔗 Aliases', value: cmd.aliases.map(a => `\`${a}\``).join(', '), inline: false });
      }
      const perms = cmd.userPermissions || cmd.memberPermissions;
      if (perms?.length) {
        embed.addFields({ name: '👤 Required User Permissions', value: perms.map(p => `\`${p}\``).join(', '), inline: false });
      }
      if (cmd.botPermissions?.length) {
        embed.addFields({ name: '🤖 Required Bot Permissions', value: cmd.botPermissions.map(p => `\`${p}\``).join(', '), inline: false });
      }

      return message.reply({ embeds: [embed] });
    }

    // Overview - all message commands
    const categories = new Map();
    for (const cmd of new Set(client.messageCommands.values())) {
      const cat = cmd.category || 'Uncategorized';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      // Avoid duplicate aliases
      if (!categories.get(cat).find(c => c.name === cmd.name)) {
        categories.get(cat).push(cmd);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`✨ ${client.user.username} - Help Menu`)
      .setDescription(`Prefix: \`${prefix}\` — Try \`${prefix}help <command>\` for details.\nSlash: \`/info help\` for slash commands.`)
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp()
      .addFields(
        { name: '📊 Bot Statistics', value: `**Ping:** \`${client.ws.ping}ms\`\n**Message Commands:** \`${new Set([...client.messageCommands.values()].map(c => c.name)).size}\`\n**Slash Commands:** \`${client.slashCommands.size}\``, inline: true },
        { name: '📚 Categories', value: [...categories.keys()].map(c => `\`${c}\``).join(', ') || 'None', inline: false }
      );

    for (const [cat, cmds] of categories) {
      const list = cmds.map(c => `\`${c.name}\``).join(' • ');
      embed.addFields({ name: `${cat}`, value: list || 'No commands', inline: false });
    }

    return message.reply({ embeds: [embed] });
  }
};