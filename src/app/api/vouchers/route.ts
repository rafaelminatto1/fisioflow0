import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { VoucherService } from '@/services/vouchers/voucherService'
import { VoucherStatus } from '@prisma/client'

const createVoucherSchema = z.object({
  partnerId: z.string().min(1, 'ID do parceiro é obrigatório'),
  value: z.number().positive('Valor deve ser positivo'),
  expiresAt: z.string().datetime().transform(date => new Date(date)),
  quantity: z.number().positive().optional().default(1)
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createVoucherSchema.parse(body)

    const result = await VoucherService.createVoucher(validatedData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Erro na API de vouchers:', error)
    
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
      partnerId: searchParams.get('partnerId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') as VoucherStatus || undefined,
      expiresAfter: searchParams.get('expiresAfter') ? 
        new Date(searchParams.get('expiresAfter')!) : undefined,
      expiresBefore: searchParams.get('expiresBefore') ? 
        new Date(searchParams.get('expiresBefore')!) : undefined,
      minValue: searchParams.get('minValue') ? 
        parseFloat(searchParams.get('minValue')!) : undefined,
      maxValue: searchParams.get('maxValue') ? 
        parseFloat(searchParams.get('maxValue')!) : undefined
    }

    // Filtrar por parceiro se for um usuário parceiro
    if (session.user.role === 'PARCEIRO' && session.user.partnerId) {
      filters.partnerId = session.user.partnerId
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await VoucherService.getVouchers(filters, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar vouchers:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}