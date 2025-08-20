import { 
  User, 
  Patient, 
  Therapist, 
  Partner, 
  Appointment, 
  Exercise, 
  ExercisePrescription,
  Role,
  AppointmentStatus,
  ExerciseCategory,
  BodyRegion,
  Gender
} from '@prisma/client'

// Tipos base exportados do Prisma
export type {
  User,
  Patient,
  Therapist,
  Partner,
  Appointment,
  Exercise,
  ExercisePrescription,
  Role,
  AppointmentStatus,
  ExerciseCategory,
  BodyRegion,
  Gender
}

// Tipos compostos
export type PatientWithUser = Patient & {
  user?: User
}

export type AppointmentWithPatientAndTherapist = Appointment & {
  patient: Patient
  therapist: Therapist & { user: User }
}

export type ExerciseWithPrescriptions = Exercise & {
  prescriptions: ExercisePrescription[]
}

// DTOs para criação
export interface CreatePatientDto {
  cpf: string
  fullName: string
  birthDate: Date
  gender: Gender
  phone: string
  email?: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  dataConsent: boolean
  imageConsent: boolean
  createdBy: string
}

export interface CreateAppointmentDto {
  patientId: string
  therapistId: string
  scheduledAt: Date
  duration?: number
  price: number
  notes?: string
}

export interface CreateExerciseDto {
  name: string
  category: ExerciseCategory
  bodyRegion: BodyRegion[]
  description: string
  instructions: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  difficulty?: number
  equipment?: string[]
  tags?: string[]
  createdBy: string
}

// Tipos para autenticação
export interface AuthUser {
  id: string
  email: string
  name?: string
  role: Role
  crefito?: string
}

// Tipos para formulários
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: Role
  crefito?: string
  supervisorId?: string
}

// Tipos para responses da API
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipos para filtros e busca
export interface PatientFilters {
  search?: string
  active?: boolean
  hasAppointments?: boolean
  therapistId?: string
}

export interface AppointmentFilters {
  patientId?: string
  therapistId?: string
  status?: AppointmentStatus
  date?: Date
  dateFrom?: Date
  dateTo?: Date
}

export interface ExerciseFilters {
  category?: ExerciseCategory
  bodyRegion?: BodyRegion[]
  difficulty?: number
  equipment?: string[]
  search?: string
}

// Tipos para métricas e relatórios
export interface DashboardMetrics {
  totalPatients: number
  totalAppointments: number
  monthlyRevenue: number
  averageRating: number
  appointmentsToday: number
  patientsThisMonth: number
}

export interface MonthlyReport {
  revenue: {
    total: number
    appointments: number
    vouchers: number
  }
  expenses: {
    total: number
    categories: Record<string, number>
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
  }
  patients: {
    new: number
    active: number
    churn: number
  }
}
