import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SchedulingService } from "@/services/scheduling/schedulingService"
import { prisma } from "@/lib/prisma"

// GET - Buscar agendamento por ID
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
    
    // Buscar agendamento
    const appointment = await prisma.appointment.findUnique({
      where: { id: resolvedParams.id },
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
    
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }
    
    // Verificar permissões
    if (session.user.role === 'FISIOTERAPEUTA' && 
        appointment.therapistId !== session.user.therapistId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    if (session.user.role === 'PACIENTE' && 
        appointment.patientId !== session.user.patientId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    if (session.user.role === 'ESTAGIARIO' && 
        appointment.therapistId !== session.user.supervisorId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      data: appointment
    })
    
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar agendamento
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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FISIOTERAPEUTA') {
      return NextResponse.json({ error: "Sem permissão para atualizar agendamentos" }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Verificar se o terapeuta pode atualizar este agendamento
    if (session.user.role === 'FISIOTERAPEUTA') {
      const appointment = await prisma.appointment.findUnique({
        where: { id: resolvedParams.id }
      })
      
      if (!appointment || appointment.therapistId !== session.user.therapistId) {
        return NextResponse.json({ error: "Só pode atualizar seus próprios agendamentos" }, { status: 403 })
      }
    }
    
    const appointment = await SchedulingService.updateAppointment(resolvedParams.id, body)
    
    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Agendamento atualizado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error)
    
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

// DELETE - Cancelar agendamento
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
    
    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FISIOTERAPEUTA') {
      return NextResponse.json({ error: "Sem permissão para cancelar agendamentos" }, { status: 403 })
    }
    
    // Verificar se o terapeuta pode cancelar este agendamento
    if (session.user.role === 'FISIOTERAPEUTA') {
      const appointment = await prisma.appointment.findUnique({
        where: { id: resolvedParams.id }
      })
      
      if (!appointment || appointment.therapistId !== session.user.therapistId) {
        return NextResponse.json({ error: "Só pode cancelar seus próprios agendamentos" }, { status: 403 })
      }
    }
    
    const body = await request.json()
    const reason = body?.reason
    
    const appointment = await SchedulingService.cancelAppointment(resolvedParams.id, reason)
    
    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Agendamento cancelado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error)
    
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
