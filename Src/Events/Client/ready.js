const { ActivityType, EmbedBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../Functions/logger");

// Cache for performance
const settingsCache = {};

module.exports = {
  name: "clientReady",
  once: true,

  async execute(client) {
    try {
      // Load settings with caching
      if (!settingsCache.loaded) {
        const SETTINGS_PATH = path.resolve(
          process.cwd(),
          "Src/Settings/settings.json"
        );
        try {
          const data = await fs.readFile(SETTINGS_PATH, "utf8");
          const settings = JSON.parse(data);

          // Normalize keys to lowercase
          Object.keys(settings).forEach((key) => {
            settings[key.toLowerCase()] = settings[key];
          });

          settingsCache.data = settings;
          settingsCache.loaded = true;
        } catch (err) {
          console.error("Failed to load settings:", err.message);
          settingsCache.data = {};
          settingsCache.loaded = true;
        }
      }

      const settings = settingsCache.data;

      // Set up status rotation
      setTimeout(() => this.setupStatusRotation(client, settings), 1000);

      // Send ready embed
      setTimeout(() => this.sendReadyEmbed(client), 2000);

      console.log(`Bot ${client.user.tag} is now online`);
    } catch (err) {
      console.error("ClientReady error:", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Client Ready Error")
        .setDescription(`\`\`\`${err.message}\`\`\``)
        .setColor(0xff0000)
        .setTimestamp();

      logger.error({ client, embed: errorEmbed }).catch(() => {});
    }
  },

  async setupStatusRotation(client, settings) {
    const STATUS_ROTATION_INTERVAL =
      Number(settings.statusrotationintervalms) || 60000;

    const activityTypeMap = {
      Playing: ActivityType.Playing,
      Watching: ActivityType.Watching,
      Listening: ActivityType.Listening,
      Competing: ActivityType.Competing,
    };

    let statuses = [];
    if (Array.isArray(settings.statuses)) {
      statuses = settings.statuses.map((s) => ({
        text: s.text,
        type: activityTypeMap[s.type] || ActivityType.Playing,
        status: ["online", "idle", "dnd", "invisible"].includes(s.status)
          ? s.status
          : "online",
      }));
    }

    if (!statuses.length) return;

    let index = 0;

    const setNextStatus = () => {
      if (!client.user || !statuses[index]) return;

      const status = statuses[index];
      const map = {
        guilds: String(client.guilds.cache.size),
        users: String(
          client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0)
        ),
        uptime: this.formatUptime(process.uptime()),
        memory: this.formatBytes(process.memoryUsage().heapUsed),
        version: require("../../../package.json").version,
        shards: client.shard ? client.shard.count : 1,
        devs: settings.developer?.ids?.length || 0,
        bot: client.user.tag,
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
          status: status.status,
        });
      } catch (err) {
        console.error("Failed to set presence:", err);
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

      const embed = new EmbedBuilder()
        .setTitle("🚀 Client Ready")
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({
          text: `Bot ID: ${client.user.id}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .addFields(
          {
            name: "📊 Bot Statistics",
            value: `Guilds: ${totalGuilds}\nUsers: ${totalUsers}\nCommands: ${
              client.slashCommands?.size || 0
            }`,
            inline: true,
          },
          {
            name: "⚙️ Performance",
            value: `WS Ping: ${client.ws.ping}ms\nMemory: ${this.formatBytes(
              process.memoryUsage().rss
            )}`,
            inline: true,
          }
        );

      await logger.client({ client, embed });
    } catch (err) {
      console.error("Failed to send ready embed:", err.message);
    }
  },

  formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`]
      .filter(Boolean)
      .join(" ");
  },

  formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${
      ["B", "KB", "MB", "GB", "TB"][i]
    }`;
  },
};
