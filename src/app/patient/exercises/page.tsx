'use client'

import { useEffect, useState } from 'react'
import { Play, CheckCircle, Clock, Target, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePatientPrescriptions } from '@/hooks/usePatientPortal'
import { ExerciseCategoryLabels } from '@/types/exercise'

export default function PatientExercisesPage() {
  const { prescriptions, loading, error, fetchPrescriptions, recordExecution } = usePatientPrescriptions()
  const [completingExercise, setCompletingExercise] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active'>('active')

  useEffect(() => {
    fetchPrescriptions(filter === 'active')
  }, [fetchPrescriptions, filter])

  const handleCompleteExercise = async (prescriptionId: string) => {
    setCompletingExercise(prescriptionId)
    
    try {
      const painLevel = window.prompt('Qual seu nível de dor de 0 a 10?')
      const difficulty = window.prompt('Qual a dificuldade do exercício de 1 a 5?')
      
      await recordExecution(prescriptionId, {
        setsCompleted: 1,
        repsCompleted: 1,
        painLevel: painLevel ? parseInt(painLevel) : undefined,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
        notes: 'Exercício completado pelo paciente'
      })
    } catch (error) {
      console.error('Erro ao completar exercício:', error)
    } finally {
      setCompletingExercise(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchPrescriptions(filter === 'active')}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/patient/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Meus Exercícios</h1>
          <p className="text-muted-foreground">
            Exercícios prescritos para seu tratamento
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Exercícios Ativos
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos os Exercícios
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhum Exercício Encontrado</h2>
              <p className="text-muted-foreground">
                {filter === 'active' 
                  ? 'Você não tem exercícios ativos no momento.'
                  : 'Você ainda não tem exercícios prescritos.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {prescription.exercise.name}
                    </CardTitle>
                    <CardDescription className="mb-3">
                      {prescription.exercise.description}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">
                        {ExerciseCategoryLabels[prescription.exercise.category as keyof typeof ExerciseCategoryLabels]}
                      </Badge>
                      <Badge className={getDifficultyColor(prescription.exercise.difficulty)}>
                        {getDifficultyLabel(prescription.exercise.difficulty)}
                      </Badge>
                      {!prescription.isActive && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  
                  {prescription.exercise.thumbnailUrl && (
                    <img 
                      src={prescription.exercise.thumbnailUrl} 
                      alt={prescription.exercise.name}
                      className="w-24 h-24 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Instruções do Exercício */}
                <div>
                  <h4 className="font-medium mb-2">Como fazer:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {prescription.exercise.instructions}
                  </p>
                </div>

                {/* Parâmetros da Prescrição */}
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-3">Prescrição:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {prescription.sets && (
                      <div>
                        <span className="text-muted-foreground">Séries:</span>
                        <div className="font-medium">{prescription.sets}</div>
                      </div>
                    )}
                    {prescription.repetitions && (
                      <div>
                        <span className="text-muted-foreground">Repetições:</span>
                        <div className="font-medium">{prescription.repetitions}</div>
                      </div>
                    )}
                    {prescription.holdTime && (
                      <div>
                        <span className="text-muted-foreground">Tempo:</span>
                        <div className="font-medium">{prescription.holdTime}s</div>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Frequência:</span>
                      <div className="font-medium">{prescription.frequency}</div>
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Progresso</h4>
                    <span className="text-sm font-medium">
                      {prescription.progress.completionRate}%
                    </span>
                  </div>
                  <Progress value={prescription.progress.completionRate} />
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{prescription.progress.totalExecutions}</span> execuções
                    </div>
                    <div>
                      <span className="font-medium">{prescription.progress.thisWeekExecutions}</span> esta semana
                    </div>
                    <div>
                      {prescription.progress.lastExecution ? (
                        <>Última: {formatDate(prescription.progress.lastExecution)}</>
                      ) : (
                        'Nunca executado'
                      )}
                    </div>
                  </div>
                </div>

                {/* Período de Tratamento */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Início: {formatDate(prescription.startDate)}
                  </div>
                  {prescription.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Fim: {formatDate(prescription.endDate)}
                    </div>
                  )}
                </div>

                {/* Terapeuta */}
                <div className="text-sm text-muted-foreground">
                  <strong>Prescrito por:</strong> {prescription.therapist.name} - {prescription.therapist.specialty}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  {prescription.exercise.videoUrl && (
                    <Button variant="outline" asChild>
                      <a href={prescription.exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4 mr-2" />
                        Ver Vídeo
                      </a>
                    </Button>
                  )}
                  
                  {prescription.isActive && (
                    <Button
                      onClick={() => handleCompleteExercise(prescription.id)}
                      disabled={completingExercise === prescription.id}
                    >
                      {completingExercise === prescription.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Registrando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Feito
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}