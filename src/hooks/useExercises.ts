import { useState, useEffect, useCallback } from 'react'
import { Exercise, CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters, ExerciseResponse } from '@/types/exercise'
import { ExerciseCategory, BodyRegion } from '@prisma/client'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchExercises = useCallback(async (filters: ExerciseFilters = {}, page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.bodyRegion?.length) params.append('bodyRegion', filters.bodyRegion.join(','))
      if (filters.difficulty) params.append('difficulty', filters.difficulty.toString())
      if (filters.equipment?.length) params.append('equipment', filters.equipment.join(','))
      if (filters.tags?.length) params.append('tags', filters.tags.join(','))
      if (filters.search) params.append('search', filters.search)
      if (filters.createdBy) params.append('createdBy', filters.createdBy)
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
      
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/exercises?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar exercícios')
      }

      const data: ExerciseResponse = await response.json()
      
      setExercises(data.exercises)
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar exercícios')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const createExercise = useCallback(async (data: CreateExerciseDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar exercício')
      }

      const newExercise = await response.json()
      setExercises(prev => [newExercise, ...prev])
      
      return { success: true, data: newExercise }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao criar exercício'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateExercise = useCallback(async (id: string, data: UpdateExerciseDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar exercício')
      }

      const updatedExercise = await response.json()
      setExercises(prev => 
        prev.map(exercise => 
          exercise.id === id ? updatedExercise : exercise
        )
      )
      
      return { success: true, data: updatedExercise }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao atualizar exercício'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteExercise = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar exercício')
      }

      setExercises(prev => prev.filter(exercise => exercise.id !== id))
      
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao deletar exercício'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const getExerciseById = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exercises/${id}`)
      
      if (!response.ok) {
        throw new Error('Exercício não encontrado')
      }

      const exercise = await response.json()
      return { success: true, data: exercise }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao buscar exercício'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshExercises = useCallback(() => {
    fetchExercises({}, pagination.page)
  }, [fetchExercises, pagination.page])

  return {
    exercises,
    loading,
    error,
    pagination,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    getExerciseById,
    refreshExercises,
    setError
  }
}

export function useExerciseCategories() {
  return {
    categories: Object.values(ExerciseCategory),
    getCategoryLabel: (category: ExerciseCategory) => {
      const labels = {
        STRETCHING: 'Alongamento',
        STRENGTHENING: 'Fortalecimento',
        MOBILITY: 'Mobilidade',
        BALANCE: 'Equilíbrio',
        CARDIO: 'Cardiovascular',
        FUNCTIONAL: 'Funcional'
      }
      return labels[category]
    }
  }
}

export function useBodyRegions() {
  return {
    regions: Object.values(BodyRegion),
    getRegionLabel: (region: BodyRegion) => {
      const labels = {
        CERVICAL: 'Cervical',
        THORACIC: 'Torácico',
        LUMBAR: 'Lombar',
        SHOULDER: 'Ombro',
        ELBOW: 'Cotovelo',
        WRIST_HAND: 'Punho/Mão',
        HIP: 'Quadril',
        KNEE: 'Joelho',
        ANKLE_FOOT: 'Tornozelo/Pé',
        CORE: 'Core'
      }
      return labels[region]
    }
  }
}