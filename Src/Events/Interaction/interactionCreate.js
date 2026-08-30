const { Collection, MessageFlags, PermissionsBitField, InteractionType, EmbedBuilder } = require('discord.js');
const { getPermissionLabel, DEFAULT_BOT_PERMISSIONS, DEFAULT_USER_PERMISSIONS } = require('../../Functions/permissions');
const { logger } = require('../../Functions/logger');
const settings = require('../../../Settings/settings.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (!interaction || interaction.user?.bot) {
        return;
      }
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const parent = interaction.commandName;
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand(false);
        const fullName = [parent, group, sub].filter(Boolean).join(' ');
        const cmd = client.slashCommands.get(fullName) || client.slashCommands.get(parent);
        if (cmd?.autocomplete) {
          try {
            await cmd.autocomplete(interaction);
          } catch (err) {
            console.error('Autocomplete error:', err);
          }
        }
        return;
      }
      if (!interaction.isChatInputCommand()) {
        return;
      }
      const inGuild = interaction.context === 0;
      const guild = interaction.guild ?? null;
      const member = interaction.member ?? null;
      const parent = interaction.commandName;
      const group = interaction.options.getSubcommandGroup(false);
      const sub = interaction.options.getSubcommand(false);
      const fullName = [parent, group, sub].filter(Boolean).join(' ');
      const command = client.slashCommands.get(fullName);
      const executionStartTime = Date.now();
      if (!command) {
        return interaction.reply({ flags: MessageFlags.Ephemeral, content: '❌ Unknown command.', withResponse: false });
      }

      // No fallback — every field must be set via module.exports if needed
      const {
        devOnly = false,
        ownerOnly = false,
        guildOnly = false,
        dmPermission = true,
        maintenanceCmd = false,
        toggleOffCmd = false,
        nsfwOnly = false,
        voiceOnly = false,
        guildIds,
        userPermissions,
        memberPermissions,
        botPermissions,
        cooldown = 15
      } = command;

      const devIds = settings.developer?.ids || [];
      const isDev = devIds.map(String).includes(String(interaction.user.id));
      const cooldownSeconds = isDev ? 5 : cooldown;
      const deny = (content) => interaction.reply({ flags: MessageFlags.Ephemeral, content, withResponse: false });

      if (!inGuild && guildOnly) {
        return deny('🚫 Use this command in a server.');
      }
      if ((interaction.context === 1 || interaction.context === 2) && !dmPermission) {
        return deny('🚫 Command not allowed in private messages.');
      }
      if (maintenanceCmd && !isDev) {
        return deny('🔧 Command under maintenance.');
      }
      if (toggleOffCmd) {
        return deny('❌ Command disabled.');
      }

      // Guild restriction — only guilds listed in settings.json developer.guildids OR per-command guildIds
      // Usage in command: module.exports = { guildIds: ["123", "456"] }  OR  guildIds: true (uses central list)
      if (inGuild) {
        let allowed = null;
        if (Array.isArray(guildIds) && guildIds.length) {
          allowed = guildIds.map(String);
        } else if (guildIds === true) {
          allowed = (settings.developer?.guildids || []).map(String);
        }
        if (allowed && allowed.length && !allowed.includes(guild.id)) {
          return deny('🚫 Command not available in this server.');
        }
      }

      if (nsfwOnly && !interaction.channel?.nsfw) {
        return deny('🔞 NSFW channel only.');
      }
      if (voiceOnly && inGuild && !member?.voice?.channel) {
        return deny('🎤 Join a voice channel first.');
      }
      if ((devOnly || ownerOnly) && !isDev) {
        return deny(ownerOnly ? '🚫 Owner only.' : '🚫 Developer only.');
      }

      // Permissions — module.exports + defaults (always required)
      // Usage: module.exports = { userPermissions: ["ManageMessages"], botPermissions: ["EmbedLinks"] }
      // Defaults are merged in — no need to repeat them per command.
      const extraUser = Array.isArray(userPermissions) ? userPermissions : Array.isArray(memberPermissions) ? memberPermissions : [];
      const extraBot = Array.isArray(botPermissions) ? botPermissions : [];
      const requiredUserPerms = [...new Set([...DEFAULT_USER_PERMISSIONS, ...extraUser])];
      const requiredBotPerms = [...new Set([...DEFAULT_BOT_PERMISSIONS, ...extraBot])];

      if (inGuild && member && guild) {
        const memberPerms = member.permissions;
        const isAdmin = memberPerms.has(PermissionsBitField.Flags.Administrator);
        const isOwner = guild.ownerId === interaction.user.id;
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
        const now = Date.now();
        if (!client.cooldowns.has(fullName)) {
          client.cooldowns.set(fullName, new Collection());
        }
        const timestamps = client.cooldowns.get(fullName);
        const expiration = timestamps.get(interaction.user.id);
        if (expiration && now < expiration) {
          return deny(`⏳ Cooldown active. Try again in ${Math.ceil((expiration - now) / 1000)}s.`);
        }
        timestamps.set(interaction.user.id, now + cooldownSeconds * 1000);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownSeconds * 1000);
      }

      await command.execute(client, interaction);
      const executionTime = Date.now() - executionStartTime;
      const embed = new EmbedBuilder().setAuthor({ name: '✅ Command Executed', iconURL: interaction.user.displayAvatarURL() }).setDescription(`\`/${fullName}\` by **${interaction.user.tag}**`).setColor(0x00ff00).setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .addFields({ name: '👤 User', value: '```yml\n' + `${interaction.user.tag} (${interaction.user.id})\n` + '```', inline: true }, { name: '📍 Location', value: '```yml\n' + `${guild?.name || 'DM'} • ${interaction.channel?.name || 'DM'}\n${inGuild ? 'Guild' : 'DM'}\n` + '```', inline: true }, { name: '⚡ Time', value: '```yml\n' + `${executionTime}ms • ${new Date().toLocaleTimeString()}\n` + '```', inline: true })
        .setFooter({ text: `Bot: ${client.user.tag}`, iconURL: client.user.displayAvatarURL() }).setTimestamp();
      logger.command({ client, embed }).catch(() => {});
    } catch (err) {
      console.error('❌ Interaction error:', err);
      try {
        const replyOpts = { flags: MessageFlags.Ephemeral, content: '⚠️ Something went wrong while executing this command.', withResponse: false };
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(replyOpts);
        } else {
          await interaction.followUp(replyOpts);
        }
      } catch {}
    }
  }
};