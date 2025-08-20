import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AIService } from '@/services/ai/aiService'
import { AICacheService } from '@/services/ai/cacheService'

const querySchema = z.object({
  query: z.string().min(1, 'Pergunta é obrigatória'),
  patientId: z.string().optional(),
  context: z.object({
    medicalHistory: z.string().optional(),
    currentDiagnosis: z.string().optional(),
    previousTreatments: z.string().optional(),
    patientAge: z.number().optional(),
    patientGender: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = querySchema.parse(body)

    const cachedResponse = await AICacheService.getCachedResponse(
      validatedData.query,
      'GENERAL_QUERY',
      validatedData.patientId
    )

    if (cachedResponse) {
      return NextResponse.json(cachedResponse)
    }

    const analysisRequest = {
      type: 'GENERAL_QUERY' as const,
      content: validatedData.query,
      patientId: validatedData.patientId,
      context: validatedData.context
    }

    const result = await AIService.analyzeContent(analysisRequest)

    if (result.success) {
      await AICacheService.cacheResponse(
        validatedData.query,
        'GENERAL_QUERY',
        result,
        validatedData.patientId
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro na API de query de IA:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        response: '',
        confidence: 0,
        usedProvider: 'error',
        processingTime: 0,
        cached: false
      },
      { status: 500 }
    )
  }
}