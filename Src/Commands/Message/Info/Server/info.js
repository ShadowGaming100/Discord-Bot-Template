const { EmbedBuilder, Colors, ChannelType } = require('discord.js');

module.exports = {
  name: 'serverinfo',
  aliases: ['serverstats', 'si', 'guildinfo'],
  description: 'Display comprehensive server statistics',
  category: 'Info',
  guildOnly: true,
  cooldown: 5,
  async execute(client, message) {
    const guild = message.guild;
    await Promise.all([guild.members.fetch(), guild.channels.fetch(), guild.emojis.fetch(), guild.stickers.fetch()]);
    const members = guild.members.cache;
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;
    const emojis = guild.emojis.cache;
    const boosts = guild.premiumSubscriptionCount || 0;

    const totalMembers = guild.memberCount;
    const botCount = members.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    const online = members.filter(m => m.presence?.status === 'online').size;
    const idle = members.filter(m => m.presence?.status === 'idle').size;
    const dnd = members.filter(m => m.presence?.status === 'dnd').size;
    const offline = members.filter(m => !m.presence || m.presence.status === 'offline').size;

    const textChannels = channels.filter(c => [ChannelType.GuildText, ChannelType.GuildNews].includes(c.type)).size;
    const voiceChannels = channels.filter(c => [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type)).size;
    const categoryChannels = channels.filter(c => c.type === ChannelType.GuildCategory).size;
    const threadChannels = channels.filter(c => [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.NewsThread].includes(c.type)).size;
    const forumChannels = channels.filter(c => c.type === ChannelType.GuildForum).size;

    const verColors = [Colors.Green, Colors.Yellow, Colors.Orange, Colors.Red, Colors.DarkRed];
    const embedColor = verColors[guild.verificationLevel] || Colors.Blurple;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Server Stats: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setColor(embedColor)
      .addFields(
        { name: '👥 Members', value: `Total: **${totalMembers}**\nHumans: **${humanCount}**\nBots: **${botCount}**`, inline: true },
        { name: '📊 Presence', value: `🟢 Online: ${online}\n🟡 Idle: ${idle}\n🔴 DND: ${dnd}\n⚪ Offline: ${offline}`, inline: true },
        { name: '💬 Channels', value: `Text: **${textChannels}**\nVoice: **${voiceChannels}**\nCategories: **${categoryChannels}**\nThreads: **${threadChannels}**\nForums: **${forumChannels}**\nTotal: **${channels.size}**`, inline: true },
        { name: '🎨 Server Assets', value: `Roles: **${roles.size}**\nEmojis: **${emojis.size}**\nStickers: **${guild.stickers.cache.size}**\nBoosts: **${boosts}** (Tier ${guild.premiumTier || 0})`, inline: true },
        { name: '👑 Server Info', value: `Owner: <@${guild.ownerId}>\nVerification: **${guild.verificationLevel}**\nLocale: \`${guild.preferredLocale}\``, inline: true },
        { name: '📅 Dates', value: `Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>\nYou Joined: <t:${Math.floor(message.member.joinedTimestamp / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: `Server ID: ${guild.id} • Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const banner = guild.bannerURL({ size: 1024 });
    if (banner) {
      embed.setImage(banner);
    }

    return message.reply({ embeds: [embed] });
  }
};