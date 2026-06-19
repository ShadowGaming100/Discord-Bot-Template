const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'banner',
  description: 'Get the server banner',
  category: 'Info',
  usage: '/info server banner',
  cooldown: 10,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Get the server banner'),

  async execute(client, interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const color = guild.members.me?.displayHexColor || Colors.Blurple;

    if (!guild.banner) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🏰 Server Banner')
            .setColor(color)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setDescription(`❌ **${guild.name} does not have a server banner.**`)
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp()
        ]
      });
    }

    const bannerURL = guild.bannerURL({ size: 4096, dynamic: true });

    const links = [
      `🖼️ [PNG](${guild.bannerURL({ size: 4096, extension: 'png' })})`,
      `🖼️ [JPG](${guild.bannerURL({ size: 4096, extension: 'jpg' })})`,
      `🖼️ [WEBP](${guild.bannerURL({ size: 4096, extension: 'webp' })})`
    ].join(' • ');

    const embed = new EmbedBuilder()
      .setTitle('🏰 Server Banner')
      .setColor(color)
      .setImage(bannerURL)
      .setDescription(`**${guild.name}**`)
      .addFields(
        {
          name: '📊 Server Details',
          value: [
            `**Members:** ${guild.memberCount}`,
            `**Boost Level:** ${guild.premiumTier}`,
            `**Boosts:** ${guild.premiumSubscriptionCount}`
          ].join('\n'),
          inline: true
        },
        {
          name: '🔗 Direct Links',
          value: links,
          inline: true
        }
      )
      .setFooter({
        text: `Server ID: ${guild.id} • Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
