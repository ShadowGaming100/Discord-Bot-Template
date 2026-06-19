const { ActivityType, EmbedBuilder } = require('discord.js');
const { logger } = require('../../Functions/logger');
const { formatUptime, formatBytes } = require('../../Functions/format-utils');
const config = require('../../../config');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    try {
      // Use config system for settings (no direct file reads)
      const settings = {
        statuses: config.get('settings.statuses', []),
        statusrotationintervalms: config.get('settings.statusrotationintervalms', 30000),
        developer: config.get('settings.developer', {})
      };

      // Display professional console banner
      this.displayConsoleBanner(client);

      // Set up status rotation
      setTimeout(() => this.setupStatusRotation(client, settings), 1000);

      // Send ready embed to Discord
      setTimeout(() => this.sendReadyEmbed(client), 2000);
    } catch (err) {
      console.error('ClientReady error:', err);

      const errorEmbed = new EmbedBuilder()
        .setTitle('Client Ready Error')
        .setDescription(`\`\`\`${err.message}\`\`\``)
        .setColor(0xff0000)
        .setTimestamp();

      logger.error({ client, embed: errorEmbed }).catch(() => {});
    }
  },

  /**
   * Display professional ASCII art banner in console
   */
  displayConsoleBanner(client) {
    const guilds = client.guilds.cache;
    const totalGuilds = guilds.size;
    const totalUsers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const commandCount = client.slashCommands?.size || 0;

    console.log('\n');
    console.log('+==================================================================+');
    console.log('|                                                                  |');
    console.log('|   ██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗          |');
    console.log('|   ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗         |');
    console.log('|   ██║  ██║██║███████╗██║     ██║   ██║██████╔╝██║  ██║         |');
    console.log('|   ██║  ██║██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║         |');
    console.log('|   ██████╔╝██║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝         |');
    console.log('|   ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝          |');
    console.log('|                      BOT TEMPLATE                                |');
    console.log('|                                                                  |');
    console.log('+==================================================================+');
    console.log('\n');

    // Bot Information
    console.log('Bot Information');
    console.log('-'.repeat(64));
    console.log('  Username:       ' + client.user.tag);
    console.log('  ID:             ' + client.user.id);
    console.log('  Environment:    ' + (process.env.NODE_ENV || 'development'));
    console.log('\n');

    // Statistics
    console.log('Statistics');
    console.log('-'.repeat(64));
    console.log('  Guilds:         ' + totalGuilds.toString());
    console.log('  Users:          ' + totalUsers.toLocaleString());
    console.log('  Commands:       ' + commandCount.toString());
    console.log('  Ping:           ' + `${client.ws.ping}ms`);
    console.log('\n');

    // System Information
    console.log('System Information');
    console.log('-'.repeat(64));
    console.log('  Node.js:        ' + process.version);
    console.log('  Memory Usage:   ' + formatBytes(process.memoryUsage().rss));
    console.log('  Platform:       ' + `${process.platform} ${process.arch}`);
    console.log('  Uptime:         ' + formatUptime(process.uptime()));
    console.log('\n');

    console.log('Bot is now online and ready!');
    console.log('-'.repeat(64));
    console.log('\n');
  },

  async setupStatusRotation(client, settings) {
    const STATUS_ROTATION_INTERVAL =
      Number(settings.statusrotationintervalms) || 60000;

    const activityTypeMap = {
      Playing: ActivityType.Playing,
      Watching: ActivityType.Watching,
      Listening: ActivityType.Listening,
      Competing: ActivityType.Competing
    };

    let statuses = [];
    if (Array.isArray(settings.statuses)) {
      statuses = settings.statuses.map((s) => ({
        text: s.text,
        type: activityTypeMap[s.type] || ActivityType.Playing,
        status: ['online', 'idle', 'dnd', 'invisible'].includes(s.status)
          ? s.status
          : 'online'
      }));
    }

    if (!statuses.length) {
      return;
    }

    let index = 0;

    const setNextStatus = () => {
      if (!client.user || !statuses[index]) {
        return;
      }

      const status = statuses[index];
      const map = {
        guilds: String(client.guilds.cache.size),
        users: String(
          client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0)
        ),
        uptime: formatUptime(process.uptime()),
        memory: formatBytes(process.memoryUsage().heapUsed),
        version: require('../../../package.json').version,
        shards: client.shard ? client.shard.count : 1,
        devs: settings.developer?.ids?.length || 0,
        bot: client.user.tag
      };

      const renderedText = String(status.text).replace(
        /{([^}]+)}/gi,
        (_, key) => {
          const k = Object.keys(map).find(
            (x) => x.toLowerCase() === key.toLowerCase()
          );
          return k ? map[k] : `{${key}}`;
        }
      );

      try {
        client.user.setPresence({
          activities: [{ name: renderedText, type: status.type }],
          status: status.status
        });
      } catch (err) {
        console.error('Failed to set presence:', err);
      }

      index = (index + 1) % statuses.length;
    };

    // Set initial status
    setNextStatus();

    // Rotate statuses
    client.statusInterval = setInterval(
      setNextStatus,
      STATUS_ROTATION_INTERVAL
    );
  },

  async sendReadyEmbed(client) {
    try {
      const guilds = client.guilds.cache;
      const totalGuilds = guilds.size;
      const totalUsers = guilds.reduce(
        (acc, g) => acc + (g.memberCount || 0),
        0
      );
      const commandCount = client.slashCommands?.size || 0;
      const eventCount = client.events?.size || 0;
      const nodeVersion = process.version;
      const environment = process.env.NODE_ENV || 'development';

      const embed = new EmbedBuilder()
        .setAuthor({
          name: '🚀 Bot Successfully Started',
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
          `**${client.user.tag}** is now online and ready to serve!\n` +
          `Running in **${environment.toUpperCase()}** mode`
        )
        .setColor(0x00ff00) // Green for success
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          {
            name: '📊 Server Statistics',
            value:
              '```yml\n' +
              `Guilds:   ${totalGuilds.toLocaleString()}\n` +
              `Users:    ${totalUsers.toLocaleString()}\n` +
              `Channels: ${client.channels.cache.size.toLocaleString()}\n` +
              '```',
            inline: true
          },
          {
            name: '⚙️ Bot Configuration',
            value:
              '```yml\n' +
              `Commands: ${commandCount}\n` +
              `Events:   ${eventCount}\n` +
              `Shards:   ${client.shard?.count || 1}\n` +
              '```',
            inline: true
          },
          {
            name: '💻 System Resources',
            value:
              '```yml\n' +
              `Memory:   ${formatBytes(process.memoryUsage().rss)}\n` +
              `Node.js:  ${nodeVersion}\n` +
              `Platform: ${process.platform}\n` +
              '```',
            inline: true
          },
          {
            name: '🌐 Connection Details',
            value:
              '```yml\n' +
              `WebSocket Ping: ${client.ws.ping}ms\n` +
              `Ready Since:    ${new Date().toLocaleTimeString()}\n` +
              `Uptime:         ${formatUptime(process.uptime())}\n` +
              '```',
            inline: false
          }
        )
        .setFooter({
          text: `Bot ID: ${client.user.id} • Discord Bot Template`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      await logger.client({ client, embed });
    } catch (err) {
      console.error('Failed to send ready embed:', err.message);
    }
  }
};
