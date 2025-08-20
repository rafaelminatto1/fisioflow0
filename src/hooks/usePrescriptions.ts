import { useState, useCallback } from 'react'
import { 
  ExercisePrescription, 
  CreatePrescriptionDTO, 
  UpdatePrescriptionDTO,
  CreateExecutionDTO,
  ExerciseExecution,
  PrescriptionFilters,
  PrescriptionResponse,
  PrescriptionStats,
  PatientProgress
} from '@/types/prescription'

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchPrescriptions = useCallback(async (filters: PrescriptionFilters = {}, page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.therapistId) params.append('therapistId', filters.therapistId)
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
      if (filters.exerciseCategory) params.append('exerciseCategory', filters.exerciseCategory)
      
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/prescriptions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar prescrições')
      }

      const data: PrescriptionResponse = await response.json()
      
      setPrescriptions(data.prescriptions)
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar prescrições')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const createPrescription = useCallback(async (data: CreatePrescriptionDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar prescrição')
      }

      const newPrescription = await response.json()
      setPrescriptions(prev => [newPrescription, ...prev])
      
      return { success: true, data: newPrescription }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao criar prescrição'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePrescription = useCallback(async (id: string, data: UpdatePrescriptionDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate?.toISOString(),
          endDate: data.endDate?.toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar prescrição')
      }

      const updatedPrescription = await response.json()
      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === id ? updatedPrescription : prescription
        )
      )
      
      return { success: true, data: updatedPrescription }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao atualizar prescrição'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePrescription = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar prescrição')
      }

      setPrescriptions(prev => prev.filter(prescription => prescription.id !== id))
      
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao deletar prescrição'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const getPrescriptionById = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${id}`)
      
      if (!response.ok) {
        throw new Error('Prescrição não encontrada')
      }

      const prescription = await response.json()
      return { success: true, data: prescription }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar prescrição'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPrescriptions = useCallback(() => {
    fetchPrescriptions({}, pagination.page)
  }, [fetchPrescriptions, pagination.page])

  return {
    prescriptions,
    loading,
    error,
    pagination,
    fetchPrescriptions,
    createPrescription,
    updatePrescription,
    deletePrescription,
    getPrescriptionById,
    refreshPrescriptions,
    setError
  }
}

export function useExecutions() {
  const [executions, setExecutions] = useState<ExerciseExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExecutions = useCallback(async (prescriptionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/executions`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar execuções')
      }

      const data = await response.json()
      setExecutions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar execuções')
    } finally {
      setLoading(false)
    }
  }, [])

  const createExecution = useCallback(async (prescriptionId: string, data: Omit<CreateExecutionDTO, 'prescriptionId'>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao registrar execução')
      }

      const newExecution = await response.json()
      setExecutions(prev => [newExecution, ...prev])
      
      return { success: true, data: newExecution }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao registrar execução'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    executions,
    loading,
    error,
    fetchExecutions,
    createExecution,
    setError
  }
}

export function usePrescriptionStats() {
  const [stats, setStats] = useState<PrescriptionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (therapistId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = therapistId ? `?therapistId=${therapistId}` : ''
      const response = await fetch(`/api/prescriptions/stats${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}

export function usePatientProgress() {
  const [progress, setProgress] = useState<PatientProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async (patientId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/patients/${patientId}/progress`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar progresso do paciente')
      }

      const data = await response.json()
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar progresso do paciente')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    progress,
    loading,
    error,
    fetchProgress
  }
}