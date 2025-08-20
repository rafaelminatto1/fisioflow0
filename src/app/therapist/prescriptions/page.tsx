'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, User, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePrescriptions } from '@/hooks/usePrescriptions'
import { usePatients } from '@/hooks/usePatients'
import { PrescriptionFilters, ExercisePrescription } from '@/types/prescription'
import { ExerciseCategoryLabels } from '@/types/exercise'

export default function PrescriptionsPage() {
  const { 
    prescriptions, 
    loading, 
    error, 
    pagination, 
    fetchPrescriptions, 
    deletePrescription 
  } = usePrescriptions()
  
  const { patients, fetchPatients } = usePatients()
  
  const [filters, setFilters] = useState<PrescriptionFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPrescriptions(filters, 1)
    fetchPatients()
  }, [fetchPrescriptions, fetchPatients, filters])

  const handleSearch = () => {
    if (searchTerm) {
      const patient = patients.find(p => 
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (patient) {
        setFilters({ ...filters, patientId: patient.id })
      }
    } else {
      const { patientId, ...otherFilters } = filters
      setFilters(otherFilters)
    }
  }

  const handleFilterChange = (key: keyof PrescriptionFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta prescrição?')) {
      await deletePrescription(id)
    }
  }

  const getStatusColor = (prescription: ExercisePrescription) => {
    if (!prescription.isActive) return 'bg-gray-100 text-gray-800'
    
    const now = new Date()
    const endDate = prescription.endDate ? new Date(prescription.endDate) : null
    
    if (endDate && endDate < now) {
      return 'bg-yellow-100 text-yellow-800'
    }
    
    return 'bg-green-100 text-green-800'
  }

  const getStatusLabel = (prescription: ExercisePrescription) => {
    if (!prescription.isActive) return 'Inativa'
    
    const now = new Date()
    const endDate = prescription.endDate ? new Date(prescription.endDate) : null
    
    if (endDate && endDate < now) {
      return 'Expirada'
    }
    
    return 'Ativa'
  }

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = new Date(startDate).toLocaleDateString('pt-BR')
    if (!endDate) return `Desde ${start}`
    const end = new Date(endDate).toLocaleDateString('pt-BR')
    return `${start} - ${end}`
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prescrições de Exercícios</h1>
          <p className="text-muted-foreground">
            Gerencie prescrições para seus pacientes
          </p>
        </div>
        <Link href="/therapist/prescriptions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Prescrição
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar por paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
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
                <label className="block text-sm font-medium mb-1">Paciente</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.patientId || ''}
                  onChange={(e) => handleFilterChange('patientId', e.target.value || undefined)}
                >
                  <option value="">Todos os pacientes</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
                  onChange={(e) => handleFilterChange('isActive', e.target.value ? e.target.value === 'true' : undefined)}
                >
                  <option value="">Todos os status</option>
                  <option value="true">Ativas</option>
                  <option value="false">Inativas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.exerciseCategory || ''}
                  onChange={(e) => handleFilterChange('exerciseCategory', e.target.value || undefined)}
                >
                  <option value="">Todas as categorias</option>
                  {Object.entries(ExerciseCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
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
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {prescription.exercise?.name}
                        </h3>
                        <Badge className={getStatusColor(prescription)}>
                          {getStatusLabel(prescription)}
                        </Badge>
                        {prescription.exercise?.category && (
                          <Badge variant="secondary">
                            {ExerciseCategoryLabels[prescription.exercise.category]}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{prescription.patient?.fullName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateRange(prescription.startDate, prescription.endDate)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>
                            {prescription.executions?.length || 0} execuções
                          </span>
                        </div>
                      </div>

                      {(prescription.sets || prescription.repetitions || prescription.frequency) && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            {prescription.sets && (
                              <div>
                                <span className="font-medium">Séries:</span> {prescription.sets}
                              </div>
                            )}
                            {prescription.repetitions && (
                              <div>
                                <span className="font-medium">Repetições:</span> {prescription.repetitions}
                              </div>
                            )}
                            {prescription.holdTime && (
                              <div>
                                <span className="font-medium">Tempo:</span> {prescription.holdTime}s
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Frequência:</span> {prescription.frequency}
                            </div>
                          </div>
                        </div>
                      )}

                      {prescription.executions && prescription.executions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Últimas execuções:</p>
                          <div className="flex flex-wrap gap-2">
                            {prescription.executions.slice(0, 5).map((execution) => (
                              <Badge key={execution.id} variant="outline" className="text-xs">
                                {new Date(execution.executedAt).toLocaleDateString('pt-BR')}
                                {execution.painLevel && ` - Dor: ${execution.painLevel}/10`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link href={`/therapist/prescriptions/${prescription.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/therapist/prescriptions/${prescription.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(prescription.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prescriptions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma prescrição encontrada.</p>
          <Link href="/therapist/prescriptions/new" className="mt-4 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Prescrição
            </Button>
          </Link>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button 
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => fetchPrescriptions(filters, pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button 
            variant="outline"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => fetchPrescriptions(filters, pagination.page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}