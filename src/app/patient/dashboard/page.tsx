'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Activity, TrendingUp, Play, CheckCircle, AlertCircle, User, Heart, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePatientPortal, usePatientPrescriptions } from '@/hooks/usePatientPortal'
import { useAuth } from '@/hooks/useAuth'
import { PatientDashboardData } from '@/types/patientPortal'
import { ExerciseCategoryLabels } from '@/types/exercise'

export default function PatientDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const { dashboardData, loading, error, fetchDashboardData } = usePatientPortal()
  const { recordExecution } = usePatientPrescriptions()
  
  const [completingExercise, setCompletingExercise] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  const handleCompleteExercise = async (prescriptionId: string) => {
    setCompletingExercise(prescriptionId)
    
    try {
      await recordExecution(prescriptionId, {
        setsCompleted: 1,
        repsCompleted: 1,
        painLevel: 3,
        difficulty: 3,
        notes: 'Exercício completado via dashboard'
      })
      
      // Recarregar dados
      fetchDashboardData()
    } catch (error) {
      console.error('Erro ao completar exercício:', error)
    } finally {
      setCompletingExercise(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />
      default: return <TrendingUp className="h-4 w-4 text-gray-400" />
    }
  }

  if (authLoading || loading) {
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
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao Carregar Dashboard</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>Tentar Novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Dados Não Encontrados</h2>
              <p className="text-muted-foreground">Não foi possível carregar seus dados.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Olá, {dashboardData.patient.fullName}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu portal de fisioterapia. Acompanhe seu progresso e tratamento.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prescrições Ativas</p>
                <p className="text-2xl font-bold text-primary">
                  {dashboardData.stats.activePrescriptions}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execuções Totais</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.stats.completedExecutions}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas Consultas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats.upcomingAppointments}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Aderência</p>
                <p className={`text-2xl font-bold ${getProgressColor(dashboardData.healthSummary.adherenceRate)}`}>
                  {dashboardData.healthSummary.adherenceRate}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercícios Ativos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exercícios Ativos</CardTitle>
                  <CardDescription>Seus exercícios prescritos atualmente</CardDescription>
                </div>
                <Link href="/patient/exercises">
                  <Button variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.activePrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum exercício ativo no momento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.activePrescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{prescription.exercise.name}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {ExerciseCategoryLabels[prescription.exercise.category as keyof typeof ExerciseCategoryLabels]}
                            </Badge>
                            <Badge variant="outline">
                              Nível {prescription.exercise.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {prescription.frequency}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Progresso</p>
                          <p className="font-medium">{prescription.progress.completionRate}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Total: {prescription.progress.totalExecutions}</span>
                          <span>Esta semana: {prescription.progress.thisWeekExecutions}</span>
                          {prescription.progress.averagePainLevel && (
                            <span>Dor média: {prescription.progress.averagePainLevel.toFixed(1)}/10</span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link href={`/patient/exercises/${prescription.exercise.id}`}>
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteExercise(prescription.id)}
                            disabled={completingExercise === prescription.id}
                          >
                            {completingExercise === prescription.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Concluir
                          </Button>
                        </div>
                      </div>
                      
                      <Progress value={prescription.progress.completionRate} className="mt-3" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próximas Consultas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Consultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma consulta agendada
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingAppointments.slice(0, 2).map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDate(appointment.scheduledAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.therapist.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.duration}min - {appointment.therapist.specialty}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <Link href="/patient/appointments" className="mt-3 block">
                <Button variant="outline" className="w-full">
                  Ver Todas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Resumo de Saúde */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Resumo de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aderência</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getProgressColor(dashboardData.healthSummary.adherenceRate)}`}>
                      {dashboardData.healthSummary.adherenceRate}%
                    </span>
                  </div>
                </div>
                
                {dashboardData.healthSummary.averagePainLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dor Média</span>
                    <span className="font-medium">
                      {dashboardData.healthSummary.averagePainLevel.toFixed(1)}/10
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendência</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(dashboardData.healthSummary.progressTrend)}
                    <span className="text-sm font-medium capitalize">
                      {dashboardData.healthSummary.progressTrend === 'improving' ? 'Melhorando' :
                       dashboardData.healthSummary.progressTrend === 'declining' ? 'Piorando' : 'Estável'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-1 bg-primary/10 rounded">
                        {activity.type === 'EXERCISE_COMPLETED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {activity.type === 'APPOINTMENT_ATTENDED' && <Calendar className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
