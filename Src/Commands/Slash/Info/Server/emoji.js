const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'emoji',
  description: 'Display server emoji information or details about a specific emoji',
  category: 'Info',
  usage: '/info server emoji [emoji]',
  cooldown: 10,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Display server emoji information or details about a specific emoji')
    .addStringOption(option =>
      option.setName('emoji').setDescription('Emoji name or ID').setRequired(false)
    ),

  async execute(client, interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const emojis = guild.emojis.cache;
    const emojiInput = interaction.options.getString('emoji');

    if (emojiInput) {
      const emoji = emojis.find(
        e => e.name === emojiInput || e.id === emojiInput
      );

      if (!emoji) {
        return interaction.editReply({
          content: `❌ Could not find an emoji matching \`${emojiInput}\`.`
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎨 Emoji Info')
        .setColor(guild.members.me?.displayHexColor || 0x5865F2)
        .setImage(emoji.url)
        .setDescription(`${emoji} **${emoji.name}**`)
        .addFields(
          {
            name: 'Emoji Details',
            value: [
              `**ID:** ${emoji.id}`,
              `**Animated:** ${emoji.animated ? 'Yes' : 'No'}`,
              `**Managed:** ${emoji.managed ? 'Yes' : 'No'}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🔗 Direct Link',
            value: `🔗 [Open Emoji](${emoji.url})`,
            inline: true
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎨 Server Emojis')
      .setColor(guild.members.me?.displayHexColor || 0x5865F2)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setDescription(`**${guild.name}** emoji overview`)
      .addFields(
        {
          name: '📊 Statistics',
          value: [
            `**Total:** ${emojis.size}`,
            `**Animated:** ${emojis.filter(e => e.animated).size}`,
            `**Static:** ${emojis.filter(e => !e.animated).size}`
          ].join('\n'),
          inline: true
        },
        {
          name: '🆕 Recent Emojis',
          value:
            emojis.size > 0
              ? emojis
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .first(5)
                .map(e => `${e} \`${e.name}\``)
                .join('\n')
              : 'None',
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
