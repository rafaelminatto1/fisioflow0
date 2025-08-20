export interface PatientDashboardData {
  patient: {
    id: string
    fullName: string
    email?: string
    phone: string
    birthDate: Date
    gender: string
  }
  stats: {
    totalPrescriptions: number
    activePrescriptions: number
    completedExecutions: number
    upcomingAppointments: number
    lastAppointment?: Date
    nextAppointment?: Date
  }
  recentActivity: PatientActivity[]
  upcomingAppointments: PatientAppointment[]
  activePrescriptions: PatientPrescription[]
  healthSummary: {
    averagePainLevel?: number
    adherenceRate: number
    progressTrend: 'improving' | 'stable' | 'declining'
    lastUpdate: Date
  }
}

export interface PatientActivity {
  id: string
  type: 'EXERCISE_COMPLETED' | 'APPOINTMENT_ATTENDED' | 'PRESCRIPTION_ADDED' | 'EVOLUTION_ADDED'
  title: string
  description: string
  date: Date
  metadata?: {
    exerciseName?: string
    painLevel?: number
    appointmentType?: string
    therapistName?: string
  }
}

export interface PatientAppointment {
  id: string
  scheduledAt: Date
  duration: number
  status: string
  therapist: {
    name?: string
    specialty: string
  }
  type?: string
  notes?: string
  canReschedule: boolean
  canCancel: boolean
}

export interface PatientPrescription {
  id: string
  exercise: {
    id: string
    name: string
    category: string
    description: string
    instructions: string
    videoUrl?: string
    thumbnailUrl?: string
    duration?: number
    difficulty: number
  }
  sets?: number
  repetitions?: number
  holdTime?: number
  frequency: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  progress: {
    totalExecutions: number
    thisWeekExecutions: number
    lastExecution?: Date
    averagePainLevel?: number
    completionRate: number
  }
  therapist: {
    name?: string
    specialty: string
  }
}

export interface PatientExerciseExecution {
  id: string
  executedAt: Date
  setsCompleted?: number
  repsCompleted?: number
  painLevel?: number
  difficulty?: number
  notes?: string
  exercise: {
    name: string
    category: string
  }
}

export interface PatientProfile {
  id: string
  fullName: string
  email?: string
  phone: string
  birthDate: Date
  gender: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
    privacy: {
      shareDataForResearch: boolean
      allowMarketing: boolean
    }
  }
  medicalInfo: {
    bloodType?: string
    allergies: string[]
    medications: string[]
    medicalConditions: string[]
  }
}

export interface PatientProgress {
  patientId: string
  period: 'week' | 'month' | 'quarter' | 'year'
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    category: string
    executions: Array<{
      date: Date
      setsCompleted?: number
      repsCompleted?: number
      painLevel?: number
      difficulty?: number
    }>
    trends: {
      painLevel: Array<{ date: Date; value: number }>
      difficulty: Array<{ date: Date; value: number }>
      consistency: number
    }
  }>
  appointments: Array<{
    date: Date
    attended: boolean
    notes?: string
    therapistFeedback?: string
  }>
  overallTrends: {
    painReduction: number
    functionalImprovement: number
    adherenceRate: number
    satisfactionScore?: number
  }
}

export interface PatientAppointmentRequest {
  preferredDate: Date
  preferredTime: string
  therapistId?: string
  reason: string
  notes?: string
  priority: 'low' | 'normal' | 'high'
}

export interface PatientMessage {
  id: string
  from: 'patient' | 'therapist' | 'system'
  to: 'patient' | 'therapist'
  subject: string
  content: string
  sentAt: Date
  readAt?: Date
  priority: 'low' | 'normal' | 'high'
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  threadId?: string
}

export interface PatientNotification {
  id: string
  type: 'APPOINTMENT_REMINDER' | 'EXERCISE_DUE' | 'PRESCRIPTION_UPDATED' | 'MESSAGE_RECEIVED' | 'PROGRESS_MILESTONE'
  title: string
  message: string
  data?: any
  scheduledFor: Date
  sentAt?: Date
  readAt?: Date
  isRead: boolean
  priority: 'low' | 'normal' | 'high'
  actions?: Array<{
    label: string
    action: string
    url?: string
  }>
}