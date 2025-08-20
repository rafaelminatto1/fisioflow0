import { useState, useEffect } from 'react'
import { Appointment, AppointmentStatus } from '@prisma/client'
import { AppointmentWithPatient } from '@/services/scheduling/schedulingService'

export interface AppointmentFilters {
  therapistId?: string
  patientId?: string
  startDate?: string
  endDate?: string
  status?: AppointmentStatus
}

export interface CreateAppointmentDto {
  patientId: string
  therapistId: string
  scheduledAt: string
  duration: number
  notes?: string
  status?: AppointmentStatus
  price?: number
}

export function useAppointments(initialFilters?: AppointmentFilters) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AppointmentFilters>(initialFilters || {})

  const fetchAppointments = async (newFilters?: AppointmentFilters) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentFilters = newFilters || filters
      
      const params = new URLSearchParams()
      if (currentFilters.therapistId) params.append('therapistId', currentFilters.therapistId)
      if (currentFilters.patientId) params.append('patientId', currentFilters.patientId)
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate)
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate)
      if (currentFilters.status) params.append('status', currentFilters.status)

      
      const response = await fetch(`/api/appointments?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar agendamentos')
      }
      
      setAppointments((data.data || []) as AppointmentWithPatient[])
      setFilters(currentFilters)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createAppointment = async (data: CreateAppointmentDto): Promise<AppointmentWithPatient> => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar agendamento')
      }
      
      // Recarregar lista
      await fetchAppointments()
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const updateAppointment = async (id: string, data: Partial<CreateAppointmentDto>): Promise<AppointmentWithPatient> => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar agendamento')
      }
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id ? { ...apt, ...result.data } : apt
        )
      )
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const cancelAppointment = async (id: string, reason?: string): Promise<AppointmentWithPatient> => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar agendamento')
      }
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id ? { ...apt, ...result.data } : apt
        )
      )
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const rescheduleAppointment = async (id: string, newDate: string): Promise<AppointmentWithPatient> => {
    try {
      const response = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newDate }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reagendar consulta')
      }
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id ? { ...apt, ...result.data } : apt
        )
      )
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const applyFilters = (newFilters: AppointmentFilters) => {
    fetchAppointments(newFilters)
  }

  const refreshAppointments = () => {
    fetchAppointments(filters)
  }

  useEffect(() => {
    fetchAppointments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    appointments,
    loading,
    error,
    filters,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    rescheduleAppointment,
    applyFilters,
    refreshAppointments,
  }
}

// Hook para buscar um agendamento específico
export function useAppointment(id: string | null) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointment = async (appointmentId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/appointments/${appointmentId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar agendamento')
      }
      
      setAppointment(data.data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchAppointment(id)
    }
  }, [id])

  return {
    appointment,
    loading,
    error,
    refetch: () => id && fetchAppointment(id),
  }
}
