const { ActivityType, EmbedBuilder } = require('discord.js');
const { logger } = require('../../Functions/logger');
const { formatUptime, formatBytes } = require('../../Functions/format-utils');
const settings = require('../../../Settings/settings.json');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    try {
      const cfg = {
        statuses: settings.statuses || [],
        statusrotationintervalms: settings.statusrotationintervalms || 30000,
        developer: settings.developer || {}
      };
      this.displayConsoleBanner(client);
      setTimeout(() => this.setupStatusRotation(client, cfg), 1000);
      setTimeout(() => this.sendReadyEmbed(client), 2000);
    } catch (err) {
      console.error('ClientReady error:', err);
      const embed = new EmbedBuilder().setTitle('Client Ready Error').setDescription('```' + err.message + '```').setColor(0xff0000).setTimestamp();
      logger.error({ client, embed }).catch(() => {});
    }
  },
  displayConsoleBanner(client) {
    const guilds = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0);
    console.log(`\n✅ ${client.user.tag} (${client.user.id}) ready — ${guilds} guilds, ${users.toLocaleString()} users, ${client.slashCommands?.size || 0} commands | ${process.version} ${process.platform} ${formatBytes(process.memoryUsage().rss)} uptime ${formatUptime(process.uptime())}\n`);
  },
  async setupStatusRotation(client, cfg) {
    const interval = Number(cfg.statusrotationintervalms) || 60000;
    const typeMap = { Playing: ActivityType.Playing, Watching: ActivityType.Watching, Listening: ActivityType.Listening, Competing: ActivityType.Competing };
    const statuses = Array.isArray(cfg.statuses) ? cfg.statuses.map(s => ({ text: s.text, type: typeMap[s.type] || ActivityType.Playing, status: ['online', 'idle', 'dnd', 'invisible'].includes(s.status) ? s.status : 'online' })) : [];
    if (!statuses.length) {
      return;
    }
    let i = 0;
    const tick = () => {
      if (!client.user) {
        return;
      }
      const s = statuses[i];
      const map = { guilds: String(client.guilds.cache.size), users: String(client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0)), uptime: formatUptime(process.uptime()), memory: formatBytes(process.memoryUsage().heapUsed), version: require('../../../../package.json').version, bot: client.user.tag };
      const text = String(s.text).replace(/{([^}]+)}/g, (_, k) => map[k] ?? `{${k}}`);
      try {
        client.user.setPresence({ activities: [{ name: text, type: s.type }], status: s.status });
      } catch (e) {
        console.error('Failed to set presence:', e);
      }
      i = (i + 1) % statuses.length;
    };
    tick();
    client.statusInterval = setInterval(tick, interval);
  },
  async sendReadyEmbed(client) {
    try {
      const totalGuilds = client.guilds.cache.size;
      const totalUsers = client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0);
      const embed = new EmbedBuilder()
        .setAuthor({ name: '🚀 Bot Successfully Started', iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${client.user.tag}** online`)
        .setColor(0x00ff00).setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: '📊 Servers', value: '```yml\nGuilds: ' + totalGuilds.toLocaleString() + '\nUsers: ' + totalUsers.toLocaleString() + '\nChannels: ' + client.channels.cache.size.toLocaleString() + '\n```', inline: true },
          { name: '⚙️ Config', value: '```yml\nCommands: ' + (client.slashCommands?.size || 0) + '\nEvents: ' + (client.events?.size || 0) + '\n```', inline: true },
          { name: '💻 System', value: '```yml\nMemory: ' + formatBytes(process.memoryUsage().rss) + '\nNode.js: ' + process.version + '\nPing: ' + client.ws.ping + 'ms\n```', inline: true }
        )
        .setFooter({ text: `Bot ID: ${client.user.id}`, iconURL: client.user.displayAvatarURL() }).setTimestamp();
      await logger.client({ client, embed });
    } catch (err) {
      console.error('Failed to send ready embed:', err.message);
    }
  }
};