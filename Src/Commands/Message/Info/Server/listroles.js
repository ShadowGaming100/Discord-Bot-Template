const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'listroles',
  aliases: ['roles', 'roleslist'],
  description: 'List all roles in the server',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message) {
    const guild = message.guild;
    const roles = guild.roles.cache.filter(r => r.id !== guild.id).sort((a, b) => b.position - a.position).map(r => `<@&${r.id}>`);
    if (roles.length === 0) {
      return message.reply('This server has no roles.');
    }

    // Send first 20 roles to keep message readable; full pagination is slash-only
    const display = roles.slice(0, 20).join('\n');
    const more = roles.length > 20 ? `\n...and ${roles.length - 20} more (use \`/info server listroles\` for pagination)` : '';

    const embed = new EmbedBuilder()
      .setTitle(`🎭 Roles in ${guild.name} (${roles.length})`)
      .setColor(Colors.Blurple)
      .setDescription(display + more)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};