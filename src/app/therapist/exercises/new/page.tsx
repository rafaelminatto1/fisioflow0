'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Video, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useExercises, useExerciseCategories, useBodyRegions } from '@/hooks/useExercises'
import { CreateExerciseDTO } from '@/types/exercise'
import { ExerciseCategory, BodyRegion } from '@prisma/client'
import { ExerciseCategoryLabels, BodyRegionLabels } from '@/types/exercise'

export default function NewExercisePage() {
  const router = useRouter()
  const { createExercise } = useExercises()
  const { categories } = useExerciseCategories()
  const { regions } = useBodyRegions()

  const [formData, setFormData] = useState<Partial<CreateExerciseDTO>>({
    name: '',
    category: ExerciseCategory.STRETCHING,
    bodyRegion: [],
    description: '',
    instructions: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: undefined,
    difficulty: 1,
    equipment: [],
    isPublic: true,
    tags: []
  })

  const [equipmentInput, setEquipmentInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof CreateExerciseDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBodyRegionToggle = (region: BodyRegion) => {
    const currentRegions = formData.bodyRegion || []
    const updatedRegions = currentRegions.includes(region)
      ? currentRegions.filter(r => r !== region)
      : [...currentRegions, region]
    
    handleInputChange('bodyRegion', updatedRegions)
  }

  const addEquipment = () => {
    if (equipmentInput.trim() && !formData.equipment?.includes(equipmentInput.trim())) {
      handleInputChange('equipment', [...(formData.equipment || []), equipmentInput.trim()])
      setEquipmentInput('')
    }
  }

  const removeEquipment = (equipment: string) => {
    handleInputChange('equipment', formData.equipment?.filter(e => e !== equipment) || [])
  }

  const addTag = () => {
    if (tagsInput.trim() && !formData.tags?.includes(tagsInput.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tagsInput.trim()])
      setTagsInput('')
    }
  }

  const removeTag = (tag: string) => {
    handleInputChange('tags', formData.tags?.filter(t => t !== tag) || [])
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const parseDuration = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(':').map(Number)
    return (minutes || 0) * 60 + (seconds || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.description?.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      if (!formData.instructions?.trim()) {
        throw new Error('Instruções são obrigatórias')
      }
      if (!formData.bodyRegion?.length) {
        throw new Error('Selecione pelo menos uma região do corpo')
      }

      const result = await createExercise(formData as CreateExerciseDTO)
      
      if (result.success) {
        router.push('/therapist/exercises')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar exercício')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/therapist/exercises">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Exercício</h1>
          <p className="text-muted-foreground">
            Crie um novo exercício fisioterapêutico
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do exercício</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Exercício *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Alongamento de pescoço lateral"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as ExerciseCategory)}
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {ExerciseCategoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="difficulty">Dificuldade *</Label>
                <select
                  id="difficulty"
                  className="w-full p-2 border rounded-md"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
                  required
                >
                  <option value={1}>1 - Muito Fácil</option>
                  <option value={2}>2 - Fácil</option>
                  <option value={3}>3 - Moderado</option>
                  <option value={4}>4 - Difícil</option>
                  <option value={5}>5 - Muito Difícil</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Regiões do Corpo *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {regions.map(region => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={region}
                      checked={formData.bodyRegion?.includes(region) || false}
                      onCheckedChange={() => handleBodyRegionToggle(region)}
                    />
                    <Label htmlFor={region} className="text-sm">
                      {BodyRegionLabels[region]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrição resumida do exercício"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instruções *</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Instruções detalhadas de como realizar o exercício"
                rows={5}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mídia e Recursos</CardTitle>
            <CardDescription>URLs de vídeo e imagem do exercício</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">URL do Vídeo</Label>
              <div className="flex gap-2">
                <Video className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">URL da Imagem</Label>
              <div className="flex gap-2">
                <Image className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duração (MM:SS)</Label>
              <Input
                id="duration"
                type="text"
                pattern="[0-9]{1,2}:[0-5][0-9]"
                placeholder="05:30"
                onChange={(e) => {
                  const seconds = parseDuration(e.target.value)
                  handleInputChange('duration', seconds || undefined)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipamentos e Tags</CardTitle>
            <CardDescription>Equipamentos necessários e palavras-chave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Equipamentos</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  placeholder="Ex: Theraband, Bola suíça..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                />
                <Button type="button" variant="outline" onClick={addEquipment}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.equipment?.map(equipment => (
                  <Badge key={equipment} variant="secondary" className="cursor-pointer" onClick={() => removeEquipment(equipment)}>
                    {equipment} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ex: reabilitação, dor nas costas..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Visibilidade e compartilhamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic">
                Exercício público (visível para outros fisioterapeutas)
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/therapist/exercises">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <Save className="mr-2 h-4 w-4" />
            Salvar Exercício
          </Button>
        </div>
      </form>
    </div>
  )
}