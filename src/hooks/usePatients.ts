import { useState, useEffect } from 'react'
import { Patient, PatientFilters, PaginatedResponse, CreatePatientDto } from '@/types'

export function usePatients(initialFilters?: PatientFilters) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState<PatientFilters>(initialFilters || {})

  const fetchPatients = async (newFilters?: PatientFilters, page?: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentFilters = newFilters || filters
      const currentPage = page || pagination.page
      
      const params = new URLSearchParams()
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.active !== undefined) params.append('active', currentFilters.active.toString())
      if (currentFilters.therapistId) params.append('therapistId', currentFilters.therapistId)
      params.append('page', currentPage.toString())
      params.append('limit', pagination.limit.toString())
      
      const response = await fetch(`/api/patients?${params}`)
      const data: PaginatedResponse<Patient> = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar pacientes')
      }
      
      setPatients(data.data || [])
      setPagination(data.pagination)
      setFilters(currentFilters)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createPatient = async (data: CreatePatientDto): Promise<Patient> => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar paciente')
      }
      
      // Recarregar lista
      await fetchPatients()
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const updatePatient = async (id: string, data: Partial<CreatePatientDto>): Promise<Patient> => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar paciente')
      }
      
      // Atualizar lista local
      setPatients(prev => 
        prev.map(patient => 
          patient.id === id ? { ...patient, ...result.data } : patient
        )
      )
      
      return result.data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const deletePatient = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover paciente')
      }
      
      // Remover da lista local
      setPatients(prev => prev.filter(patient => patient.id !== id))
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const exportPatientData = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/patients/${id}/export`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao exportar dados')
      }
      
      // Trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dados-paciente-${id}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const changePage = (page: number) => {
    fetchPatients(filters, page)
  }

  const applyFilters = (newFilters: PatientFilters) => {
    fetchPatients(newFilters, 1)
  }

  const refreshPatients = () => {
    fetchPatients(filters, pagination.page)
  }

  useEffect(() => {
    fetchPatients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    patients,
    loading,
    error,
    pagination,
    filters,
    createPatient,
    updatePatient,
    deletePatient,
    exportPatientData,
    changePage,
    applyFilters,
    refreshPatients,
  }
}

// Hook para buscar um paciente específico
export function usePatient(id: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = async (patientId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/patients/${patientId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar paciente')
      }
      
      setPatient(data.data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchPatient(id)
    }
  }, [id])

  return {
    patient,
    loading,
    error,
    refetch: () => id && fetchPatient(id),
  }
}
