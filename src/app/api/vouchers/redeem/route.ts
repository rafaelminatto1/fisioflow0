import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { VoucherService } from '@/services/vouchers/voucherService'

const redeemSchema = z.object({
  code: z.string().min(1, 'Código do voucher é obrigatório'),
  patientId: z.string().min(1, 'ID do paciente é obrigatório')
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
    const validatedData = redeemSchema.parse(body)

    const result = await VoucherService.redeemVoucher(validatedData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    return NextResponse.json({
      voucher: result.data,
      message: result.message
    })
  } catch (error) {
    console.error('Erro ao resgatar voucher:', error)
    
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