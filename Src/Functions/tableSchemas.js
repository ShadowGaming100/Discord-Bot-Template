function getTableSchemas() {
  return {
    guilds: {
      primaryKeys: ['guildId'],
      columns: ['guildId', 'name', 'ownerId', 'memberCount', 'createdAt', 'updatedAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "guilds" (
          "guildId" VARCHAR(20) PRIMARY KEY,
          "name" VARCHAR(100) NOT NULL,
          "ownerId" VARCHAR(20) NOT NULL,
          "memberCount" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    users: {
      primaryKeys: ['userId'],
      columns: ['userId', 'username', 'discriminator', 'avatar', 'createdAt', 'updatedAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "users" (
          "userId" VARCHAR(20) PRIMARY KEY,
          "username" VARCHAR(100) NOT NULL,
          "discriminator" VARCHAR(4),
          "avatar" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    user_guilds: {
      primaryKeys: ['id'],
      columns: ['id', 'userId', 'guildId', 'joinedAt', 'leftAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "user_guilds" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" VARCHAR(20) NOT NULL,
          "guildId" VARCHAR(20) NOT NULL,
          "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "leftAt" TIMESTAMP,
          UNIQUE ("userId", "guildId")
        )
      `
    },
    commands: {
      primaryKeys: ['id'],
      columns: ['id', 'name', 'category', 'userId', 'guildId', 'channelId', 'executedAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "commands" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" VARCHAR(100) NOT NULL,
          "category" VARCHAR(50) NOT NULL,
          "userId" VARCHAR(20) NOT NULL,
          "guildId" VARCHAR(20) NOT NULL,
          "channelId" VARCHAR(20),
          "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_commands_name ON "commands"("name");
        CREATE INDEX IF NOT EXISTS idx_commands_user ON "commands"("userId");
        CREATE INDEX IF NOT EXISTS idx_commands_guild ON "commands"("guildId");
      `
    },
    settings: {
      primaryKeys: ['guildId'],
      columns: ['guildId', 'prefix', 'logChannel', 'welcomeChannel', 'autoRole', 'customData', 'createdAt', 'updatedAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "settings" (
          "guildId" VARCHAR(20) PRIMARY KEY,
          "prefix" VARCHAR(5) DEFAULT '!',
          "logChannel" VARCHAR(20),
          "welcomeChannel" VARCHAR(20),
          "autoRole" VARCHAR(20),
          "customData" JSONB,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    cooldowns: {
      primaryKeys: ['id'],
      columns: ['id', 'command', 'userId', 'guildId', 'expiresAt'],
      createSQL: `
        CREATE TABLE IF NOT EXISTS "cooldowns" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "command" VARCHAR(100) NOT NULL,
          "userId" VARCHAR(20) NOT NULL,
          "guildId" VARCHAR(20),
          "expiresAt" TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cooldowns_lookup ON "cooldowns"("command", "userId", "guildId");
      `
    }
  };
}

module.exports = { getTableSchemas };
