import { 
  AIProvider, 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  ExerciseSuggestion,
  TreatmentSuggestion 
} from '@/types/ai'

export class AIService {
  private static providers: AIProvider[] = [
    {
      name: 'OpenAI GPT-3.5',
      apiKey: process.env.OPENAI_API_KEY || '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      isActive: true,
      priority: 1,
      dailyQuotaUsed: 0,
      dailyQuotaLimit: 100
    },
    {
      name: 'Anthropic Claude',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-haiku-20240307',
      isActive: true,
      priority: 2,
      dailyQuotaUsed: 0,
      dailyQuotaLimit: 50
    },
    {
      name: 'Groq Llama',
      apiKey: process.env.GROQ_API_KEY || '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama2-70b-4096',
      isActive: true,
      priority: 3,
      dailyQuotaUsed: 0,
      dailyQuotaLimit: 200
    }
  ]

  private static getAvailableProvider(): AIProvider | null {
    const activeProviders = this.providers
      .filter(p => p.isActive && p.dailyQuotaUsed < p.dailyQuotaLimit)
      .sort((a, b) => a.priority - b.priority)

    return activeProviders[0] || null
  }

  static async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now()
    
    try {
      const provider = this.getAvailableProvider()
      
      if (!provider || !provider.apiKey) {
        return {
          success: false,
          response: '',
          confidence: 0,
          usedProvider: 'none',
          processingTime: Date.now() - startTime,
          cached: false,
          error: 'Nenhum provedor de IA disponível'
        }
      }

      const prompt = this.buildPrompt(request)
      const response = await this.callProvider(provider, prompt)

      provider.dailyQuotaUsed++

      const analysis = this.parseResponse(response, request.type)

      return {
        success: true,
        response: analysis.response,
        suggestions: analysis.suggestions,
        confidence: analysis.confidence,
        usedProvider: provider.name,
        processingTime: Date.now() - startTime,
        cached: false
      }
    } catch (error) {
      console.error('Erro na análise de IA:', error)
      
      return {
        success: false,
        response: 'Erro ao processar análise de IA',
        confidence: 0,
        usedProvider: 'error',
        processingTime: Date.now() - startTime,
        cached: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  private static buildPrompt(request: AIAnalysisRequest): string {
    const baseContext = `
Você é um assistente de IA especializado em fisioterapia. 
Forneça análises precisas e baseadas em evidências científicas.
Sempre mencione limitações e recomende consulta com profissional quando necessário.
`

    switch (request.type) {
      case 'MEDICAL_RECORD':
        return `${baseContext}

CONTEXTO DO PACIENTE:
${request.context ? `
- Idade: ${request.context.patientAge || 'Não informado'}
- Gênero: ${request.context.patientGender || 'Não informado'}
- Histórico médico: ${request.context.medicalHistory || 'Não informado'}
- Diagnóstico atual: ${request.context.currentDiagnosis || 'Não informado'}
- Tratamentos anteriores: ${request.context.previousTreatments || 'Não informado'}
` : ''}

PRONTUÁRIO A ANALISAR:
${request.content}

TAREFA:
Analise este prontuário médico e forneça:
1. Resumo das principais queixas
2. Possíveis diagnósticos fisioterapêuticos
3. Sugestões de avaliação adicional
4. Recomendações de tratamento inicial
5. Prognóstico estimado

Responda em português, de forma clara e objetiva.`

      case 'EVOLUTION':
        return `${baseContext}

CONTEXTO DO PACIENTE:
${request.context ? `
- Diagnóstico: ${request.context.currentDiagnosis || 'Não informado'}
- Histórico: ${request.context.medicalHistory || 'Não informado'}
` : ''}

EVOLUÇÃO A ANALISAR:
${request.content}

TAREFA:
Analise esta evolução e forneça:
1. Progresso do paciente
2. Sinais de melhora ou piora
3. Ajustes recomendados no tratamento
4. Próximos passos
5. Pontos de atenção

Responda em português, de forma clara e objetiva.`

      case 'EXERCISE_SUGGESTION':
        return `${baseContext}

CONTEXTO DO PACIENTE:
${request.context ? `
- Idade: ${request.context.patientAge || 'Não informado'}
- Gênero: ${request.context.patientGender || 'Não informado'}
- Diagnóstico: ${request.context.currentDiagnosis || 'Não informado'}
` : ''}

SITUAÇÃO:
${request.content}

TAREFA:
Com base no diagnóstico e situação, sugira exercícios fisioterapêuticos apropriados:
1. Liste 5-8 exercícios específicos
2. Para cada exercício, inclua: nome, descrição, séries/repetições, frequência
3. Justifique cada escolha
4. Ordene por prioridade
5. Indique contraindicações ou precauções

Responda em português, de forma clara e objetiva.`

      case 'GENERAL_QUERY':
      default:
        return `${baseContext}

PERGUNTA:
${request.content}

CONTEXTO ADICIONAL:
${request.context ? JSON.stringify(request.context) : 'Nenhum contexto adicional'}

TAREFA:
Responda à pergunta de forma clara, baseada em evidências científicas.
Se for sobre um caso clínico específico, forneça orientações práticas.
Sempre mencione limitações da resposta e recomende avaliação presencial quando apropriado.

Responda em português, de forma clara e objetiva.`
    }
  }

  private static async callProvider(provider: AIProvider, prompt: string): Promise<string> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    }

    let body: any

    if (provider.name.includes('OpenAI') || provider.name.includes('Groq')) {
      body = {
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em fisioterapia fornecendo análises técnicas precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }
    } else if (provider.name.includes('Anthropic')) {
      headers['x-api-key'] = provider.apiKey
      delete headers.Authorization
      
      body = {
        model: provider.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Erro na API ${provider.name}: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (provider.name.includes('OpenAI') || provider.name.includes('Groq')) {
      return data.choices[0]?.message?.content || 'Resposta vazia'
    } else if (provider.name.includes('Anthropic')) {
      return data.content[0]?.text || 'Resposta vazia'
    }

    return 'Formato de resposta não reconhecido'
  }

  private static parseResponse(response: string, type: string): {
    response: string
    suggestions?: {
      exercises?: ExerciseSuggestion[]
      treatments?: TreatmentSuggestion[]
      observations?: string[]
    }
    confidence: number
  } {
    const confidence = this.calculateConfidence(response)

    if (type === 'EXERCISE_SUGGESTION') {
      const exercises = this.extractExerciseSuggestions(response)
      return {
        response,
        suggestions: { exercises },
        confidence
      }
    }

    const treatments = this.extractTreatmentSuggestions(response)
    const observations = this.extractObservations(response)

    return {
      response,
      suggestions: { treatments, observations },
      confidence
    }
  }

  private static calculateConfidence(response: string): number {
    const indicators = [
      'baseado em evidências',
      'estudos mostram',
      'pesquisas indicam',
      'protocolo estabelecido',
      'diretrizes recomendam'
    ]

    const uncertaintyWords = [
      'talvez',
      'possivelmente',
      'pode ser',
      'sugestão',
      'recomendo avaliar'
    ]

    let confidence = 0.7
    
    indicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        confidence += 0.05
      }
    })

    uncertaintyWords.forEach(word => {
      if (response.toLowerCase().includes(word)) {
        confidence -= 0.05
      }
    })

    return Math.max(0.1, Math.min(0.95, confidence))
  }

  private static extractExerciseSuggestions(response: string): ExerciseSuggestion[] {
    const suggestions: ExerciseSuggestion[] = []
    
    const exercisePatterns = [
      /(\d+)\.\s*([^:\n]+):\s*([^\n]+)/g,
      /([^:\n]+):\s*([^\n]+)/g
    ]

    for (const pattern of exercisePatterns) {
      let match
      while ((match = pattern.exec(response)) !== null && suggestions.length < 8) {
        suggestions.push({
          exerciseId: `ai-suggestion-${suggestions.length + 1}`,
          exerciseName: match[2] || match[1] || 'Exercício sugerido',
          category: 'FUNCTIONAL',
          bodyRegion: ['CORE'],
          reasoning: match[3] || match[2] || 'Sugerido pela IA',
          priority: suggestions.length + 1
        })
      }
    }

    return suggestions
  }

  private static extractTreatmentSuggestions(response: string): TreatmentSuggestion[] {
    const suggestions: TreatmentSuggestion[] = []
    
    const lines = response.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (line.includes('recomend') || line.includes('suger') || line.includes('indicad')) {
        suggestions.push({
          type: 'THERAPY',
          title: `Recomendação ${suggestions.length + 1}`,
          description: line.trim(),
          reasoning: 'Baseado na análise da IA',
          priority: suggestions.length + 1
        })
      }
    })

    return suggestions.slice(0, 5)
  }

  private static extractObservations(response: string): string[] {
    const observations: string[] = []
    
    const observationPatterns = [
      /atenção para ([^.!?\n]+)/gi,
      /importante ([^.!?\n]+)/gi,
      /observe ([^.!?\n]+)/gi,
      /cuidado com ([^.!?\n]+)/gi
    ]

    observationPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null && observations.length < 5) {
        observations.push(match[0])
      }
    })

    return observations
  }

  static async getProviderStatus(): Promise<AIProvider[]> {
    return this.providers.map(provider => ({
      ...provider,
      apiKey: provider.apiKey ? '***' : ''
    }))
  }

  static resetDailyQuotas(): void {
    this.providers.forEach(provider => {
      provider.dailyQuotaUsed = 0
    })
  }
}