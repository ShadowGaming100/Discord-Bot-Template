const { Collection, PermissionsBitField } = require('discord.js');
const { getPermissionLabel, DEFAULT_BOT_PERMISSIONS, DEFAULT_USER_PERMISSIONS } = require('../../Functions/permissions');
const settings = require('../../../Settings/settings.json');

const prefixCache = new Map();

async function getPrefix(guildId) {
  const fallback = settings.prefix || '!';
  if (!guildId) {
    return fallback;
  }
  if (prefixCache.has(guildId)) {
    return prefixCache.get(guildId);
  }
  try {
    const db = require('../../Functions/database');
    if (!db.isReady()) {
      return fallback;
    }
    const prisma = db.getClient();
    if (!prisma) {
      return fallback;
    }
    const row = await prisma.guildSettings.findUnique({ where: { guildId: String(guildId) } });
    const prefix = row?.prefix || fallback;
    prefixCache.set(guildId, prefix);
    setTimeout(() => prefixCache.delete(guildId), 60000);
    return prefix;
  } catch {
    return fallback;
  }
}

function setCachedPrefix(guildId, prefix) {
  prefixCache.set(String(guildId), prefix);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      if (!message || message.author?.bot) {
        return;
      }
      const guildId = message.guild?.id || null;
      const prefix = await getPrefix(guildId);
      if (!message.content.startsWith(prefix)) {
        return;
      }

      const withoutPrefix = message.content.slice(prefix.length).trim();
      if (!withoutPrefix) {
        return;
      }

      const parts = withoutPrefix.split(/\s+/);
      const cmdName = parts.shift().toLowerCase();
      const args = parts;

      const command = client.messageCommands?.get(cmdName);
      if (!command) {
        return;
      }

      const guild = message.guild;
      const member = message.member;

      const {
        devOnly = false,
        ownerOnly = false,
        guildOnly = false,
        nsfwOnly = false,
        voiceOnly = false,
        guildIds,
        userPermissions,
        memberPermissions,
        botPermissions,
        cooldown = 5
      } = command;

      const devIds = settings.developer?.ids || [];
      const isDev = devIds.map(String).includes(String(message.author.id));
      const cooldownSeconds = isDev ? 2 : cooldown;

      const deny = async (content) => {
        try {
          await message.reply(content);
        } catch {}
      };

      if (guildOnly && !guild) {
        return deny('🚫 Use this command in a server.');
      }
      if (guildIds) {
        let allowed = null;
        if (Array.isArray(guildIds) && guildIds.length) {
          allowed = guildIds.map(String);
        } else if (guildIds === true) {
          allowed = (settings.developer?.guildids || []).map(String);
        }
        if (allowed && allowed.length && guild && !allowed.includes(guild.id)) {
          return;
        }
      }

      if (nsfwOnly && !message.channel?.nsfw) {
        return deny('🔞 NSFW channel only.');
      }
      if (voiceOnly && !member?.voice?.channel) {
        return deny('🎤 Join a voice channel first.');
      }
      if ((devOnly || ownerOnly) && !isDev) {
        return deny(ownerOnly ? '🚫 Owner only.' : '🚫 Developer only.');
      }

      const extraUser = Array.isArray(userPermissions) ? userPermissions : Array.isArray(memberPermissions) ? memberPermissions : [];
      const extraBot = Array.isArray(botPermissions) ? botPermissions : [];
      const requiredUserPerms = [...new Set([...DEFAULT_USER_PERMISSIONS, ...extraUser])];
      const requiredBotPerms = [...new Set([...DEFAULT_BOT_PERMISSIONS, ...extraBot])];

      if (member && guild) {
        const memberPerms = member.permissions;
        const isAdmin = memberPerms.has(PermissionsBitField.Flags.Administrator);
        const isOwner = guild.ownerId === message.author.id;
        if (!isAdmin && !isOwner && requiredUserPerms.length) {
          const missing = requiredUserPerms.filter(p => !memberPerms.has(PermissionsBitField.Flags[p]));
          if (missing.length) {
            return deny(`🚫 You lack: ${missing.map(getPermissionLabel).join(', ')}`);
          }
        }
        const botMember = guild.members.me;
        if (botMember && requiredBotPerms.length) {
          const missingBot = requiredBotPerms.filter(p => !botMember.permissions.has(PermissionsBitField.Flags[p]));
          if (missingBot.length) {
            return deny(`🚫 I lack: ${missingBot.map(getPermissionLabel).join(', ')}`);
          }
        }
      }

      if (cooldownSeconds > 0) {
        const key = `msg:${command.name}`;
        if (!client.cooldowns.has(key)) {
          client.cooldowns.set(key, new Collection());
        }
        const timestamps = client.cooldowns.get(key);
        const expiration = timestamps.get(message.author.id);
        const now = Date.now();
        if (expiration && now < expiration) {
          return deny(`⏳ Cooldown active. Try again in ${Math.ceil((expiration - now) / 1000)}s.`);
        }
        timestamps.set(message.author.id, now + cooldownSeconds * 1000);
        setTimeout(() => timestamps.delete(message.author.id), cooldownSeconds * 1000);
      }

      await command.execute(client, message, args);
    } catch (err) {
      console.error('[MESSAGE COMMAND] Error:', err);
    }
  },
  getPrefix,
  setCachedPrefix
};