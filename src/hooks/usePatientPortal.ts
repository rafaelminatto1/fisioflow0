import { useState, useCallback, useEffect } from 'react'
import { 
  PatientDashboardData, 
  PatientPrescription, 
  PatientProfile,
  PatientAppointmentRequest,
  PatientExerciseExecution
} from '@/types/patientPortal'

export function usePatientPortal() {
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/patient/dashboard')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar dados do dashboard')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar dados do dashboard'
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDashboard = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    refreshDashboard,
    setError
  }
}

export function usePatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrescriptions = useCallback(async (activeOnly: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = activeOnly ? '?active=true' : ''
      const response = await fetch(`/api/patient/prescriptions${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar prescrições')
      }

      const data = await response.json()
      setPrescriptions(data)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar prescrições'
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const recordExecution = useCallback(async (
    prescriptionId: string,
    execution: {
      setsCompleted?: number
      repsCompleted?: number
      painLevel?: number
      difficulty?: number
      notes?: string
    }
  ) => {
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(execution),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao registrar execução')
      }

      const newExecution = await response.json()
      
      // Atualizar a prescrição local
      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === prescriptionId 
            ? {
                ...prescription,
                progress: {
                  ...prescription.progress,
                  totalExecutions: prescription.progress.totalExecutions + 1,
                  thisWeekExecutions: prescription.progress.thisWeekExecutions + 1,
                  lastExecution: new Date()
                }
              }
            : prescription
        )
      )
      
      return { success: true, data: newExecution }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao registrar execução'
      setError(error)
      return { success: false, error }
    }
  }, [])

  return {
    prescriptions,
    loading,
    error,
    fetchPrescriptions,
    recordExecution,
    setError
  }
}

export function usePatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async (upcoming: boolean = true) => {
    setLoading(true)
    setError(null)

    try {
      const params = upcoming ? '?upcoming=true' : ''
      const response = await fetch(`/api/patient/appointments${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar agendamentos')
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar agendamentos'
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const requestAppointment = useCallback(async (request: PatientAppointmentRequest) => {
    setError(null)

    try {
      const response = await fetch('/api/patient/appointments/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao solicitar agendamento')
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao solicitar agendamento'
      setError(error)
      return { success: false, error }
    }
  }, [])

  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao cancelar agendamento')
      }

      // Atualizar lista local
      setAppointments(prev => 
        prev.filter((apt: any) => apt.id !== appointmentId)
      )
      
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao cancelar agendamento'
      setError(error)
      return { success: false, error }
    }
  }, [])

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    requestAppointment,
    cancelAppointment,
    setError
  }
}

export function usePatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/patient/profile')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar perfil')
      }

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar perfil'
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<PatientProfile>) => {
    setError(null)

    try {
      const response = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar perfil')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      
      return { success: true, data: updatedProfile }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
      setError(error)
      return { success: false, error }
    }
  }, [])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    setError
  }
}