'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Edit, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useExercises, useExerciseCategories, useBodyRegions } from '@/hooks/useExercises'
import { ExerciseFilters } from '@/types/exercise'
import { ExerciseCategoryLabels, BodyRegionLabels } from '@/types/exercise'

export default function ExercisesPage() {
  const { 
    exercises, 
    loading, 
    error, 
    pagination, 
    fetchExercises, 
    deleteExercise 
  } = useExercises()
  
  const { categories } = useExerciseCategories()
  const { regions } = useBodyRegions()
  
  const [filters, setFilters] = useState<ExerciseFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchExercises(filters, 1)
  }, [fetchExercises, filters])

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm })
  }

  const handleFilterChange = (key: keyof ExerciseFilters, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este exercício?')) {
      await deleteExercise(id)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800'
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Muito Fácil', 'Fácil', 'Moderado', 'Difícil', 'Muito Difícil']
    return labels[difficulty] || 'N/A'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">
            Gerencie exercícios fisioterapêuticos
          </p>
        </div>
        <Link href="/therapist/exercises/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Exercício
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar exercícios..."
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
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {ExerciseCategoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dificuldade</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.difficulty || ''}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Todas as dificuldades</option>
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>
                      {getDifficultyLabel(level)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Visibilidade</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.isPublic !== undefined ? filters.isPublic.toString() : ''}
                  onChange={(e) => handleFilterChange('isPublic', e.target.value ? e.target.value === 'true' : undefined)}
                >
                  <option value="">Todos</option>
                  <option value="true">Públicos</option>
                  <option value="false">Privados</option>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {exercise.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {exercise.description}
                  </CardDescription>
                </div>
                {exercise.thumbnailUrl && (
                  <img 
                    src={exercise.thumbnailUrl} 
                    alt={exercise.name}
                    className="w-16 h-16 object-cover rounded-lg ml-3"
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">
                    {ExerciseCategoryLabels[exercise.category]}
                  </Badge>
                  <Badge 
                    className={getDifficultyColor(exercise.difficulty)}
                  >
                    {getDifficultyLabel(exercise.difficulty)}
                  </Badge>
                  {!exercise.isPublic && (
                    <Badge variant="outline">Privado</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {exercise.bodyRegion.slice(0, 3).map(region => (
                    <Badge key={region} variant="outline" className="text-xs">
                      {BodyRegionLabels[region]}
                    </Badge>
                  ))}
                  {exercise.bodyRegion.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{exercise.bodyRegion.length - 3}
                    </Badge>
                  )}
                </div>

                {exercise.equipment.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Equipamentos:</strong> {exercise.equipment.join(', ')}
                  </div>
                )}

                {exercise.duration && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Duração:</strong> {Math.floor(exercise.duration / 60)}min {exercise.duration % 60}s
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-1">
                    <Link href={`/therapist/exercises/${exercise.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/therapist/exercises/${exercise.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum exercício encontrado.</p>
          <Link href="/therapist/exercises/new" className="mt-4 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Exercício
            </Button>
          </Link>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button 
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => fetchExercises(filters, pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button 
            variant="outline"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => fetchExercises(filters, pagination.page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}