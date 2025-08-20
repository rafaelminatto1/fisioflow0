import { VoucherStatus } from '@prisma/client'

export interface Voucher {
  id: string
  code: string
  partnerId: string
  patientId?: string
  value: number
  platformFee: number
  partnerEarning: number
  status: VoucherStatus
  expiresAt: Date
  redeemedAt?: Date
  createdAt: Date
  updatedAt: Date
  partner?: {
    id: string
    businessName: string
    specialty: string
    user: {
      name?: string
      email: string
    }
  }
  patient?: {
    id: string
    fullName: string
    email?: string
  }
}

export interface CreateVoucherDTO {
  partnerId: string
  value: number
  expiresAt: Date
  quantity?: number
}

export interface UpdateVoucherDTO {
  value?: number
  expiresAt?: Date
  status?: VoucherStatus
}

export interface RedeemVoucherDTO {
  code: string
  patientId: string
}

export interface VoucherFilters {
  partnerId?: string
  patientId?: string
  status?: VoucherStatus
  expiresAfter?: Date
  expiresBefore?: Date
  minValue?: number
  maxValue?: number
}

export interface VoucherResponse {
  vouchers: Voucher[]
  total: number
  page: number
  limit: number
}

export interface VoucherStats {
  total: number
  active: number
  redeemed: number
  expired: number
  cancelled: number
  totalValue: number
  redeemedValue: number
  platformRevenue: number
  partnerPayouts: number
  byPartner: Array<{
    partnerId: string
    partnerName: string
    total: number
    redeemed: number
    value: number
  }>
  recentActivity: Array<{
    id: string
    type: 'CREATED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'
    voucherCode: string
    value: number
    date: Date
    partnerName?: string
    patientName?: string
  }>
}

export interface VoucherValidation {
  isValid: boolean
  voucher?: Voucher
  error?: string
  warnings?: string[]
}

export const VoucherStatusLabels: Record<VoucherStatus, string> = {
  ACTIVE: 'Ativo',
  REDEEMED: 'Utilizado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado'
}

export const VoucherStatusColors: Record<VoucherStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  REDEEMED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}