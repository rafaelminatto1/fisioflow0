'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Gift, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVouchers, useVoucherStats } from '@/hooks/useVouchers'
import { VoucherFilters } from '@/types/vouchers'
import { VoucherStatusLabels, VoucherStatusColors } from '@/types/vouchers'
import { VoucherStatus } from '@prisma/client'

export default function VouchersPage() {
  const { 
    vouchers, 
    loading, 
    error, 
    pagination, 
    fetchVouchers 
  } = useVouchers()
  
  const { stats, loading: statsLoading, fetchStats } = useVoucherStats()
  
  const [filters, setFilters] = useState<VoucherFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchVouchers(filters, 1)
    fetchStats()
  }, [fetchVouchers, fetchStats, filters])

  const handleFilterChange = (key: keyof VoucherFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Vouchers</h1>
          <p className="text-muted-foreground">
            Gerencie vouchers de desconto e parcerias
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Voucher
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Vouchers</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.total}
                  </p>
                </div>
                <Gift className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vouchers Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Resgatado</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.redeemedValue)}
                  </p>
                </div>
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar por código ou parceiro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine sua busca</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value as VoucherStatus || undefined)}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(VoucherStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor Mínimo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={filters.minValue || ''}
                  onChange={(e) => handleFilterChange('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor Máximo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 1000,00"
                  value={filters.maxValue || ''}
                  onChange={(e) => handleFilterChange('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      )}

      <div className="space-y-4">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-semibold">
                      {voucher.code}
                    </code>
                    <Badge className={VoucherStatusColors[voucher.status]}>
                      {VoucherStatusLabels[voucher.status]}
                    </Badge>
                    {isExpired(voucher.expiresAt) && voucher.status === VoucherStatus.ACTIVE && (
                      <Badge variant="destructive">Expirado</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <div className="font-semibold text-lg">{formatCurrency(voucher.value)}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Parceiro:</span>
                      <div className="font-medium">{voucher.partner?.businessName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{voucher.partner?.specialty}</div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Expira em:</span>
                      <div className={`font-medium ${isExpired(voucher.expiresAt) ? 'text-red-600' : ''}`}>
                        {formatDate(voucher.expiresAt)}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <div className="font-medium">{formatDate(voucher.createdAt)}</div>
                    </div>
                  </div>

                  {voucher.status === VoucherStatus.REDEEMED && voucher.patient && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-green-700 font-medium">Resgatado por:</span>
                          <div className="text-sm font-semibold">{voucher.patient.fullName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600">em</div>
                          <div className="text-sm font-medium">
                            {voucher.redeemedAt ? formatDate(voucher.redeemedAt) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    Taxa da plataforma: {formatCurrency(voucher.platformFee)} • 
                    Valor do parceiro: {formatCurrency(voucher.partnerEarning)}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vouchers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum voucher encontrado.</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Voucher
          </Button>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button 
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => fetchVouchers(filters, pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button 
            variant="outline"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => fetchVouchers(filters, pagination.page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}