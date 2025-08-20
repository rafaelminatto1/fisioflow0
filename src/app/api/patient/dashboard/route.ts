import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PatientPortalService } from '@/services/patient/patientPortalService'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    if (session.user.role !== 'PACIENTE') {
      return NextResponse.json(
        { error: 'Permissão negada' }, 
        { status: 403 }
      )
    }

    if (!session.user.patientId) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' }, 
        { status: 404 }
      )
    }

    const dashboardData = await PatientPortalService.getDashboardData(session.user.patientId)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Erro na API de dashboard do paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}