const { EmbedBuilder } = require('discord.js');

const cleanUrl = (u) => u.replace(/^https?:\/\//, '');

module.exports = {
  name: 'inviteinfo',
  aliases: ['invitei', 'checkinvite'],
  description: 'Get information about a Discord invite',
  category: 'Info',
  cooldown: 5,
  async execute(client, message, args) {
    const input = args[0];
    if (!input) {
      return message.reply('❌ Please provide an invite code or link. Example: `!inviteinfo discord.gg/abc123`');
    }
    const code = input.replace(/(https?:\/\/)?(www\.)?discord\.gg\//, '');

    try {
      const invite = await client.fetchInvite(code, { force: true });
      const icon = invite.guild?.iconURL({ dynamic: true, size: 1024 });
      const embed = new EmbedBuilder()
        .setTitle('🔗 Invite Info')
        .setColor(0x5865f2)
        .setDescription(`**Code:** \`${invite.code}\``)
        .addFields(
          { name: '🏰 Server', value: `**Name:** ${invite.guild?.name ?? 'Unknown'}\n**Members:** ${invite.approximateMemberCount ?? 'Unknown'}\n**Online:** ${invite.approximatePresenceCount ?? 'Unknown'}\n${icon ? `**Icon:** [${cleanUrl(icon)}](${icon})` : '**Icon:** None'}`, inline: false },
          { name: '👤 Invite', value: `**Inviter:** ${invite.inviter?.tag ?? 'Unknown'}\n**Expires:** ${invite.maxAge === 0 ? 'Never' : `<t:${Math.floor(invite.expiresTimestamp / 1000)}:R>`}\n**Temporary:** ${invite.temporary ? 'Yes' : 'No'}`, inline: false }
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    } catch {
      return message.reply('❌ Invalid or expired invite.');
    }
  }
};