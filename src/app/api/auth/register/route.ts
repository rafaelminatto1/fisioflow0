import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"


const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  role: z.nativeEnum(Role),
  crefito: z.string().optional(),
  supervisorId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  // Validar CREFITO para fisioterapeutas
  if (data.role === Role.FISIOTERAPEUTA && !data.crefito) {
    return false
  }
  return true
}, {
  message: "CREFITO é obrigatório para fisioterapeutas",
  path: ["crefito"],
}).refine((data) => {
  // Validar supervisor para estagiários
  if (data.role === Role.ESTAGIARIO && !data.supervisorId) {
    return false
  }
  return true
}, {
  message: "Supervisor é obrigatório para estagiários",
  path: ["supervisorId"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      )
    }

    // Verificar CREFITO único para fisioterapeutas
    if (validatedData.role === Role.FISIOTERAPEUTA && validatedData.crefito) {
      const existingCrefito = await prisma.user.findFirst({
        where: { crefito: validatedData.crefito }
      })

      if (existingCrefito) {
        return NextResponse.json(
          { error: "CREFITO já está em uso" },
          { status: 400 }
        )
      }
    }

    // Verificar se supervisor existe (para estagiários)
    if (validatedData.role === Role.ESTAGIARIO && validatedData.supervisorId) {
      const supervisor = await prisma.user.findFirst({
        where: {
          id: validatedData.supervisorId,
          role: Role.FISIOTERAPEUTA,
        }
      })

      if (!supervisor) {
        return NextResponse.json(
          { error: "Supervisor não encontrado" },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        crefito: validatedData.crefito,
        supervisorId: validatedData.supervisorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        crefito: true,
        createdAt: true,
      }
    })

    // Criar perfis específicos baseado no role
    if (validatedData.role === Role.FISIOTERAPEUTA) {
      await prisma.therapist.create({
        data: {
          userId: user.id,
          crefito: validatedData.crefito!,
          specialty: "Não informado", // Será preenchido depois
        }
      })
    }

    return NextResponse.json(
      { 
        message: "Usuário criado com sucesso",
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erro no registro:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
