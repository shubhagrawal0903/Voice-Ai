/* eslint-disable @typescript-eslint/no-explicit-any */
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalWithPrisma = global as typeof globalThis & { prisma: any }

if (!globalWithPrisma.prisma) {
  globalWithPrisma.prisma = createPrismaClient()
}

export const prisma = globalWithPrisma.prisma
