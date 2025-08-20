'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          
          {user && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Logado como: <strong>{user.name}</strong>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Role: <strong>{user.role}</strong>
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Voltar ao Início
            </Link>
            
            {user?.role === 'ADMIN' && (
              <Link 
                href="/admin/dashboard"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Dashboard Admin
              </Link>
            )}
            
            {user?.role === 'FISIOTERAPEUTA' && (
              <Link 
                href="/therapist/dashboard"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Dashboard Fisioterapeuta
              </Link>
            )}
            
            {user?.role === 'PACIENTE' && (
              <Link 
                href="/patient/dashboard"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Dashboard Paciente
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
