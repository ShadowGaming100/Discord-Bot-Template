const {
  Collection,
  MessageFlags,
  PermissionsBitField,
  InteractionType,
  EmbedBuilder
} = require('discord.js');

const config = require('../../../config');
const {
  getPermissionLabel,
  DEFAULT_BOT_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS
} = require('../../Functions/permissions');
const { logger } = require('../../Functions/logger');

const BASE_USER_PERMS = [...DEFAULT_USER_PERMISSIONS];
const BASE_BOT_PERMS = [...DEFAULT_BOT_PERMISSIONS];

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    try {
      if (!interaction || interaction.user?.bot) {
        return;
      }

      /* ───────── AUTOCOMPLETE ───────── */
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const parent = interaction.commandName;
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand(false);
        const fullName = [parent, group, sub].filter(Boolean).join(' ');

        // Try exact match first
        let cmd = client.slashCommands.get(fullName);
        if (!cmd) {
          cmd = client.slashCommands.get(parent);
        } // fallback to top-level
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

      /* ───────── CONTEXT DETECTION ───────── */
      const context = interaction.context;
      const inGuild = context === 0;
      const inBotDM = context === 1;
      const inPrivateChannel = context === 2;

      const guild = interaction.guild ?? null;
      const member = interaction.member ?? null;

      /* ───────── COMMAND RESOLUTION ───────── */
      const parent = interaction.commandName;
      const group = interaction.options.getSubcommandGroup(false);
      const sub = interaction.options.getSubcommand(false);
      const fullName = [parent, group, sub].filter(Boolean).join(' ');

      const command = client.slashCommands.get(fullName);
      const executionStartTime = Date.now();

      if (!command) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '❌ Unknown command.',
          withResponse: false
        });
      }

      /* ───────── FLAGS ───────── */
      const {
        devOnly = false,
        ownerOnly = false,
        guildOnly = false,
        dmPermission = true,
        maintenanceCmd = false,
        toggleOffCmd = false,
        nsfwOnly = false,
        voiceOnly = false,
        allowedGuilds = true,
        premiumOnly = false,
        memberPermissions = [],
        botPermissions = [],
        cooldown = 15
      } = command;

      const devIds = config.get('settings.developer.ids', []);
      const ownerIds = config.get('settings.developer.owner_ids', []);
      const isDev = devIds.includes(interaction.user.id);
      const cooldownSeconds = isDev ? 5 : cooldown;

      /* ───────── VALIDATION ───────── */
      if (!inGuild && guildOnly) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🚫 Use this command in a server.',
          withResponse: false
        });
      }

      if ((inBotDM || inPrivateChannel) && !dmPermission) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🚫 Command not allowed in private messages.',
          withResponse: false
        });
      }

      if (maintenanceCmd && !isDev) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🔧 Command under maintenance.',
          withResponse: false
        });
      }

      if (toggleOffCmd) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '❌ Command disabled.',
          withResponse: false
        });
      }

      if (
        inGuild &&
        premiumOnly &&
        !config.get('server.premiumGuilds', []).includes(guild.id)
      ) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '⭐ Premium servers only.',
          withResponse: false
        });
      }

      if (inGuild && allowedGuilds !== true) {
        const list = Array.isArray(allowedGuilds)
          ? allowedGuilds
          : [config.get('server.id')];

        if (!list.includes(guild.id)) {
          return interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: '🚫 Command not available in this server.',
            withResponse: false
          });
        }
      }

      if (nsfwOnly && !interaction.channel?.nsfw) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🔞 NSFW channel only.',
          withResponse: false
        });
      }

      if (voiceOnly && inGuild && !member?.voice?.channel) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🎤 Join a voice channel first.',
          withResponse: false
        });
      }

      if (devOnly && !isDev) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🚫 Developer only.',
          withResponse: false
        });
      }

      if (ownerOnly && !ownerIds.includes(interaction.user.id)) {
        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: '🚫 Owner only.',
          withResponse: false
        });
      }

      /* ───────── COOLDOWN ───────── */
      if (cooldownSeconds > 0) {
        const now = Date.now();
        if (!client.cooldowns.has(fullName)) {
          client.cooldowns.set(fullName, new Collection());
        }

        const timestamps = client.cooldowns.get(fullName);
        const expiration = timestamps.get(interaction.user.id);

        if (expiration && now < expiration) {
          return interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: `⏳ Cooldown active. Try again in ${Math.ceil(
              (expiration - now) / 1000
            )}s.`,
            withResponse: false
          });
        }

        timestamps.set(
          interaction.user.id,
          now + cooldownSeconds * 1000
        );

        setTimeout(
          () => timestamps.delete(interaction.user.id),
          cooldownSeconds * 1000
        );
      }

      /* ───────── PERMISSIONS (GUILD ONLY) ───────── */
      if (inGuild && member && guild) {
        const memberPerms = member.permissions;
        const isAdmin = memberPerms.has(
          PermissionsBitField.Flags.Administrator
        );
        const isOwner = guild.ownerId === interaction.user.id;

        if (!isAdmin && !isOwner) {
          const missing = BASE_USER_PERMS.concat(
            memberPermissions
          ).filter(
            p => !memberPerms.has(PermissionsBitField.Flags[p])
          );

          if (missing.length) {
            return interaction.reply({
              flags: MessageFlags.Ephemeral,
              content: `🚫 You lack: ${missing
                .map(getPermissionLabel)
                .join(', ')}`,
              withResponse: false
            });
          }
        }

        const botMember = guild.members.me;
        if (botMember) {
          const missingBot = BASE_BOT_PERMS.concat(
            botPermissions
          ).filter(
            p =>
              !botMember.permissions.has(
                PermissionsBitField.Flags[p]
              )
          );

          if (missingBot.length) {
            return interaction.reply({
              flags: MessageFlags.Ephemeral,
              content: `🚫 I lack: ${missingBot
                .map(getPermissionLabel)
                .join(', ')}`,
              withResponse: false
            });
          }
        }
      }

      /* ───────── EXECUTION ───────── */
      await command.execute(client, interaction);
      const executionTime = Date.now() - executionStartTime;

      /* ───────── LOG SUCCESS ───────── */
      const successEmbed = new EmbedBuilder()
        .setAuthor({
          name: '✅ Command Executed Successfully',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setDescription(
          `\`/${fullName}\` executed by **${interaction.user.tag}**`
        )
        .setColor(0x00ff00) // Green for success
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .addFields(
          {
            name: '👤 User Information',
            value:
              '```yml\n' +
              `Username: ${interaction.user.tag}\n` +
              `User ID:  ${interaction.user.id}\n` +
              `Account:  ${interaction.user.bot ? 'Bot' : 'User'}\n` +
              '```',
            inline: true
          },
          {
            name: '📍 Location Context',
            value:
              '```yml\n' +
              `Guild:   ${guild?.name || 'Private Message'}\n` +
              `Channel: ${interaction.channel?.name || 'DM'}\n` +
              `Type:    ${inGuild ? 'Guild' : inPrivateChannel ? 'Private' : 'DM'}\n` +
              '```',
            inline: true
          },
          {
            name: '⚡ Performance Metrics',
            value:
              '```yml\n' +
              `Execution Time: ${executionTime}ms\n` +
              `Timestamp:      ${new Date().toLocaleTimeString()}\n` +
              'Status:         Success ✓\n' +
              '```',
            inline: true
          },
          {
            name: '📝 Command Details',
            value:
              '```yml\n' +
              `Command:  /${fullName}\n` +
              `Category: ${command.category || 'General'}\n` +
              'Type:     Slash Command\n' +
              '```',
            inline: false
          }
        )
        .setFooter({
          text: `Bot: ${client.user.tag} • Command Logger`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      await logger.command({ client, embed: successEmbed });
    } catch (err) {
      console.error('❌ Interaction error:', err);

      try {
        const replyOpts = {
          flags: MessageFlags.Ephemeral,
          content:
            '⚠️ Something went wrong while executing this command.',
          withResponse: false
        };

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(replyOpts);
        } else {
          await interaction.followUp(replyOpts);
        }
      } catch {}
    }
  }
};
