export interface AIProvider {
  name: string
  apiKey: string
  endpoint: string
  model: string
  isActive: boolean
  priority: number
  dailyQuotaUsed: number
  dailyQuotaLimit: number
}

export interface AIAnalysisRequest {
  type: 'MEDICAL_RECORD' | 'EVOLUTION' | 'EXERCISE_SUGGESTION' | 'GENERAL_QUERY'
  patientId?: string
  content: string
  context?: {
    medicalHistory?: string
    currentDiagnosis?: string
    previousTreatments?: string
    patientAge?: number
    patientGender?: string
  }
}

export interface AIAnalysisResponse {
  success: boolean
  response: string
  suggestions?: {
    exercises?: ExerciseSuggestion[]
    treatments?: TreatmentSuggestion[]
    observations?: string[]
  }
  confidence: number
  usedProvider: string
  processingTime: number
  cached: boolean
  error?: string
}

export interface ExerciseSuggestion {
  exerciseId: string
  exerciseName: string
  category: string
  bodyRegion: string[]
  reasoning: string
  recommendedSets?: number
  recommendedReps?: number
  recommendedFrequency?: string
  priority: number
}

export interface TreatmentSuggestion {
  type: 'EXERCISE' | 'THERAPY' | 'OBSERVATION' | 'REFERRAL'
  title: string
  description: string
  reasoning: string
  priority: number
  duration?: string
}

export interface RAGDocument {
  id: string
  title: string
  content: string
  type: 'PROTOCOL' | 'RESEARCH' | 'GUIDELINE' | 'CASE_STUDY' | 'EXERCISE_DATABASE'
  tags: string[]
  source: string
  createdAt: Date
  updatedAt: Date
  embedding?: number[]
  isActive: boolean
}

export interface RAGQueryRequest {
  query: string
  type?: string
  limit?: number
  similarityThreshold?: number
  filters?: {
    type?: string[]
    tags?: string[]
    source?: string
  }
}

export interface RAGQueryResponse {
  success: boolean
  documents: RAGDocument[]
  similarities: number[]
  totalFound: number
  processingTime: number
  error?: string
}

export interface AIConversation {
  id: string
  userId: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    patientId?: string
    exerciseId?: string
    analysisType?: string
    usedProvider?: string
    processingTime?: number
  }
}

export interface AIKnowledgeBase {
  id: string
  title: string
  description: string
  category: 'PROTOCOLS' | 'RESEARCH' | 'GUIDELINES' | 'EXERCISES' | 'TREATMENTS'
  documents: RAGDocument[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CacheEntry {
  key: string
  query: string
  response: AIAnalysisResponse
  createdAt: Date
  expiresAt: Date
  hitCount: number
}

export interface AIUsageStats {
  totalQueries: number
  queriesThisMonth: number
  cacheHitRate: number
  averageResponseTime: number
  topProviders: Array<{
    provider: string
    usage: number
    successRate: number
  }>
  queryTypes: Record<string, number>
  costSavings: {
    cacheHits: number
    estimatedSavings: number
  }
}

export interface AIConfig {
  providers: AIProvider[]
  caching: {
    enabled: boolean
    ttl: number
    maxEntries: number
  }
  rag: {
    enabled: boolean
    chunkSize: number
    overlapSize: number
    minSimilarity: number
    maxDocuments: number
  }
  quotas: {
    dailyLimit: number
    monthlyLimit: number
    perUserLimit: number
  }
}