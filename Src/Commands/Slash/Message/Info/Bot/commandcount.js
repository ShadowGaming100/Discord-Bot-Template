const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'commandcount',
  aliases: ['cmdcount', 'cc'],
  description: 'Display the total number of commands available in the bot',
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const totalSlash = client.slashCommands.size;
    const totalMsg = client.messageCommands ? new Set([...client.messageCommands.values()].map(m => m.name)).size : 0;
    const totalCommands = totalSlash + totalMsg;

    const categories = {};
    for (const cmd of client.slashCommands.values()) {
      const cat = cmd.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }
    for (const cmd of (client.messageCommands?.values() || [])) {
      const cat = cmd.category || 'Uncategorized';
      // Avoid double counting slash+message wrappers with same name/category
      if (!client.slashCommands.has(cmd.name)) {
        categories[cat] = (categories[cat] || 0) + 1;
      }
    }

    const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b - a);
    let categoryDescription = '';
    for (const [category, count] of sortedCategories) {
      categoryDescription += `**${category}:** ${count} commands\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('📜 Command Statistics')
      .setColor(0x5865f2)
      .setDescription(`Here's a summary of **${client.user.username}** commands:`)
      .addFields(
        { name: '📊 Total Commands', value: `**${totalCommands}** (Slash: ${totalSlash} • Message: ${totalMsg})`, inline: true },
        { name: '📁 Categories', value: `**${sortedCategories.length}**`, inline: true },
        { name: '📈 Command Distribution', value: categoryDescription || 'No commands found', inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};