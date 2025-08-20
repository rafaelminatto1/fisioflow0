import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FinancialService } from '@/services/financial/financialService'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const therapistId = searchParams.get('therapistId')
    
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      )
    }
    
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    
    // Se for fisioterapeuta, filtrar apenas seus dados
    const filteredTherapistId = session.user.role === 'FISIOTERAPEUTA' 
      ? session.user.therapistId || session.user.id
      : therapistId || undefined
    
    const report = await FinancialService.generateReport(
      startDate,
      endDate,
      filteredTherapistId
    )
    
    return NextResponse.json(report)
  } catch (error) {
    console.error('Erro na API de relatórios financeiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}