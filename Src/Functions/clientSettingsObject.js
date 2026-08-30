const { GatewayIntentBits, Partials } = require('discord.js');

function clientSettingsObject() {
  return {
    allowedMentions: { parse: ['users', 'roles'] },
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [
      Partials.Channel,
      Partials.GuildMember,
      Partials.Message,
      Partials.Reaction,
      Partials.ThreadMember,
      Partials.User
    ]
  };
}

module.exports = clientSettingsObject;