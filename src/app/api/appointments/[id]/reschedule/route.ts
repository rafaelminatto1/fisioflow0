import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SchedulingService } from "@/services/scheduling/schedulingService"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const rescheduleSchema = z.object({
  newDate: z.string().transform(str => new Date(str))
})

// POST - Reagendar consulta
export async function POST(
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
      return NextResponse.json({ error: "Sem permissão para reagendar consultas" }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = rescheduleSchema.parse(body)
    
    // Verificar se o terapeuta pode reagendar esta consulta
    if (session.user.role === 'FISIOTERAPEUTA') {
      const appointment = await prisma.appointment.findUnique({
        where: { id: resolvedParams.id }
      })
      
      if (!appointment || appointment.therapistId !== session.user.therapistId) {
        return NextResponse.json({ error: "Só pode reagendar suas próprias consultas" }, { status: 403 })
      }
    }
    
    const appointment = await SchedulingService.rescheduleAppointment(
      resolvedParams.id,
      validatedData.newDate
    )
    
    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Consulta reagendada com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao reagendar consulta:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Data inválida", details: error.issues },
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
