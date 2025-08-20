'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Ainda carregando

    if (session?.user) {
      // Usuário autenticado, redirecionar para dashboard baseado no role
      const { role } = session.user
      
      switch (role) {
        case 'ADMIN':
          router.push('/admin/dashboard')
          break
        case 'FISIOTERAPEUTA':
          router.push('/therapist/dashboard')
          break
        case 'ESTAGIARIO':
          router.push('/intern/dashboard')
          break
        case 'PACIENTE':
          router.push('/patient/dashboard')
          break
        case 'PARCEIRO':
          router.push('/partner/dashboard')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FisioFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Sistema de Gestão para Clínicas de Fisioterapia
          </p>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Sistema em Desenvolvimento</h2>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>✅ Configuração do projeto</span>
                  <span className="text-green-600">Completo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>✅ Schema do banco de dados</span>
                  <span className="text-green-600">Completo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>✅ Sistema de autenticação</span>
                  <span className="text-green-600">Completo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🔄 Gestão de pacientes</span>
                  <span className="text-blue-600">Em progresso</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link 
                href="/auth/signin"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrar no Sistema
              </Link>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Seguindo a arquitetura com Next.js 14 + TypeScript + Prisma
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}