const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'invite',
  aliases: ['invitebot', 'addbot'],
  description: 'Get the bot invite link.',
  category: 'Info',
  cooldown: 5,
  async execute(client, message) {
    const inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔗 Invite Me')
      .setDescription(`Click the button below to invite **${client.user.username}** to your server.`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Invite Bot').setStyle(ButtonStyle.Link).setURL(inviteURL).setEmoji('➕')
    );

    return message.reply({ embeds: [embed], components: [row] });
  }
};