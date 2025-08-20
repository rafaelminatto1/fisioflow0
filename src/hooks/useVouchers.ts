import { useState, useCallback } from 'react'
import { 
  Voucher, 
  CreateVoucherDTO, 
  UpdateVoucherDTO,
  RedeemVoucherDTO,
  VoucherFilters,
  VoucherResponse,
  VoucherStats
} from '@/types/vouchers'

export function useVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchVouchers = useCallback(async (filters: VoucherFilters = {}, page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.partnerId) params.append('partnerId', filters.partnerId)
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.status) params.append('status', filters.status)
      if (filters.expiresAfter) params.append('expiresAfter', filters.expiresAfter.toISOString())
      if (filters.expiresBefore) params.append('expiresBefore', filters.expiresBefore.toISOString())
      if (filters.minValue) params.append('minValue', filters.minValue.toString())
      if (filters.maxValue) params.append('maxValue', filters.maxValue.toString())
      
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/vouchers?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar vouchers')
      }

      const data: VoucherResponse = await response.json()
      
      setVouchers(data.vouchers)
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar vouchers')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const createVoucher = useCallback(async (data: CreateVoucherDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar voucher')
      }

      const newVouchers = await response.json()
      
      // Se criou múltiplos vouchers, adicionar todos
      if (Array.isArray(newVouchers)) {
        setVouchers(prev => [...newVouchers, ...prev])
      } else {
        setVouchers(prev => [newVouchers, ...prev])
      }
      
      return { success: true, data: newVouchers }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao criar voucher'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateVoucher = useCallback(async (id: string, data: UpdateVoucherDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar voucher')
      }

      const updatedVoucher = await response.json()
      setVouchers(prev => 
        prev.map(voucher => 
          voucher.id === id ? updatedVoucher : voucher
        )
      )
      
      return { success: true, data: updatedVoucher }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao atualizar voucher'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const redeemVoucher = useCallback(async (data: RedeemVoucherDTO) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao resgatar voucher')
      }

      const result = await response.json()
      
      // Atualizar o voucher na lista
      setVouchers(prev => 
        prev.map(voucher => 
          voucher.code === data.code ? result.voucher : voucher
        )
      )
      
      return { 
        success: true, 
        data: result.voucher,
        message: result.message
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao resgatar voucher'
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const validateVoucher = useCallback(async (code: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(code)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao validar voucher')
      }

      const validation = await response.json()
      return { success: true, data: validation }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao validar voucher'
      setError(error)
      return { success: false, error }
    }
  }, [])

  const refreshVouchers = useCallback(() => {
    fetchVouchers({}, pagination.page)
  }, [fetchVouchers, pagination.page])

  return {
    vouchers,
    loading,
    error,
    pagination,
    fetchVouchers,
    createVoucher,
    updateVoucher,
    redeemVoucher,
    validateVoucher,
    refreshVouchers,
    setError
  }
}

export function useVoucherStats() {
  const [stats, setStats] = useState<VoucherStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vouchers/stats')
      
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

export function useVoucherValidation() {
  const [validationResult, setValidationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setValidationResult(null)

    try {
      const response = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(code)}`)
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || 'Erro ao validar código')
        return
      }
      
      setValidationResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar código')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearValidation = useCallback(() => {
    setValidationResult(null)
    setError(null)
  }, [])

  return {
    validationResult,
    loading,
    error,
    validateCode,
    clearValidation
  }
}