import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { PrescriptionService } from '@/services/prescription/prescriptionService'

const createExecutionSchema = z.object({
  setsCompleted: z.number().positive().optional(),
  repsCompleted: z.number().positive().optional(),
  painLevel: z.number().min(0).max(10).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createExecutionSchema.parse(body)
    const resolvedParams = await params

    const executionData = {
      ...validatedData,
      prescriptionId: resolvedParams.id
    }

    const result = await PrescriptionService.createExecution(executionData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar execução:', error)
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const result = await PrescriptionService.getExecutionsByPrescription(resolvedParams.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao buscar execuções:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}