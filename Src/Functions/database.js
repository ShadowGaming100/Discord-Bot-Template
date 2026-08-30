require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { sanitizeErrorMessage } = require('./security-utils');

function getPostgresConfig() {
  return {
    host: process.env.SERVER_POSTGRES_HOST || '',
    port: Number(process.env.SERVER_POSTGRES_PORT || 5432),
    user: process.env.SERVER_POSTGRES_USER || '',
    password: process.env.SERVER_POSTGRES_PASSWORD || '',
    database: process.env.SERVER_POSTGRES_DATABASE || '',
    ssl: process.env.SERVER_POSTGRES_SSL === 'true',
    noVerifySSL: process.env.SERVER_POSTGRES_NOVERIFYSSL === 'true'
  };
}

class DatabaseManager {
  constructor() {
    this.prisma = null;
    this.isAvailable = false;
    this.initialized = false;
    const pgConfig = getPostgresConfig();
    if (!pgConfig.host || !pgConfig.database || !pgConfig.user) {
      console.warn('⚠️ Database configuration incomplete (set SERVER_POSTGRES_* in .env). Some features may not work.');
    }
  }

  async initialize() {
    if (this.initialized) {
      return;
    }
    try {
      this.prisma = new PrismaClient({
        log: process.env.DB_DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
        datasources: { db: { url: this._buildConnectionString() } }
      });
      await this.prisma.$connect();
      this.isAvailable = true;
      console.log('✅ PostgreSQL connected (Prisma)');
      this.initialized = true;
    } catch (error) {
      const safeMessage = sanitizeErrorMessage(error);
      console.error('❌ PostgreSQL connection failed:', safeMessage);
      this.isAvailable = false;
      throw new Error(`Database connection failed: ${safeMessage}`);
    }
  }

  _buildConnectionString() {
    const pgConfig = getPostgresConfig();
    const user = encodeURIComponent(pgConfig.user);
    const password = encodeURIComponent(pgConfig.password || '');
    const host = pgConfig.host;
    const port = pgConfig.port || 5432;
    const database = pgConfig.database;
    const params = ['application_name=discord-bot'];
    if (pgConfig.ssl) {
      params.push('sslmode=require');
    } else if (pgConfig.noVerifySSL) {
      params.push('sslmode=require', 'sslaccept=accept_invalid_certs');
    }
    return `postgresql://${user}:${password}@${host}:${port}/${database}?${params.join('&')}`;
  }

  async ensurePostgresTables() {
    if (!this.isAvailable) {
      console.warn('⚠️ Database not available, skipping schema check (run `npx prisma db push`)'); return;
    }
    console.log('🔧 Schema managed by Prisma — ensure `prisma/schema.prisma` is applied (npx prisma db push)');
  }

  async closePool() {
    if (this.prisma) {
      console.log('🛑 Closing Prisma connection...');
      await this.prisma.$disconnect();
      this.prisma = null;
      this.isAvailable = false;
      this.initialized = false;
      console.log('✅ Prisma connection closed');
    }
  }

  isReady() {
    return this.isAvailable;
  }
  getClient() {
    return this.prisma;
  }
}

const db = new DatabaseManager();
process.on('SIGTERM', () => db.closePool());
process.on('SIGINT', () => db.closePool());

module.exports = {
  ensurePostgresTables: () => db.ensurePostgresTables(),
  closePool: () => db.closePool(),
  isReady: () => db.isReady(),
  initialize: () => db.initialize(),
  getClient: () => db.getClient(),
  instance: db
};