import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ExerciseService } from '@/services/exercise/exerciseService'
import { ExerciseFilters } from '@/types/exercises'

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
    
    const filters: ExerciseFilters = {
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      region: searchParams.get('region') || undefined,
      search: searchParams.get('search') || undefined,
      therapistId: searchParams.get('therapistId') || undefined
    }

    // Se for fisioterapeuta, filtrar apenas seus exercícios
    if (session.user.role === 'FISIOTERAPEUTA' && session.user.therapistId) {
      filters.therapistId = session.user.therapistId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await ExerciseService.getExercises(filters, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar exercícios:', error)
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

    const result = await ExerciseService.createExercise(body, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar exercício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}