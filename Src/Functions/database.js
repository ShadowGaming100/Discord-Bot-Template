require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { sanitizeErrorMessage } = require('./security-utils');

class DatabaseManager {
  constructor() {
    this.prisma = null;
    this.isAvailable = false;
    this.initialized = false;
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set in .env — DB features disabled.');
    }
  }

  async initialize() {
    if (this.initialized) {
      return;
    }
    try {
      const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
      this.prisma = new PrismaClient({ adapter });
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
  getClient: () => db.getClient()
};