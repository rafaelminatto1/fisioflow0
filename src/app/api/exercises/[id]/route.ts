import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ExerciseService } from '@/services/exercise/exerciseService'
import { z } from 'zod'

const updateExerciseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  category: z.string().optional(),
  bodyRegion: z.array(z.string()).min(1, 'Selecione pelo menos uma região do corpo').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  instructions: z.string().min(1, 'Instruções são obrigatórias').optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().positive().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  equipment: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
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
    const result = await ExerciseService.getExerciseById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao buscar exercício:', error)
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
    
    // Verificar se o usuário pode editar este exercício
    const exercise = await ExerciseService.getExerciseById(id)
    if (!exercise.success) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' }, 
        { status: 404 }
      )
    }

    // Apenas ADMIN ou o criador do exercício pode editá-lo
    if (session.user.role !== 'ADMIN' && 
        exercise.data.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const validatedData = updateExerciseSchema.parse(body)
    const result = await ExerciseService.updateExercise(id, validatedData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao atualizar exercício:', error)
    
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
    
    // Verificar se o usuário pode deletar este exercício
    const exercise = await ExerciseService.getExerciseById(id)
    if (!exercise.success) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' }, 
        { status: 404 }
      )
    }

    // Apenas ADMIN pode deletar exercícios
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const result = await ExerciseService.deleteExercise(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Exercício deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar exercício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}