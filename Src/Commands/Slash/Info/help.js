const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const settings = require('../../../Settings/settings.json');

module.exports = {
  name: 'help',
  description: 'View all bot commands and information.',
  category: 'Info',
  usage: '/info help [command]',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('help').setDescription('View all bot commands and information.').addStringOption(o => o.setName('command').setDescription('Get detailed info about a specific command').setRequired(false).setAutocomplete(true)),
  isDeveloper(userId) {
    const ids = (settings.developer?.ids || []).map(String);
    return ids.includes(String(userId));
  },
  canViewCommand(cmd, isDev) {
    if (!cmd || !cmd.name) {
      return false;
    } if ((cmd.developerOnly || cmd.ownerOnly) && !isDev) {
      return false;
    } return true;
  },
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused().toLowerCase();
      const isDev = this.isDeveloper(interaction.user.id);
      const list = [];
      for (const [key, cmd] of interaction.client.slashCommands) {
        if (!this.canViewCommand(cmd, isDev)) {
          continue;
        }
        const cat = cmd.category || key.split(' ')[0].replace(/^\w/, c => c.toUpperCase());
        if (cat === 'Developer' && !isDev) {
          continue;
        }
        list.push({ name: key, value: key, description: cmd.description || 'No description' });
      }
      const filtered = list.filter(c => c.name.toLowerCase().includes(focused)).slice(0, 25);
      await interaction.respond(filtered.map(c => ({ name: `/${c.name} - ${c.description.slice(0, 60)}${c.description.length > 60 ? '...' : ''}`, value: c.value })));
    } catch {
      try {
        await interaction.respond([]);
      } catch {}
    }
  },
  async execute(client, interaction) {
    try {
      const q = interaction.options.getString('command'); if (q) {
        return this.showCommandDetail(client, interaction, q);
      } await this.showMainHelp(client, interaction);
    } catch {
      const msg = { content: '❌ An error occurred while loading the help menu.', flags: 64 }; if (interaction.deferred) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
  async showCommandDetail(client, interaction, commandKey) {
    const isDev = this.isDeveloper(interaction.user.id);
    const cmd = interaction.client.slashCommands.get(commandKey);
    if (!cmd) {
      return interaction.reply({ content: '❌ Command not found!', flags: 64 });
    }
    if (!this.canViewCommand(cmd, isDev)) {
      return interaction.reply({ content: "❌ You don't have permission to view this command!", flags: 64 });
    }
    const fullPath = `/${commandKey}`;
    const embed = new EmbedBuilder().setTitle('📖 Command Information').setDescription(`**Command:** \`${fullPath}\`\n${cmd.description || 'No description.'}`).setColor('#5865F2')
      .addFields({ name: '📝 Usage', value: `\`${cmd.usage || fullPath}\``, inline: false }, { name: '📂 Category', value: `${this.getCategoryEmoji(cmd.category || 'Unknown')} \`${cmd.category || 'Unknown'}\``, inline: true }, { name: '⏱️ Cooldown', value: `\`${cmd.cooldown || 0}s\``, inline: true })
      .setFooter({ text: '💡 Use /info help to see all commands', iconURL: client.user.displayAvatarURL() }).setTimestamp();
    if (cmd.group) {
      embed.addFields({ name: '🗂️ Subgroup', value: `${this.getSubgroupEmoji(cmd.group)} \`${cmd.group}\``, inline: true });
    }
    const userPerms = cmd.userPermissions || cmd.memberPermissions;
    if (userPerms?.length) {
      embed.addFields({ name: '👤 Required User Permissions', value: userPerms.map(p => `\`${p}\``).join(', '), inline: false });
    }
    if (cmd.botPermissions?.length) {
      embed.addFields({ name: '🤖 Required Bot Permissions', value: cmd.botPermissions.map(p => `\`${p}\``).join(', '), inline: false });
    }
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('help_home').setLabel('Back to Home').setStyle(ButtonStyle.Secondary).setEmoji('🏠'));
    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();
    const col = msg.createMessageComponentCollector({ time: 300000 });
    col.on('collect', async i => {
      if (i.user.id === interaction.user.id && i.customId === 'help_home') {
        await i.deferUpdate(); await this.showMainHelp(client, i, true); col.stop();
      }
    });
    col.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
  },
  async showMainHelp(client, interaction, isUpdate = false) {
    const isDev = this.isDeveloper(interaction.user.id);
    const categories = new Map();
    for (const [key, cmd] of client.slashCommands) {
      if (!this.canViewCommand(cmd, isDev)) {
        continue;
      }
      const parts = key.split(' ');
      const cat = cmd.category || parts[0].replace(/^\w/, c => c.toUpperCase());
      if (cat === 'Developer' && !isDev) {
        continue;
      }
      if (!categories.has(cat)) {
        categories.set(cat, new Map());
      }
      const m = categories.get(cat);
      const subgroup = cmd.group || (parts.length === 3 ? parts[1].replace(/^\w/, c => c.toUpperCase()) : 'General');
      if (!m.has(subgroup)) {
        m.set(subgroup, []);
      }
      m.get(subgroup).push(cmd);
    }
    const homeEmbed = new EmbedBuilder().setTitle(`✨ ${client.user.username} - Help Menu`).setDescription('Welcome! Select a category below to view commands.\n💡 Use `/info help <command>` for details.').setColor('#5865F2').setThumbnail(client.user.displayAvatarURL({ size: 256 })).setFooter({ text: `👤 Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }).setTimestamp()
      .addFields({ name: '📊 Bot Statistics', value: `**🏓 Ping:** \`${client.ws.ping}ms\`\n**⚡ Commands:** \`${[...categories.values()].reduce((a, c) => a + [...c.values()].reduce((b, v) => b + v.length, 0), 0)}\`\n**📂 Categories:** \`${categories.size}\`\n**🏢 Servers:** \`${client.guilds.cache.size}\``, inline: true },
        { name: '📚 Available Categories', value: [...categories.keys()].map(cat => `${this.getCategoryEmoji(cat)} \`${cat}\``).join('\n') || 'None', inline: false });
    const categoryOptions = [...categories.keys()].map(cat => ({ label: cat, description: `${[...categories.get(cat).values()].reduce((a, v) => a + v.length, 0)} commands`, value: `category_${cat}`, emoji: this.getCategoryEmoji(cat) }));
    if (!categoryOptions.length) {
      return (isUpdate ? interaction.editReply({ embeds: [homeEmbed], components: [] }) : interaction.reply({ embeds: [homeEmbed], components: [] }));
    }
    const selectMenu = new StringSelectMenuBuilder().setCustomId('help_category_select').setPlaceholder('🔎 Choose a category').addOptions(categoryOptions);
    const menuRow = new ActionRowBuilder().addComponents(selectMenu);
    const homeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('help_home').setLabel('🏠 Home').setStyle(ButtonStyle.Primary).setEmoji('🏠').setDisabled(true));
    const data = { embeds: [homeEmbed], components: [menuRow, homeRow] };
    if (isUpdate) {
      await interaction.editReply(data);
    } else {
      await interaction.reply(data);
    }
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 300000 });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This help menu is not for you!', flags: 64 });
      }
      await i.deferUpdate();
      if (i.customId === 'help_home') {
        await this.showMainHelp(client, i, true); return;
      }
      if (i.customId === 'help_category_select') {
        const cat = i.values[0].replace('category_', '');
        const map = categories.get(cat);
        if (!map) {
          return;
        }
        const fields = [...map.entries()].map(([sub, cmds]) => ({ name: `${this.getSubgroupEmoji(sub)} ${sub}`, value: cmds.map(c => `\`${c.name}\``).join(' • ') || 'No commands', inline: false }));
        const embed = new EmbedBuilder().setTitle(`${this.getCategoryEmoji(cat)} ${cat} Commands`).setDescription(`Showing **${cat}** commands. Use \`/info help <command>\` for details.`).setColor('#5865F2').setFooter({ text: `${[...map.values()].reduce((a, v) => a + v.length, 0)} commands`, iconURL: client.user.displayAvatarURL() }).setTimestamp().addFields(fields.slice(0, 25));
        const backRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('help_home').setLabel('🏠 Home').setStyle(ButtonStyle.Primary));
        await i.editReply({ embeds: [embed], components: [menuRow, backRow] });
      }
    });
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
  },
  getCategoryEmoji(c) {
    return { Info: 'ℹ️', Config: '🔧' }[c] || '📁';
  },
  getSubgroupEmoji(s) {
    return { General: '📌', Bot: '🤖', Server: '🏠', User: '👥', Config: '🔧' }[s] || '▸';
  }
};