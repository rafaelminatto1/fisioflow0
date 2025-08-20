import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PatientService } from "@/services/patient/patientService"
import { z } from "zod"
import { Gender } from "@prisma/client"

const createPatientSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().transform(str => new Date(str)),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional(),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  dataConsent: z.boolean(),
  imageConsent: z.boolean().default(false),
})

const searchSchema = z.object({
  search: z.string().optional(),
  active: z.boolean().optional(),
  therapistId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// GET - Listar pacientes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Verificar permissões
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'FISIOTERAPEUTA' && userRole !== 'ESTAGIARIO') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      active: searchParams.get('active') === 'true',
      therapistId: searchParams.get('therapistId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }
    
    const validatedParams = searchSchema.parse(queryParams)
    
    // Se for estagiário, filtrar apenas pacientes do supervisor
    const filters = userRole === 'ESTAGIARIO' && session.user.supervisorId
      ? { ...validatedParams, therapistId: session.user.supervisorId }
      : validatedParams
    
    const result = await PatientService.findPatients(
      filters,
      validatedParams.page,
      validatedParams.limit
    )
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error)
    
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

// POST - Criar paciente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Verificar permissões
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'FISIOTERAPEUTA') {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)
    
    const patient = await PatientService.createPatient({
      ...validatedData,
      createdBy: session.user.id
    })
    
    return NextResponse.json({
      success: true,
      data: patient,
      message: "Paciente criado com sucesso"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Erro ao criar paciente:", error)
    
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
