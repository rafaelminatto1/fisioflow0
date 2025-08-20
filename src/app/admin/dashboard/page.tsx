'use client'

import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bem-vindo, {user?.name}!
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{user?.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CREFITO</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{user?.crefito || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Sistema</h3>
            <p className="text-3xl font-bold text-green-600">Online</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Banco conectado ao Neon DB</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Autenticação</h3>
            <p className="text-3xl font-bold text-blue-600">NextAuth v5</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sistema funcionando</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Database</h3>
            <p className="text-3xl font-bold text-purple-600">Neon</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">PostgreSQL com seed</p>
          </div>
        </div>

        {/* Test Data */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Dados de Teste</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Admin:</strong> admin@fisioflow.com / admin123</div>
            <div><strong>Fisioterapeuta:</strong> fisio@fisioflow.com / fisio123</div>
            <div><strong>Paciente:</strong> paciente@fisioflow.com / paciente123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
