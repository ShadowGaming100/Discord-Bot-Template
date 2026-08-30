const { EmbedBuilder, ChannelType, PermissionFlagsBits, Colors } = require('discord.js');

module.exports = {
  name: 'getchannelinvite',
  aliases: ['createinvite', 'channelinvite'],
  description: 'Create an invite for a channel',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message, args) {
    let channel = message.channel;
    const channelMention = message.mentions.channels.first();
    if (channelMention) {
      channel = channelMention;
    } else if (args[0]) {
      const id = args[0].replace(/\D/g, '');
      const fetched = message.guild.channels.cache.get(id);
      if (fetched) {
        channel = fetched;
      }
    }

    if (!channel.permissionsFor(message.guild.members.me)?.has(PermissionFlagsBits.CreateInstantInvite)) {
      return message.reply({
        embeds: [new EmbedBuilder().setTitle('❌ Permission Denied').setColor(Colors.Red).setDescription('I need the **Create Invite** permission in this channel.').setTimestamp()]
      });
    }

    try {
      const invite = await channel.createInvite({ maxAge: 86400, maxUses: 10, reason: `Created by ${message.author.tag}` });
      const inviteUrl = `https://discord.gg/${invite.code}`;
      const inviteLabel = `discord.gg/${invite.code}`;

      const embed = new EmbedBuilder()
        .setTitle('🔗 Channel Invite Created')
        .setColor(Colors.Blurple)
        .setDescription(`Invite created for ${channel}`)
        .addFields(
          { name: '📝 Invite Info', value: `**Code:** \`${invite.code}\`\n**Expires:** <t:${Math.floor((Date.now() + invite.maxAge * 1000) / 1000)}:R>\n**Max Uses:** ${invite.maxUses}`, inline: true },
          { name: '📊 Details', value: `**Creator:** ${message.author.tag}\n**Channel:** ${channel.name}\n**Type:** ${channel.type === ChannelType.GuildText ? 'Text' : 'Voice'}`, inline: true },
          { name: '🔗 Invite Link', value: `[${inviteLabel}](${inviteUrl})`, inline: false }
        )
        .setFooter({ text: `Server: ${message.guild.name} • Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Invite creation failed:', err);
      return message.reply({
        embeds: [new EmbedBuilder().setTitle('❌ Invite Creation Failed').setColor(Colors.Red).setDescription('Could not create an invite. Ensure I have permission and try again.').setTimestamp()]
      });
    }
  }
};