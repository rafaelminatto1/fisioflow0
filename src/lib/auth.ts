import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            therapist: true,
            patient: true,
            partner: true,
          }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        if (!user.active) {
          throw new Error('Conta desativada. Entre em contato com o administrador.')
        }

        // Validações específicas por role
        if (user.role === Role.FISIOTERAPEUTA && !user.crefito) {
          throw new Error('CREFITO não encontrado para fisioterapeuta.')
        }

        if (user.role === Role.ESTAGIARIO && !user.supervisorId) {
          throw new Error('Supervisor não atribuído para estagiário.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          crefito: user.crefito || undefined,
          supervisorId: user.supervisorId || undefined,
          therapistId: user.therapist?.id,
          patientId: user.patient?.id,
          partnerId: user.partner?.id,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.crefito = user.crefito
        token.supervisorId = user.supervisorId
        token.therapistId = user.therapistId
        token.patientId = user.patientId
        token.partnerId = user.partnerId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as Role
        session.user.crefito = token.crefito as string
        session.user.supervisorId = token.supervisorId as string
        session.user.therapistId = token.therapistId as string
        session.user.patientId = token.patientId as string
        session.user.partnerId = token.partnerId as string
      }
      return session
    },
    async signIn({ user, account }) {
      // Para login com Google
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Criar usuário automaticamente com role PACIENTE
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              role: Role.PACIENTE,
            }
          })
        }
      }

      return true
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account }) {
      console.log(`Login realizado: ${user.email} via ${account?.provider}`)
    }
  }
})

declare module "next-auth" {
  interface User {
    role: Role
    crefito?: string
    supervisorId?: string
    therapistId?: string
    patientId?: string
    partnerId?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: Role
      crefito?: string
      supervisorId?: string
      therapistId?: string
      patientId?: string
      partnerId?: string
    }
  }
}


