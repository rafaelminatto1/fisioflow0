import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Páginas públicas
  if (path.startsWith('/auth') || path === '/') {
    return NextResponse.next()
  }

  // Verificar se usuário está autenticado
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Proteção por role
  const role = session.user.role as Role

  // Rotas administrativas
  if (path.startsWith("/admin")) {
    if (role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Rotas de fisioterapeuta
  if (path.startsWith("/therapist")) {
    if (role !== Role.ADMIN && role !== Role.FISIOTERAPEUTA) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Rotas de estagiário (precisa de supervisor)
  if (path.startsWith("/intern")) {
    if (role !== Role.ESTAGIARIO || !session.user.supervisorId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Rotas de paciente
  if (path.startsWith("/patient")) {
    if (role !== Role.ADMIN && role !== Role.PACIENTE) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Rotas de parceiro
  if (path.startsWith("/partner")) {
    if (role !== Role.ADMIN && role !== Role.PARCEIRO) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Rotas do dashboard principal
  if (path.startsWith("/dashboard")) {
    // Redirecionar baseado no role
    if (role === Role.PACIENTE) {
      return NextResponse.redirect(new URL("/patient/dashboard", req.url))
    }
    if (role === Role.PARCEIRO) {
      return NextResponse.redirect(new URL("/partner/dashboard", req.url))
    }
    if (role === Role.FISIOTERAPEUTA) {
      return NextResponse.redirect(new URL("/therapist/dashboard", req.url))
    }
    if (role === Role.ADMIN) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Proteger todas as rotas exceto as públicas
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
