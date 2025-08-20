import { ExerciseCategory, BodyRegion } from "@prisma/client"

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  bodyRegion: BodyRegion[]
  description: string
  instructions: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  difficulty: number
  equipment: string[]
  isPublic: boolean
  createdBy: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateExerciseDTO {
  name: string
  category: ExerciseCategory
  bodyRegion: BodyRegion[]
  description: string
  instructions: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  difficulty: number
  equipment: string[]
  isPublic?: boolean
  tags: string[]
}

export interface UpdateExerciseDTO {
  name?: string
  category?: ExerciseCategory
  bodyRegion?: BodyRegion[]
  description?: string
  instructions?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  difficulty?: number
  equipment?: string[]
  isPublic?: boolean
  tags?: string[]
}

export interface ExerciseFilters {
  category?: ExerciseCategory
  bodyRegion?: BodyRegion[]
  difficulty?: number
  equipment?: string[]
  tags?: string[]
  search?: string
  createdBy?: string
  isPublic?: boolean
}

export interface ExerciseResponse {
  exercises: Exercise[]
  total: number
  page: number
  limit: number
}

export const ExerciseCategoryLabels: Record<ExerciseCategory, string> = {
  STRETCHING: 'Alongamento',
  STRENGTHENING: 'Fortalecimento', 
  MOBILITY: 'Mobilidade',
  BALANCE: 'Equilíbrio',
  PROPRIOCEPTION: 'Propriocepção',
  CARDIO: 'Cardiovascular',
  FUNCTIONAL: 'Funcional',
  MANUAL_THERAPY: 'Terapia Manual'
}

export const BodyRegionLabels: Record<BodyRegion, string> = {
  CERVICAL: 'Cervical',
  THORACIC: 'Torácico',
  LUMBAR: 'Lombar',
  SHOULDER: 'Ombro',
  ELBOW: 'Cotovelo',
  WRIST_HAND: 'Punho/Mão',
  HIP: 'Quadril',
  KNEE: 'Joelho',
  ANKLE_FOOT: 'Tornozelo/Pé',
  CORE: 'Core'
}