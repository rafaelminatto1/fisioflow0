import { useState, useCallback } from 'react'
import { AIAnalysisResponse, AIAnalysisRequest } from '@/types/ai'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<AIAnalysisResponse | null>(null)

  const analyzeContent = useCallback(async (request: Omit<AIAnalysisRequest, 'type'> & { type: string }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na análise de IA')
      }

      const result: AIAnalysisResponse = await response.json()
      setLastResponse(result)
      
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro na análise de IA'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const queryAI = useCallback(async (
    query: string, 
    patientId?: string,
    context?: {
      medicalHistory?: string
      currentDiagnosis?: string
      previousTreatments?: string
      patientAge?: number
      patientGender?: string
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          patientId,
          context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na consulta à IA')
      }

      const result: AIAnalysisResponse = await response.json()
      setLastResponse(result)
      
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro na consulta à IA'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const getExerciseSuggestions = useCallback(async (
    patientId: string,
    diagnosis?: string,
    bodyRegion?: string,
    limitations?: string,
    goals?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          diagnosis,
          bodyRegion,
          limitations,
          goals
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao obter sugestões de exercícios')
      }

      const result: AIAnalysisResponse = await response.json()
      setLastResponse(result)
      
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao obter sugestões de exercícios'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeMedicalRecord = useCallback(async (
    content: string,
    patientId?: string,
    context?: {
      medicalHistory?: string
      currentDiagnosis?: string
      previousTreatments?: string
      patientAge?: number
      patientGender?: string
    }
  ) => {
    return analyzeContent({
      type: 'MEDICAL_RECORD',
      content,
      patientId,
      context
    })
  }, [analyzeContent])

  const analyzeEvolution = useCallback(async (
    content: string,
    patientId?: string,
    context?: {
      medicalHistory?: string
      currentDiagnosis?: string
      previousTreatments?: string
      patientAge?: number
      patientGender?: string
    }
  ) => {
    return analyzeContent({
      type: 'EVOLUTION',
      content,
      patientId,
      context
    })
  }, [analyzeContent])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearLastResponse = useCallback(() => {
    setLastResponse(null)
  }, [])

  return {
    loading,
    error,
    lastResponse,
    analyzeContent,
    queryAI,
    getExerciseSuggestions,
    analyzeMedicalRecord,
    analyzeEvolution,
    clearError,
    clearLastResponse
  }
}

export function useAIChat() {
  const [messages, setMessages] = useState<Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    loading?: boolean
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { queryAI } = useAI()

  const sendMessage = useCallback(async (
    message: string,
    patientId?: string,
    context?: any
  ) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      loading: true
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setLoading(true)
    setError(null)

    try {
      const result = await queryAI(message, patientId, context)

      if (result.success && result.data) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: result.data!.response, loading: false }
            : msg
        ))
      } else {
        throw new Error(result.error || 'Erro na resposta da IA')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      setError(errorMessage)
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: `Erro: ${errorMessage}`, loading: false }
          : msg
      ))
    } finally {
      setLoading(false)
    }
  }, [queryAI])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  }
}