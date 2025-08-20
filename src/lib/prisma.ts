import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Railway and production optimizations
const isProduction = process.env.NODE_ENV === 'production'
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: isProduction ? ['error'] : ['query', 'error', 'warn'],
  
  // Railway-specific optimizations
  ...(isRailway && {
    // Optimize connection pooling for Railway
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Reduce query timeout for Railway's constraints
    __internal: {
      engine: {
        connectionTimeout: 20000,
        queryTimeout: 60000,
      },
    },
  }),
  
  ...(process.env.DATABASE_URL && !isRailway && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
})

// Enhanced connection management for Railway
if (isRailway) {
  // Handle Railway's connection constraints
  prisma.$on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

if (!isProduction) globalForPrisma.prisma = prisma

export default prisma
