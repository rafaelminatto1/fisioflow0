'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, FileText, Activity, Brain, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAIChat, useAI } from '@/hooks/useAI'
import { usePatients } from '@/hooks/usePatients'

export default function AIAssistantPage() {
  const { messages, loading, error, sendMessage, clearMessages } = useAIChat()
  const { lastResponse } = useAI()
  const { patients, fetchPatients } = usePatients()
  
  const [inputMessage, setInputMessage] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const selectedPatientData = selectedPatient 
      ? patients.find(p => p.id === selectedPatient)
      : undefined

    const context = selectedPatientData ? {
      patientAge: new Date().getFullYear() - new Date(selectedPatientData.birthDate).getFullYear(),
      patientGender: selectedPatientData.gender,
      medicalHistory: selectedPatientData.medicalConditions.join(', ')
    } : undefined

    await sendMessage(inputMessage, selectedPatient || undefined, context)
    setInputMessage('')
  }

  const quickQuestions = [
    {
      icon: FileText,
      title: 'Análise de Prontuário',
      description: 'Analise dados de prontuário médico',
      prompt: 'Analise o seguinte prontuário e forneça insights sobre diagnóstico e tratamento:'
    },
    {
      icon: Activity,
      title: 'Sugestões de Exercícios',
      description: 'Obtenha exercícios para condições específicas',
      prompt: 'Sugira exercícios fisioterapêuticos para'
    },
    {
      icon: Brain,
      title: 'Dúvida Clínica',
      description: 'Esclareça dúvidas sobre casos clínicos',
      prompt: 'Tenho uma dúvida clínica sobre'
    },
    {
      icon: Sparkles,
      title: 'Protocolo de Tratamento',
      description: 'Orientações sobre protocolos de tratamento',
      prompt: 'Qual o melhor protocolo de tratamento para'
    }
  ]

  const formatProcessingTime = (time: number) => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Assistente de IA</h1>
              <p className="text-muted-foreground">
                Análise inteligente para fisioterapia
              </p>
            </div>
          </div>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Conversa com IA</CardTitle>
                <div className="flex gap-2">
                  {lastResponse && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatProcessingTime(lastResponse.processingTime)}
                      {lastResponse.cached && <Badge variant="outline" className="text-xs">Cache</Badge>}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearMessages}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              
              {patients.length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Paciente (opcional)
                  </label>
                  <select
                    className="w-full p-2 border rounded-md text-sm"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">Consulta geral</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="px-0">
              <div className="max-h-[500px] overflow-y-auto px-6 mb-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Olá! Sou seu assistente de IA especializado em fisioterapia.
                      Como posso ajudá-lo hoje?
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quickQuestions.map((question, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setInputMessage(question.prompt + ' ')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <question.icon className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <p className="font-medium text-sm">{question.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {question.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 mb-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-12'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            Processando...
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="px-6">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite sua pergunta ou pedido de análise..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !inputMessage.trim()}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {lastResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Última Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confiança:</span>
                  <Badge variant={lastResponse.confidence > 0.8 ? 'default' : 'secondary'}>
                    {Math.round(lastResponse.confidence * 100)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Provedor:</span>
                  <Badge variant="outline">{lastResponse.usedProvider}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo:</span>
                  <span className="text-sm">{formatProcessingTime(lastResponse.processingTime)}</span>
                </div>
                
                {lastResponse.cached && (
                  <Badge variant="outline" className="w-full justify-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Cache
                  </Badge>
                )}

                {lastResponse.suggestions?.exercises && lastResponse.suggestions.exercises.length > 0 && (
                  <div>
                    <Separator className="my-3" />
                    <h4 className="font-medium mb-2">Exercícios Sugeridos:</h4>
                    <div className="space-y-1">
                      {lastResponse.suggestions.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium">{exercise.exerciseName}</div>
                          <div className="text-muted-foreground">{exercise.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <strong>Seja específico:</strong> Forneça detalhes sobre o caso clínico
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <strong>Use contexto:</strong> Selecione um paciente para análises personalizadas
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <strong>Valide sempre:</strong> As sugestões são baseadas em IA, sempre valide clinicamente
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}