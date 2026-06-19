const fs = require('fs');
const path = require('path');

/**
 * Load message (prefix) commands from the Commands/Message directory
 * Note: This template uses slash commands only. Prefix commands are optional.
 * @param {Client} client - The Discord client instance
 */
async function loadMessageCommands(client) {
  const commandsRoot = path.join(process.cwd(), 'Src', 'Commands', 'Message');

  if (!fs.existsSync(commandsRoot)) {
    console.log('[MESSAGE COMMANDS] No Message commands directory found. Using slash commands only.');
    client.messageCommands = client.messageCommands || new Map();
    return;
  }

  client.messageCommands = client.messageCommands || new Map();
  let loadedCount = 0;

  const commandFolders = fs.readdirSync(commandsRoot, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsRoot, folder);
    const commandFiles = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.js'))
      .map(f => f.name);

    for (const fileName of commandFiles) {
      const filePath = path.join(folderPath, fileName);
      let command;
      try {
        delete require.cache[require.resolve(filePath)];
        command = require(filePath);
      } catch (err) {
        console.error(`[MESSAGE COMMANDS] Failed to require ${fileName}`, err);
        continue;
      }

      if (!command?.name || !command?.execute) {
        continue;
      }

      client.messageCommands.set(command.name, command);
      loadedCount++;
    }
  }

  console.log(`[MESSAGE COMMANDS] Loaded ${loadedCount} prefix commands`);
}

module.exports = { loadMessageCommands };
