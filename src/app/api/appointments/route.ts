import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SchedulingService } from "@/services/scheduling/schedulingService"
import { z } from "zod"
import { AppointmentStatus } from "@prisma/client"

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "ID do paciente é obrigatório"),
  therapistId: z.string().min(1, "ID do terapeuta é obrigatório"),
  scheduledAt: z.string().transform(str => new Date(str)),
  duration: z.number().min(15, "Duração mínima é 15 minutos").max(480, "Duração máxima é 8 horas"),
  notes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional()
})

const searchSchema = z.object({
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional()
})

// GET - Listar agendamentos
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const queryParams = {
      therapistId: searchParams.get('therapistId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') as AppointmentStatus || undefined
    }
    
    const validatedParams = searchSchema.parse(queryParams)
    
    // Filtrar por permissões do usuário
    const filters = (() => {
      if (session.user.role === 'FISIOTERAPEUTA') {
        return { ...validatedParams, therapistId: session.user.therapistId }
      } else if (session.user.role === 'PACIENTE') {
        return { ...validatedParams, patientId: session.user.patientId }
      } else if (session.user.role === 'ESTAGIARIO') {
        // Estagiário só vê agendamentos do supervisor
        if (session.user.supervisorId) {
          return { ...validatedParams, therapistId: session.user.supervisorId }
        }
      }
      return validatedParams
    })()
    
    // Definir datas padrão se não fornecidas
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date()
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
    
    let appointments
    if (filters.therapistId) {
      appointments = await SchedulingService.getTherapistAppointments(
        filters.therapistId,
        startDate,
        endDate
      )
    } else if (filters.patientId) {
      appointments = await SchedulingService.getPatientAppointments(
        filters.patientId,
        startDate,
        endDate
      )
    } else {
      return NextResponse.json({ error: "Filtro de terapeuta ou paciente é obrigatório" }, { status: 400 })
    }
    
    // Aplicar filtros adicionais
    if (filters.status) {
      appointments = appointments.filter(apt => apt.status === filters.status)
    }
    

    
    return NextResponse.json({
      success: true,
      data: appointments,
      count: appointments.length
    })
    
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FISIOTERAPEUTA') {
      return NextResponse.json({ error: "Sem permissão para criar agendamentos" }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)
    
    // Verificar se o terapeuta pode criar para este paciente
    if (session.user.role === 'FISIOTERAPEUTA' && 
        validatedData.therapistId !== session.user.therapistId) {
      return NextResponse.json({ error: "Só pode criar agendamentos para si mesmo" }, { status: 403 })
    }
    
    const appointment = await SchedulingService.createAppointment(validatedData)
    
    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Agendamento criado com sucesso"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }
    
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
