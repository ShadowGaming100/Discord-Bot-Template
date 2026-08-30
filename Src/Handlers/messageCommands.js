const { readdirSync } = require('fs');
const path = require('path');

async function loadMessageCommands(client) {
  try {
    client.messageCommands = client.messageCommands || new Map();
    client.messageCommands.clear();
    const baseDir = path.join(process.cwd(), 'Src', 'Commands', 'Message');
    let files = [];
    try {
      files = readdirSync(baseDir, { withFileTypes: true })
        .filter(d => d.isFile() && d.name.endsWith('.js'))
        .map(d => path.join(baseDir, d.name));
    } catch {
      console.log('[MESSAGE COMMANDS] No Message commands directory found. Using 0 message commands.');
      return;
    }
    // Support subfolders like Message/Info etc. — flatten
    const walk = (dir) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full);
        } else if (ent.isFile() && ent.name.endsWith('.js')) {
          files.push(full);
        }
      }
    };
    // Already collected top-level; walk subfolders not yet collected
    for (const ent of readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
      walk(path.join(baseDir, ent.name));
    }
    // Deduplicate
    files = [...new Set(files)];

    for (const fullPath of files) {
      try {
        delete require.cache[require.resolve(fullPath)];
        const mod = require(fullPath);
        if (!mod.name || typeof mod.execute !== 'function') {
          continue;
        }
        const key = String(mod.name).toLowerCase();
        const aliases = Array.isArray(mod.aliases) ? mod.aliases.map(a => String(a).toLowerCase()) : [];
        client.messageCommands.set(key, { ...mod, aliases });
        for (const alias of aliases) {
          client.messageCommands.set(alias, { ...mod, aliases, isAlias: true });
        }
      } catch (err) {
        console.error(`[MESSAGE COMMANDS] Failed loading ${path.basename(fullPath)}`, err.message);
      }
    }
    console.log(`[MESSAGE COMMANDS] Loaded ${new Set([...client.messageCommands.values()].map(m => m.name)).size} message commands (${client.messageCommands.size} with aliases).`);
  } catch (error) {
    console.error('[MESSAGE COMMANDS] Loading failed', error);
  }
}

module.exports = { loadMessageCommands };