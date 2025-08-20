import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AIService } from '@/services/ai/aiService'
import { AICacheService } from '@/services/ai/cacheService'
import { prisma } from '@/lib/prisma'

const suggestionsSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório'),
  diagnosis: z.string().optional(),
  bodyRegion: z.string().optional(),
  limitations: z.string().optional(),
  goals: z.string().optional()
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'FISIOTERAPEUTA') {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = suggestionsSchema.parse(body)

    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: {
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    const patientAge = new Date().getFullYear() - new Date(patient.birthDate).getFullYear()

    const medicalRecord = patient.medicalRecords[0]
    
    const requestContent = `
DADOS DO PACIENTE:
- Idade: ${patientAge} anos
- Gênero: ${patient.gender}
- Diagnóstico: ${validatedData.diagnosis || medicalRecord?.physioDiagnosis || 'Não especificado'}
- Região afetada: ${validatedData.bodyRegion || 'Não especificado'}
- Limitações: ${validatedData.limitations || 'Não especificado'}
- Objetivos: ${validatedData.goals || 'Reabilitação geral'}

HISTÓRICO MÉDICO:
- Alergias: ${patient.allergies.join(', ') || 'Nenhuma'}
- Medicações: ${patient.medications.join(', ') || 'Nenhuma'}
- Condições médicas: ${patient.medicalConditions.join(', ') || 'Nenhuma'}

${medicalRecord ? `
ÚLTIMO PRONTUÁRIO:
- Queixa principal: ${medicalRecord.chiefComplaint}
- História da doença atual: ${medicalRecord.presentIllness}
- Diagnóstico fisioterapêutico: ${medicalRecord.physioDiagnosis}
` : ''}

Baseado nessas informações, sugira exercícios fisioterapêuticos específicos e apropriados para este paciente.
`

    const cacheKey = AICacheService.generateCacheKey(
      requestContent,
      'EXERCISE_SUGGESTION',
      validatedData.patientId
    )

    const cachedResponse = await AICacheService.get(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse)
    }

    const analysisRequest = {
      type: 'EXERCISE_SUGGESTION' as const,
      content: requestContent,
      patientId: validatedData.patientId,
      context: {
        patientAge,
        patientGender: patient.gender,
        currentDiagnosis: validatedData.diagnosis || medicalRecord?.physioDiagnosis,
        medicalHistory: patient.medicalConditions.join(', ')
      }
    }

    const result = await AIService.analyzeContent(analysisRequest)

    if (result.success) {
      await AICacheService.set(cacheKey, requestContent, result)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro na API de sugestões de IA:', error)
    
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