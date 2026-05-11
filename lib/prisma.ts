/* eslint-disable @typescript-eslint/no-explicit-any */
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalWithPrisma = global as typeof globalThis & { prisma: any }

if (!globalWithPrisma.prisma) {
  globalWithPrisma.prisma = new PrismaClient({ adapter })
}

export const prisma = globalWithPrisma.prisma