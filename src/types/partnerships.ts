export interface Partnership {
  id: string
  businessName: string
  specialty: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: PartnershipStatus
  commissionRate: number
  paymentTerms: string
  contractStartDate: Date
  contractEndDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    email: string
    active: boolean
  }
  vouchers?: Array<{
    id: string
    code: string
    value: number
    status: string
    createdAt: Date
  }>
  stats?: PartnershipStats
}

export enum PartnershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export interface CreatePartnershipDTO {
  businessName: string
  specialty: string
  contactName: string
  contactEmail: string
  contactPhone: string
  commissionRate: number
  paymentTerms: string
  contractStartDate: Date
  contractEndDate?: Date
}

export interface UpdatePartnershipDTO {
  businessName?: string
  specialty?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  commissionRate?: number
  paymentTerms?: string
  contractStartDate?: Date
  contractEndDate?: Date
  status?: PartnershipStatus
  isActive?: boolean
}

export interface PartnershipFilters {
  specialty?: string
  status?: PartnershipStatus
  isActive?: boolean
  contractExpiresBefore?: Date
  contractExpiresAfter?: Date
  minCommissionRate?: number
  maxCommissionRate?: number
  search?: string
}

export interface PartnershipResponse {
  partnerships: Partnership[]
  total: number
  page: number
  limit: number
}

export interface PartnershipStats {
  totalVouchers: number
  activeVouchers: number
  redeemedVouchers: number
  totalValue: number
  redeemedValue: number
  totalEarnings: number
  pendingPayouts: number
  monthlyStats: Array<{
    month: string
    vouchersCreated: number
    vouchersRedeemed: number
    earnings: number
  }>
}

export interface Commission {
  id: string
  partnerId: string
  voucherId: string
  amount: number
  rate: number
  status: CommissionStatus
  calculatedAt: Date
  paidAt?: Date
  paymentReference?: string
  partner: {
    businessName: string
    contactName: string
  }
  voucher: {
    code: string
    value: number
    redeemedAt: Date
  }
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface PayoutRequest {
  partnerId: string
  amount: number
  commissionIds: string[]
  paymentMethod: 'PIX' | 'BANK_TRANSFER' | 'CREDIT'
  bankDetails?: {
    bank: string
    agency: string
    account: string
    accountType: 'CHECKING' | 'SAVINGS'
    document: string
  }
  pixKey?: string
}

export interface PayoutResponse {
  id: string
  partnerId: string
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reference: string
  createdAt: Date
  processedAt?: Date
  error?: string
}

export const PartnershipStatusLabels: Record<PartnershipStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  TERMINATED: 'Encerrado'
}

export const PartnershipStatusColors: Record<PartnershipStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  TERMINATED: 'bg-gray-100 text-gray-800'
}

export const CommissionStatusLabels: Record<CommissionStatus, string> = {
  PENDING: 'Pendente',
  CALCULATED: 'Calculado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado'
}

export const CommissionStatusColors: Record<CommissionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CALCULATED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}