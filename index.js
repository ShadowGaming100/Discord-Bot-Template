require('dotenv').config();
const { Collection, Client, EmbedBuilder } = require('discord.js');
const { loadSlashCommands } = require('./Src/Handlers/slashCommands');
const { loadMessageCommands } = require('./Src/Handlers/messageCommands');
const { loadEvents } = require('./Src/Handlers/events');
const { loadAntiCrash } = require('./Src/Handlers/antiCrash');
const clientSettingsObject = require('./Src/Functions/clientSettingsObject');
const { logger } = require('./Src/Functions/logger');
const { formatUptime, formatBytes } = require('./Src/Functions/format-utils');
const settings = require('./Src/Settings/settings.json');

async function initializeDatabase() {
  const pgHost = process.env.SERVER_POSTGRES_HOST || '';
  if (!pgHost) {
    console.log('Database not configured, skipping initialization');
    return;
  }
  try {
    const { ensurePostgresTables, initialize } = require('./Src/Functions/database');
    await initialize();
    await ensurePostgresTables();
    console.log('Database initialized successfully');
  } catch (err) {
    console.warn('Database initialization failed:', err.message);
    console.warn('Bot will continue without database features');
  }
}

async function initializeBot() {
  try {
    console.log('Bot startup initiated...');
    const token = (process.env.SETTINGS_BOT_TOKEN || settings.bot.token || '').trim();
    const clientId = process.env.SETTINGS_BOT_CLIENTID || settings.bot.clientid || '';
    const missing = [];
    if (!token || token === 'your_bot_token_here') {
      missing.push('BOT_TOKEN (SETTINGS_BOT_TOKEN)');
    }
    if (!clientId || clientId === 'your_client_id_here') {
      missing.push('CLIENT_ID (SETTINGS_BOT_CLIENTID or settings.json bot.clientid)');
    }
    if (missing.length) {
      throw new Error(`Missing critical configuration: ${missing.join(', ')}`);
    }
    if (!token) {
      throw new Error('Bot token not defined');
    }
    const client = new Client(clientSettingsObject());
    for (const prop of ['slashCommands', 'messageCommands', 'events', 'categories', 'cooldowns']) {
      client[prop] = new Collection();
    }
    await loadEvents(client);
    loadAntiCrash(client);
    await client.login(token);
    await loadSlashCommands(client);
    await loadMessageCommands(client);
    initializeDatabase().catch((err) => console.warn('Database init error:', err.message));
    console.log(`Logged in as ${client.user.tag}`);
    return client;
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

async function setupShutdownHandlers(client) {
  const botStartTimestamp = Date.now();
  const shutdown = async (signal) => {
    console.log(`⚡ Shutdown signal received: ${signal}`);
    if (client?.user) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: '🛑 Bot Shutdown', iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${client.user.tag}** shutting down (${signal})`)
        .setColor(0xffa500)
        .addFields(
          {
            name: '📊 Servers',
            value:
              '```yml\nGuilds: ' +
              client.guilds.cache.size.toLocaleString() +
              '\nUsers: ' +
              client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0).toLocaleString() +
              '\n```',
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value:
              '```yml\n' +
              formatUptime((Date.now() - botStartTimestamp) / 1000) +
              '\n' +
              new Date().toLocaleTimeString() +
              '\n```',
            inline: true
          },
          {
            name: '💻 System',
            value:
              '```yml\n' +
              formatBytes(process.memoryUsage().rss) +
              ' • ' +
              process.version +
              '\n```',
            inline: true
          }
        )
        .setFooter({ text: `Bot ID: ${client.user.id}`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      try {
        await logger.client({ client, embed });
      } catch (e) {
        console.error('Failed to send shutdown log:', e);
      }
    }
    try {
      await require('./Src/Functions/database').closePool();
    } catch {}
    if (client) {
      console.log('👋 Disconnecting from Discord...');
      await client.destroy().catch(() => {});
    }
    console.log('✅ Bot shutdown completed');
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT (Ctrl+C)'));
  process.on('SIGTERM', () => shutdown('SIGTERM (Termination signal)'));
}

(async () => {
  const client = await initializeBot();
  if (client) {
    await setupShutdownHandlers(client);
  }
})();
