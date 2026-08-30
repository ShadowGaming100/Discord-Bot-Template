const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'roleinfo',
  aliases: ['role', 'rinfo'],
  description: 'Display detailed information about a server role',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message, args) {
    const guild = message.guild;
    let role = message.mentions.roles.first();
    if (!role && args[0]) {
      const id = args[0].replace(/\D/g, '');
      role = guild.roles.cache.get(id) || guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
    }
    if (!role) {
      role = message.member.roles.highest;
    }

    await guild.members.fetch();
    const roleMembers = guild.members.cache.filter(m => m.roles.cache.has(role.id));
    const permissions = role.permissions.toArray();
    const topPermissions = permissions.slice(0, 5).map(p => `• ${p}`).join('\n') || 'None';

    const embed = new EmbedBuilder()
      .setTitle(`🎭 Role: ${role.name}`)
      .setColor(role.color || Colors.Blurple)
      .setThumbnail(role.iconURL({ size: 256 }) || null)
      .addFields(
        { name: '📊 Role Statistics', value: `**ID:** \`${role.id}\`\n**Members:** ${roleMembers.size}\n**Position:** ${role.position}/${guild.roles.cache.size}`, inline: true },
        { name: '⚙️ Role Settings', value: `**Color:** ${role.hexColor}\n**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}\n**Managed:** ${role.managed ? 'Yes 🤖' : 'No'}`, inline: true },
        { name: '🔑 Key Permissions', value: topPermissions, inline: false },
        { name: '📅 Role Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F> (<t:${Math.floor(role.createdTimestamp / 1000)}:R>)`, inline: true }
      )
      .setFooter({ text: `Role ID: ${role.id} • Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};