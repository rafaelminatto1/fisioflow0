import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV,
      railway: process.env.RAILWAY_ENVIRONMENT_NAME ? 'deployed' : 'local',
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV,
      railway: process.env.RAILWAY_ENVIRONMENT_NAME ? 'deployed' : 'local',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 503 })
  }
}