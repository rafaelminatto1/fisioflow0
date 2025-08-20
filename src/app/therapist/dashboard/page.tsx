'use client'

import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function TherapistDashboard() {
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
                Dashboard do Fisioterapeuta
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bem-vindo, Dr(a). {user?.name}!
              </p>
              {user?.crefito && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CREFITO: {user.crefito}
                </p>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pacientes Hoje</h3>
            <p className="text-2xl font-bold text-blue-600">5</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Próxima Consulta</h3>
            <p className="text-2xl font-bold text-green-600">14:00</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pacientes Ativos</h3>
            <p className="text-2xl font-bold text-purple-600">23</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avaliações Pendentes</h3>
            <p className="text-2xl font-bold text-orange-600">3</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agenda de Hoje */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Agenda de Hoje</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-medium">Maria Santos</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lombalgia</p>
                </div>
                <span className="text-sm font-medium">14:00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-medium">João Silva</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fisioterapia Respiratória</p>
                </div>
                <span className="text-sm font-medium">15:00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-medium">Ana Costa</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reabilitação Pós-Cirúrgica</p>
                </div>
                <span className="text-sm font-medium">16:00</span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link 
                href="/therapist/patients"
                className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <span className="font-medium">Gerenciar Pacientes</span>
              </Link>
              <Link 
                href="/therapist/schedule"
                className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <span className="font-medium">Agenda de Consultas</span>
              </Link>
              <button className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <span className="font-medium">Prescrever Exercícios</span>
              </button>
              <button className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                <span className="font-medium">Evolução Clínica</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
