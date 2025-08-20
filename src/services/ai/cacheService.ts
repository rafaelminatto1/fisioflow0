import { CacheEntry, AIAnalysisResponse } from '@/types/ai'

export class AICacheService {
  private static cache: Map<string, CacheEntry> = new Map()
  private static readonly TTL = 24 * 60 * 60 * 1000 // 24 horas
  private static readonly MAX_ENTRIES = 1000

  static generateCacheKey(query: string, type: string, patientId?: string): string {
    const normalizedQuery = query.toLowerCase().trim()
    const components = [normalizedQuery, type, patientId].filter(Boolean)
    return Buffer.from(components.join('|')).toString('base64')
  }

  static async get(key: string): Promise<AIAnalysisResponse | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key)
      return null
    }

    entry.hitCount++
    
    return {
      ...entry.response,
      cached: true
    }
  }

  static async set(
    key: string, 
    query: string, 
    response: AIAnalysisResponse
  ): Promise<void> {
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.cleanup()
    }

    const entry: CacheEntry = {
      key,
      query,
      response: {
        ...response,
        cached: false
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TTL),
      hitCount: 0
    }

    this.cache.set(key, entry)
  }

  static async getCachedResponse(
    query: string, 
    type: string, 
    patientId?: string
  ): Promise<AIAnalysisResponse | null> {
    const key = this.generateCacheKey(query, type, patientId)
    return this.get(key)
  }

  static async cacheResponse(
    query: string, 
    type: string, 
    response: AIAnalysisResponse, 
    patientId?: string
  ): Promise<void> {
    const key = this.generateCacheKey(query, type, patientId)
    await this.set(key, query, response)
  }

  static cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    const expiredKeys = entries
      .filter(([, entry]) => now > entry.expiresAt.getTime())
      .map(([key]) => key)

    expiredKeys.forEach(key => this.cache.delete(key))

    if (this.cache.size > this.MAX_ENTRIES) {
      const sortedEntries = entries
        .filter(([key]) => !expiredKeys.includes(key))
        .sort((a, b) => {
          const scoreA = a[1].hitCount / ((now - a[1].createdAt.getTime()) / (1000 * 60 * 60))
          const scoreB = b[1].hitCount / ((now - b[1].createdAt.getTime()) / (1000 * 60 * 60))
          return scoreA - scoreB
        })

      const keysToRemove = sortedEntries
        .slice(0, sortedEntries.length - this.MAX_ENTRIES + 100)
        .map(([key]) => key)

      keysToRemove.forEach(key => this.cache.delete(key))
    }
  }

  static getStats(): {
    totalEntries: number
    hitRate: number
    memoryUsage: number
    oldestEntry: Date | null
    newestEntry: Date | null
    topQueries: Array<{ query: string; hits: number }>
  } {
    const entries = Array.from(this.cache.values())
    const totalEntries = entries.length

    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        hitRate: 0,
        memoryUsage: 0,
        oldestEntry: null,
        newestEntry: null,
        topQueries: []
      }
    }

    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const hitRate = totalHits / totalEntries

    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length

    const dates = entries.map(entry => entry.createdAt)
    const oldestEntry = new Date(Math.min(...dates.map(d => d.getTime())))
    const newestEntry = new Date(Math.max(...dates.map(d => d.getTime())))

    const topQueries = entries
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10)
      .map(entry => ({
        query: entry.query.substring(0, 50) + (entry.query.length > 50 ? '...' : ''),
        hits: entry.hitCount
      }))

    return {
      totalEntries,
      hitRate,
      memoryUsage,
      oldestEntry,
      newestEntry,
      topQueries
    }
  }

  static clear(): void {
    this.cache.clear()
  }

  static async warmupCache(): Promise<void> {
    const commonQueries = [
      {
        query: 'Exercícios para dor lombar',
        type: 'EXERCISE_SUGGESTION'
      },
      {
        query: 'Tratamento para capsulite adesiva',
        type: 'GENERAL_QUERY'
      },
      {
        query: 'Reabilitação pós cirurgia de LCA',
        type: 'EXERCISE_SUGGESTION'
      },
      {
        query: 'Exercícios para fortalecimento de CORE',
        type: 'EXERCISE_SUGGESTION'
      },
      {
        query: 'Tratamento para tendinite do manguito rotador',
        type: 'GENERAL_QUERY'
      }
    ]

    // Este seria chamado em background para popular o cache
    console.log('Cache warmup simulado para', commonQueries.length, 'queries comuns')
  }

  static scheduleCleanup(): void {
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000) // Limpar a cada hora
  }
}