export interface ExercisePrescription {
  id: string
  patientId: string
  exerciseId: string
  therapistId: string
  sets?: number
  repetitions?: number
  holdTime?: number
  restTime?: number
  frequency: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  patient?: {
    id: string
    fullName: string
  }
  exercise?: {
    id: string
    name: string
    category: string
    difficulty: number
    videoUrl?: string
    thumbnailUrl?: string
  }
  therapist?: {
    id: string
    user: {
      name?: string
    }
  }
  executions?: ExerciseExecution[]
}

export interface ExerciseExecution {
  id: string
  prescriptionId: string
  executedAt: Date
  setsCompleted?: number
  repsCompleted?: number
  painLevel?: number
  difficulty?: number
  notes?: string
}

export interface CreatePrescriptionDTO {
  patientId: string
  exerciseId: string
  sets?: number
  repetitions?: number
  holdTime?: number
  restTime?: number
  frequency: string
  startDate: Date
  endDate?: Date
  isActive?: boolean
}

export interface UpdatePrescriptionDTO {
  sets?: number
  repetitions?: number
  holdTime?: number
  restTime?: number
  frequency?: string
  startDate?: Date
  endDate?: Date
  isActive?: boolean
}

export interface CreateExecutionDTO {
  prescriptionId: string
  setsCompleted?: number
  repsCompleted?: number
  painLevel?: number
  difficulty?: number
  notes?: string
}

export interface PrescriptionFilters {
  patientId?: string
  therapistId?: string
  isActive?: boolean
  startDate?: Date
  endDate?: Date
  exerciseCategory?: string
}

export interface PrescriptionResponse {
  prescriptions: ExercisePrescription[]
  total: number
  page: number
  limit: number
}

export interface PrescriptionStats {
  total: number
  active: number
  inactive: number
  byCategory: Record<string, number>
  recentExecutions: number
}

export interface PatientProgress {
  patientId: string
  patientName: string
  totalPrescriptions: number
  activePrescriptions: number
  completedExecutions: number
  averagePainLevel?: number
  averageDifficulty?: number
  lastExecution?: Date
  adherenceRate: number
}