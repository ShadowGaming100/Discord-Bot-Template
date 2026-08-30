const { EmbedBuilder } = require('discord.js');
const { logger } = require('../Functions/logger');
const { formatBytes, formatUptime } = require('../Functions/format-utils');

const crashTracker = { count: 0, resetTime: Date.now() + 60000, maxCrashes: 5 };
function resetTrackerIfNeeded() {
  if (Date.now() > crashTracker.resetTime) {
    crashTracker.count = 0;
    crashTracker.resetTime = Date.now() + 60000;
  }
}
function isCrashLimitExceeded() {
  return crashTracker.count > crashTracker.maxCrashes;
}
function sysFields() {
  return [
    { name: '📊 System Status', value: '```yml\n' + `Memory:  ${formatBytes(process.memoryUsage().rss)}\n` + `Uptime:  ${formatUptime(process.uptime())}\n` + `Node.js: ${process.version}\n` + '```', inline: true },
    { name: '🛡️ Safety Status', value: '```yml\n' + `Crashes:    ${crashTracker.count}\n` + `Max Allowed: ${crashTracker.maxCrashes}\n` + '```', inline: true }
  ];
}
function buildEmbed(client, { title, description, color, fields = [] }) {
  const e = new EmbedBuilder().setAuthor({ name: title, iconURL: client.user.displayAvatarURL() }).setDescription(description).setColor(color).setTimestamp().setFooter({ text: 'Anti-Crash • ' + new Date().toLocaleTimeString(), iconURL: client.user.displayAvatarURL() });
  e.addFields(...fields, ...sysFields());
  return e;
}

function loadAntiCrash(client) {
  process.on('unhandledRejection', async (reason) => {
    console.error('[AntiCrash] Unhandled Rejection:', reason);
    resetTrackerIfNeeded();
    if (++crashTracker.count > crashTracker.maxCrashes) {
      console.error(`[AntiCrash] Too many crashes (${crashTracker.count}). Exiting.`);
      process.exit(1);
    }
    if (client?.user) {
      try {
        const embed = buildEmbed(client, {
          title: '⚠️ Unhandled Promise Rejection',
          description: `A promise rejection was not properly handled\n**Crash Count:** ${crashTracker.count}/${crashTracker.maxCrashes}`,
          color: 0xff6600,
          fields: [{ name: '🔍 Error Details', value: '```js\n' + String(reason).substring(0, 500) + '```', inline: false }]
        });
        await logger.error({ client, embed, error: reason instanceof Error ? reason : new Error(String(reason)) });
      } catch (e) {
        console.error('[AntiCrash] Failed to log rejection:', e);
      }
    }
  });

  process.on('uncaughtException', async (error) => {
    console.error('[AntiCrash] Uncaught Exception:', error);
    resetTrackerIfNeeded();
    crashTracker.count++;
    if (client?.user) {
      try {
        const embed = buildEmbed(client, {
          title: '❌ Critical: Uncaught Exception',
          description: `A critical error occurred\n**Crash Count:** ${crashTracker.count}/${crashTracker.maxCrashes}`,
          color: 0xff0000,
          fields: [
            { name: '🔥 Exception Details', value: '```js\n' + `${error.name}: ${error.message}\n` + '```', inline: false },
            { name: '📍 Stack Trace', value: '```js\n' + (error.stack || 'No stack').split('\n').slice(0, 5).join('\n') + '\n```', inline: false }
          ]
        });
        await logger.error({ client, embed, error });
      } catch (e) {
        console.error('[AntiCrash] Failed to log exception:', e);
      }
    }
    if (isCrashLimitExceeded()) {
      setTimeout(() => process.exit(1), 1000);
    }
  });

  process.on('warning', (w) => {
    console.warn('[AntiCrash] Warning:', w.name, w.message);
  });

  if (client) {
    client.on('error', async (error) => {
      console.error('[Discord Client Error]', error);
      try {
        const embed = buildEmbed(client, {
          title: '❌ Discord Client Error',
          description: `The Discord.js client encountered an error\n**Error Type:** ${error.name}`,
          color: 0xff0000,
          fields: [
            { name: '🔍 Error Message', value: '```js\n' + error.message + '\n```', inline: false },
            { name: '📊 Bot Status', value: '```yml\n' + `Guilds:  ${client.guilds?.cache.size || 0}\n` + `Users:   ${client.guilds?.cache.reduce((a, g) => a + g.memberCount, 0) || 0}\n` + `Ping:    ${client.ws.ping}ms\n` + '```', inline: true }
          ]
        });
        await logger.error({ client, embed, error });
      } catch (e) {
        console.error('[AntiCrash] Failed to log client error:', e);
      }
    });

    client.on('shardError', async (error, shardId) => {
      console.error(`[Discord Shard Error] Shard ${shardId}:`, error);
      try {
        const embed = buildEmbed(client, {
          title: `❌ Shard ${shardId} Error`,
          description: `A shard encountered an error\n**Shard ID:** ${shardId}\n**Error Type:** ${error.name}`,
          color: 0xff4444,
          fields: [
            { name: '🔍 Error Details', value: '```js\n' + error.message + '\n```', inline: false },
            { name: '🌐 Shard Information', value: '```yml\n' + `Shard ID:     ${shardId}\n` + `Total Shards: ${client.shard?.count || 1}\n` + '```', inline: true }
          ]
        });
        await logger.error({ client, embed, error });
      } catch (e) {
        console.error('[AntiCrash] Failed to log shard error:', e);
      }
    });
  }
  console.log('✅ Anti-crash handlers initialized');
}

module.exports = { loadAntiCrash };