// Database wrapper with error handling and fallbacks
import { prisma } from './db';

// Safe database operations wrapper
export const safeDb = {
  // Check if Prisma is available
  isAvailable: () => {
    return prisma !== null && prisma !== undefined;
  },

  // Safe user operations
  users: {
    findUnique: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.users.findUnique(args);
    },
    findMany: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.users.findMany(args);
    },
    create: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.users.create(args);
    },
    update: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.users.update(args);
    },
    delete: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.users.delete(args);
    },
  },

  // Safe campaign operations
  campaigns: {
    findUnique: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.findUnique(args);
    },
    findMany: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.findMany(args);
    },
    create: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.create(args);
    },
    update: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.update(args);
    },
    delete: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.delete(args);
    },
    count: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.campaigns.count(args);
    },
  },

  // Safe template operations
  templates: {
    findUnique: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.templates.findUnique(args);
    },
    findMany: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.templates.findMany(args);
    },
    create: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.templates.create(args);
    },
    update: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.templates.update(args);
    },
    delete: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.templates.delete(args);
    },
  },

  // Safe upload operations
  uploads: {
    findUnique: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.uploads.findUnique(args);
    },
    findMany: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.uploads.findMany(args);
    },
    create: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.uploads.create(args);
    },
    update: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.uploads.update(args);
    },
    delete: async (args: any) => {
      if (!safeDb.isAvailable()) {
        throw new Error('Database not available. Please ensure Prisma is properly set up.');
      }
      return prisma.uploads.delete(args);
    },
  },

  // Transaction support
  $transaction: async (fn: any) => {
    if (!safeDb.isAvailable()) {
      throw new Error('Database not available. Please ensure Prisma is properly set up.');
    }
    return prisma.$transaction(fn);
  },

  // Disconnect
  $disconnect: async () => {
    if (safeDb.isAvailable() && prisma.$disconnect) {
      return prisma.$disconnect();
    }
  },
};

// Export the safe database wrapper
export default safeDb;
