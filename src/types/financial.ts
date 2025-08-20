export interface Payment {
  id: string
  appointmentId?: string
  patientId: string
  therapistId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  description: string
  dueDate: Date
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  patient: {
    id: string
    fullName: string
    email?: string
  }
  appointment?: {
    id: string
    scheduledAt: Date
    duration: number
  }
  therapist?: {
    id: string
    user: {
      name?: string
    }
  }
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  HEALTH_INSURANCE = 'HEALTH_INSURANCE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface CreatePaymentDTO {
  appointmentId?: string
  patientId: string
  therapistId?: string
  amount: number
  method: PaymentMethod
  description: string
  dueDate: Date
}

export interface UpdatePaymentDTO {
  amount?: number
  method?: PaymentMethod
  status?: PaymentStatus
  description?: string
  dueDate?: Date
  paidAt?: Date
}

export interface PaymentFilters {
  patientId?: string
  therapistId?: string
  method?: PaymentMethod
  status?: PaymentStatus
  dueDateFrom?: Date
  dueDateTo?: Date
  paidDateFrom?: Date
  paidDateTo?: Date
  minAmount?: number
  maxAmount?: number
}

export interface PaymentResponse {
  payments: Payment[]
  total: number
  page: number
  limit: number
}

export interface FinancialReport {
  period: {
    startDate: Date
    endDate: Date
  }
  revenue: {
    total: number
    paid: number
    pending: number
    overdue: number
    byMethod: Record<PaymentMethod, number>
    byTherapist: Array<{
      therapistId: string
      therapistName: string
      total: number
      appointments: number
    }>
  }
  expenses: {
    total: number
    categories: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    averagePrice: number
  }
  patients: {
    total: number
    new: number
    returning: number
    topPatients: Array<{
      patientId: string
      patientName: string
      totalSpent: number
      appointments: number
    }>
  }
  trends: {
    dailyRevenue: Array<{
      date: Date
      revenue: number
      appointments: number
    }>
    monthlyComparison: {
      currentMonth: number
      previousMonth: number
      growth: number
    }
  }
}

export interface HealthInsurance {
  id: string
  name: string
  code: string
  contact: {
    phone: string
    email: string
    website?: string
  }
  billing: {
    paymentTerms: number // dias
    reimbursementRate: number // porcentagem
    maxSessions: number
    requiresAuthorization: boolean
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PatientInsurance {
  id: string
  patientId: string
  insuranceId: string
  memberNumber: string
  validFrom: Date
  validTo?: Date
  remainingSessions?: number
  authorizationNumber?: string
  isActive: boolean
  patient: {
    fullName: string
  }
  insurance: HealthInsurance
}

export interface Invoice {
  id: string
  number: string
  patientId?: string
  insuranceId?: string
  amount: number
  description: string
  items: InvoiceItem[]
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paidAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  appointmentId?: string
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface Expense {
  id: string
  categoryId: string
  amount: number
  description: string
  date: Date
  receipt?: string
  isRecurring: boolean
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  createdBy: string
  createdAt: Date
  category: ExpenseCategory
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  pendingPayments: number
  overduePayments: number
  averageSessionPrice: number
  monthlyRecurringRevenue: number
  cashFlow: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência Bancária',
  HEALTH_INSURANCE: 'Convênio'
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
}

export const PaymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-blue-100 text-blue-800'
}