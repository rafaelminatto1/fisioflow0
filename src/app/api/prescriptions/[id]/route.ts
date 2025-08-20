import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrescriptionService } from '@/services/prescription/prescriptionService'
import { z } from 'zod'

const updatePrescriptionSchema = z.object({
  sets: z.number().positive('Número de séries deve ser positivo').optional(),
  repetitions: z.number().positive('Número de repetições deve ser positivo').optional(),
  holdTime: z.number().positive('Tempo de sustentação deve ser positivo').optional(),
  frequency: z.string().min(1, 'Frequência é obrigatória').optional(),
  startDate: z.string().datetime().transform(date => new Date(date)).optional(),
  endDate: z.string().datetime().optional().transform(date => date ? new Date(date) : undefined),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
})

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

    const { id } = await params
    const result = await PrescriptionService.getPrescriptionById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 404 }
      )
    }

    // Verificar permissões
    if (session.user.role === 'PACIENTE' && 
        result.data.patientId !== session.user.patientId) {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    if (session.user.role === 'FISIOTERAPEUTA' && 
        result.data.therapistId !== session.user.therapistId) {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao buscar prescrição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id } = await params
    const body = await request.json()
    
    // Verificar se o usuário pode editar esta prescrição
    const prescription = await PrescriptionService.getPrescriptionById(id)
    if (!prescription.success) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' }, 
        { status: 404 }
      )
    }

    // Apenas ADMIN ou o fisioterapeuta que criou a prescrição pode editá-la
    if (session.user.role !== 'ADMIN' && 
        prescription.data.therapistId !== session.user.therapistId) {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const validatedData = updatePrescriptionSchema.parse(body)
    const result = await PrescriptionService.updatePrescription(id, validatedData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao atualizar prescrição:', error)
    
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

export async function DELETE(
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

    const { id } = await params
    
    // Verificar se o usuário pode deletar esta prescrição
    const prescription = await PrescriptionService.getPrescriptionById(id)
    if (!prescription.success) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' }, 
        { status: 404 }
      )
    }

    // Apenas ADMIN ou o fisioterapeuta que criou a prescrição pode deletá-la
    if (session.user.role !== 'ADMIN' && 
        prescription.data.therapistId !== session.user.therapistId) {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const result = await PrescriptionService.deletePrescription(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Prescrição deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar prescrição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}