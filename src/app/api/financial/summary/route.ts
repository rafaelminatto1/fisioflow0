import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FinancialService } from '@/services/financial/financialService'

export async function GET() {
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

    // Se for fisioterapeuta, filtrar apenas seus dados

    const summary = await FinancialService.getFinancialSummary()

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Erro na API de resumo financeiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}