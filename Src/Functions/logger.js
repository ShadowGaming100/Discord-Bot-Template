const { EmbedBuilder, WebhookClient } = require('discord.js');
const { sanitizeForLogging } = require('./security-utils');

const WEBHOOK_ENV = {
  error: 'LOGS_ERRORLOGS_WEBHOOK',
  command: 'LOGS_COMMANDLOGS_WEBHOOK'
};

function getLogConfig(type) {
  const webhook = process.env[WEBHOOK_ENV[type]] || '';
  return { enabled: true, webhook };
}

class DiscordLogger {
  constructor() {
    this.webhooks = new Map();
  }
  getWebhook(url) {
    if (!url?.startsWith('http')) {
      return null;
    }
    if (this.webhooks.has(url)) {
      return this.webhooks.get(url);
    }
    try {
      const hook = new WebhookClient({ url }); this.webhooks.set(url, hook); return hook;
    } catch {
      return null;
    }
  }
  formatStack(stack) {
    if (!stack) {
      return null;
    }
    const lines = stack.split('\n').slice(0, 3);
    const s = lines.map(l => l.replace(/\/[^\s]+\//g, '.../').replace(/\\[^\s]+\\/g, '...\\')).join('\n');
    const chunks = [];
    for (let i = 0; i < s.length; i += 1000) {
      chunks.push(s.slice(i, i + 1000));
    }
    return chunks.map((text, idx) => ({ name: idx === 0 ? 'Stack Trace' : '\u200b', value: `\`\`\`${text}\`\`\`` }));
  }
  async send({ type = 'error', title, description, fields, embed, error }) {
    const cfg = getLogConfig(type);
    if (!cfg.webhook) {
      console.warn(`[Logger:${type}] webhook not set — skipping Discord log`);
      return false;
    }
    const baseEmbed = embed instanceof EmbedBuilder ? embed : new EmbedBuilder().setTimestamp();
    if (title) {
      baseEmbed.setTitle(title);
    }
    if (description) {
      baseEmbed.setDescription(description);
    }
    const finalFields = Array.isArray(fields) ? fields.map(f => ({ ...f, value: typeof f.value === 'string' ? f.value : JSON.stringify(sanitizeForLogging(f.value)) })) : [];
    if (error) {
      finalFields.push(...this.formatStack(error.stack || String(error)));
    }
    baseEmbed.addFields(finalFields.slice(0, 25));
    if (cfg.webhook) {
      const hook = this.getWebhook(cfg.webhook);
      if (hook) {
        await hook.send({ embeds: [baseEmbed] }); return true;
      }
    }
    return false;
  }
  error(opts) {
    return this.send({ ...opts, type: 'error' });
  }
  command(opts) {
    return this.send({ ...opts, type: 'command' });
  }
  client(opts) {
    return this.send({ ...opts, type: 'client' });
  }
}

module.exports = { logger: new DiscordLogger() };