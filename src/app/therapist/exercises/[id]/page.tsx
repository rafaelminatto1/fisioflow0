'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Play, Copy, Users, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useExercises } from '@/hooks/useExercises'
import { Exercise } from '@/types/exercise'
import { ExerciseCategoryLabels, BodyRegionLabels } from '@/types/exercise'

export default function ExerciseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { getExerciseById, deleteExercise } = useExercises()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadExercise(params.id as string)
    }
  }, [params.id])

  const loadExercise = async (id: string) => {
    setLoading(true)
    const result = await getExerciseById(id)
    
    if (result.success) {
      setExercise(result.data)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!exercise) return
    
    if (window.confirm('Tem certeza que deseja deletar este exercício? Esta ação não pode ser desfeita.')) {
      const result = await deleteExercise(exercise.id)
      
      if (result.success) {
        router.push('/therapist/exercises')
      } else {
        setError(result.error)
      }
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}min ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Exercício não encontrado'}</p>
          <Link href="/therapist/exercises">
            <Button variant="outline">Voltar para Exercícios</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/therapist/exercises">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{exercise.name}</h1>
            <p className="text-muted-foreground">
              Criado em {new Date(exercise.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/therapist/exercises/${exercise.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações do Exercício</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {ExerciseCategoryLabels[exercise.category]}
                  </Badge>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {getDifficultyLabel(exercise.difficulty)}
                  </Badge>
                  {!exercise.isPublic && (
                    <Badge variant="outline">Privado</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{exercise.description}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Instruções</h3>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {exercise.instructions}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(exercise.videoUrl || exercise.thumbnailUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Mídia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercise.thumbnailUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Imagem</h4>
                      <img 
                        src={exercise.thumbnailUrl} 
                        alt={exercise.name}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  
                  {exercise.videoUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Vídeo</h4>
                      <div className="space-y-2">
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border">
                          <Play className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Assistir Vídeo
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exercise.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Duração:</strong> {formatDuration(exercise.duration)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Dificuldade:</strong> {getDifficultyLabel(exercise.difficulty)}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Regiões do Corpo</h4>
                  <div className="flex flex-wrap gap-1">
                    {exercise.bodyRegion.map(region => (
                      <Badge key={region} variant="outline" className="text-xs">
                        {BodyRegionLabels[region]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {exercise.equipment.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Equipamentos</h4>
                    <div className="flex flex-wrap gap-1">
                      {exercise.equipment.map(equipment => (
                        <Badge key={equipment} variant="secondary" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {exercise.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/therapist/prescriptions/new?exerciseId=${exercise.id}`}>
                    <Users className="h-4 w-4 mr-2" />
                    Prescrever para Paciente
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar Exercício
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado:</span>
                  <span>{new Date(exercise.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado:</span>
                  <span>{new Date(exercise.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibilidade:</span>
                  <span>{exercise.isPublic ? 'Público' : 'Privado'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}