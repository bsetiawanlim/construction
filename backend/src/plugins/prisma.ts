import fp from 'fastify-plugin'
import { PrismaClient } from './prisma/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter });

// Add prisma to the FastifyInstance type
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

// Define plugin to connect/disconnect prisma
export default fp(async (server: any) => {
  await prisma.$connect()
  server.decorate('prisma', prisma)
  server.addHook('onClose', async () => await prisma.$disconnect())
})