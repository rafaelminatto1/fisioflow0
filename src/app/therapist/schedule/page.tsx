'use client'

import { useState } from 'react'
import { useAppointments } from '@/hooks/useAppointments'
import { useAuth } from '@/hooks/useAuth'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentStatus, Appointment } from '@prisma/client'
import { AppointmentWithPatient } from '@/services/scheduling/schedulingService'

export default function SchedulePage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const {
    appointments,
    loading,
    error,
    createAppointment,
    cancelAppointment
  } = useAppointments({
    therapistId: user?.therapistId,
    startDate: format(startOfWeek(selectedDate), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(selectedDate), 'yyyy-MM-dd')
  })

  // Gerar dias da semana
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate)
  })

  // Agrupar agendamentos por dia
  const appointmentsByDay = weekDays.map(day => ({
    date: day,
    appointments: appointments.filter(apt => 
      isSameDay(new Date(apt.scheduledAt), day)
    )
  }))

  const handleCreateAppointment = async (data: Record<string, unknown>) => {
    try {
      await createAppointment({
        patientId: data.patientId as string,
        therapistId: user?.therapistId || '',
        scheduledAt: data.scheduledAt as string,
        duration: data.duration as number,
        price: data.price as number || 0
      })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      alert('Erro ao criar agendamento')
    }
  }

  const handleCancelAppointment = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await cancelAppointment(id, 'Cancelado pelo fisioterapeuta')
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
        alert('Erro ao cancelar agendamento')
      }
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CHECKED_IN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeIcon = () => {
    return '📅'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Agenda de Consultas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie seus agendamentos e horários
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Nova Consulta
            </button>
          </div>
        </div>

        {/* Navegação da semana */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ← Semana Anterior
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(startOfWeek(selectedDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(endOfWeek(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}
            </h2>
            
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Próxima Semana →
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Calendário da semana */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {/* Cabeçalhos dos dias */}
            {weekDays.map((day, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 text-center">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={`text-lg font-bold ${
                  isSameDay(day, new Date()) 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'dd')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Conteúdo dos dias */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {appointmentsByDay.map((dayData, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 min-h-96 p-2">
                <div className="space-y-2">
                  {dayData.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{getTypeIcon()}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {appointment.patient?.user?.name || 'Paciente'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(appointment.scheduledAt), 'HH:mm')} - {appointment.duration}min
                          </div>
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayData.appointments.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                      Nenhuma consulta
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de criação - placeholder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Agendar Nova Consulta</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Funcionalidade em desenvolvimento. Use o Prisma Studio para adicionar agendamentos por enquanto.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
