import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PatientService } from "@/services/patient/patientService"

// GET - Exportar dados do paciente (LGPD - Portabilidade)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Verificar permissões
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'FISIOTERAPEUTA' && userRole !== 'PACIENTE') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    // Se for paciente, verificar se está acessando seus próprios dados
    if (userRole === 'PACIENTE') {
      const patient = await PatientService.findPatientById(resolvedParams.id)
      if (!patient || patient.userId !== session.user.id) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
      }
    }
    
    const exportData = await PatientService.exportPatientData(resolvedParams.id)
    
    // Configurar headers para download
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Content-Disposition', `attachment; filename="dados-paciente-${resolvedParams.id}.json"`)
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error("Erro ao exportar dados:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
