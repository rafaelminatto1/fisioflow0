import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrescriptionService } from '@/services/prescription/prescriptionService'
import { z } from 'zod'

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório'),
  exerciseId: z.string().min(1, 'ID do exercício é obrigatório'),
  sets: z.number().positive('Número de séries deve ser positivo'),
  repetitions: z.number().positive('Número de repetições deve ser positivo'),
  holdTime: z.number().positive('Tempo de sustentação deve ser positivo').optional(),
  frequency: z.string().min(1, 'Frequência é obrigatória'),
  startDate: z.string().datetime().transform(date => new Date(date)),
  endDate: z.string().datetime().optional().transform(date => date ? new Date(date) : undefined),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      patientId: searchParams.get('patientId') || undefined,
      exerciseId: searchParams.get('exerciseId') || undefined,
      isActive: searchParams.get('isActive') ? 
        searchParams.get('isActive') === 'true' : undefined,
      therapistId: searchParams.get('therapistId') || undefined
    }

    // Se for fisioterapeuta, filtrar apenas suas prescrições
    if (session.user.role === 'FISIOTERAPEUTA' && session.user.therapistId) {
      filters.therapistId = session.user.therapistId
    }

    // Se for paciente, filtrar apenas suas prescrições
    if (session.user.role === 'PACIENTE' && session.user.patientId) {
      filters.patientId = session.user.patientId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await PrescriptionService.getPrescriptions(filters, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar prescrições:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
    
    // Se for fisioterapeuta, atribuir automaticamente o therapistId
    if (session.user.role === 'FISIOTERAPEUTA' && session.user.therapistId) {
      body.therapistId = session.user.therapistId
    }

    const validatedData = createPrescriptionSchema.parse(body)
    const result = await PrescriptionService.createPrescription(validatedData, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar prescrição:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}