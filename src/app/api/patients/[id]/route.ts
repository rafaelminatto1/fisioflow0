import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PatientService } from "@/services/patient/patientService"

// GET - Buscar paciente por ID
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
    if (userRole !== 'ADMIN' && userRole !== 'FISIOTERAPEUTA' && userRole !== 'ESTAGIARIO' && userRole !== 'PACIENTE') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    const patient = await PatientService.findPatientById(resolvedParams.id)
    
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
    }
    
    // Se for paciente, só pode ver seus próprios dados
    if (userRole === 'PACIENTE' && patient.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      data: patient
    })
    
  } catch (error) {
    console.error("Erro ao buscar paciente:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar paciente
export async function PUT(
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
    if (userRole !== 'ADMIN' && userRole !== 'FISIOTERAPEUTA') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    const body = await request.json()
    
    const patient = await PatientService.updatePatient(resolvedParams.id, body)
    
    return NextResponse.json({
      success: true,
      data: patient,
      message: "Paciente atualizado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error)
    
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

// DELETE - Remover paciente (LGPD)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Apenas admin pode deletar
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    await PatientService.deletePatient(resolvedParams.id, session.user.id)
    
    return NextResponse.json({
      success: true,
      message: "Paciente removido conforme LGPD"
    })
    
  } catch (error) {
    console.error("Erro ao remover paciente:", error)
    
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
