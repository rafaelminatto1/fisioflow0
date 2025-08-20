import { prisma } from '@/lib/prisma'
import { VoucherStatus } from '@prisma/client'
import { 
  CreateVoucherDTO, 
  UpdateVoucherDTO, 
  RedeemVoucherDTO,
  VoucherFilters,
  VoucherResponse,
  VoucherStats,
  VoucherValidation
} from '@/types/vouchers'

export class VoucherService {
  
  private static generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  private static calculateFees(value: number): { platformFee: number; partnerEarning: number } {
    const platformFee = value * 0.15 // 15% para a plataforma
    const partnerEarning = value - platformFee
    return { platformFee, partnerEarning }
  }

  static async createVoucher(data: CreateVoucherDTO) {
    try {
      const partner = await prisma.partner.findUnique({
        where: { id: data.partnerId }
      })

      if (!partner) {
        return {
          success: false,
          error: 'Parceiro não encontrado'
        }
      }

      const { platformFee, partnerEarning } = this.calculateFees(data.value)
      const quantity = data.quantity || 1
      const vouchers = []

      for (let i = 0; i < quantity; i++) {
        let code
        let codeExists = true
        
        // Gerar código único
        while (codeExists) {
          code = this.generateVoucherCode()
          const existing = await prisma.voucher.findUnique({
            where: { code }
          })
          codeExists = !!existing
        }

        const voucher = await prisma.voucher.create({
          data: {
            code: code!,
            partnerId: data.partnerId,
            value: data.value,
            platformFee,
            partnerEarning,
            expiresAt: data.expiresAt
          },
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        })

        vouchers.push(voucher)
      }

      return {
        success: true,
        data: vouchers
      }
    } catch (error) {
      console.error('Erro ao criar voucher:', error)
      return {
        success: false,
        error: 'Erro ao criar voucher'
      }
    }
  }

  static async getVouchers(
    filters: VoucherFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<VoucherResponse> {
    try {
      const skip = (page - 1) * limit
      const where: any = {}

      if (filters.partnerId) {
        where.partnerId = filters.partnerId
      }

      if (filters.patientId) {
        where.patientId = filters.patientId
      }

      if (filters.status) {
        where.status = filters.status
      }

      if (filters.expiresAfter || filters.expiresBefore) {
        where.expiresAt = {}
        if (filters.expiresAfter) {
          where.expiresAt.gte = filters.expiresAfter
        }
        if (filters.expiresBefore) {
          where.expiresAt.lte = filters.expiresBefore
        }
      }

      if (filters.minValue || filters.maxValue) {
        where.value = {}
        if (filters.minValue) {
          where.value.gte = filters.minValue
        }
        if (filters.maxValue) {
          where.value.lte = filters.maxValue
        }
      }

      const [vouchers, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          skip,
          take: limit,
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            patient: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.voucher.count({ where })
      ])

      return {
        vouchers,
        total,
        page,
        limit
      }
    } catch (error) {
      console.error('Erro ao buscar vouchers:', error)
      return {
        vouchers: [],
        total: 0,
        page,
        limit
      }
    }
  }

  static async getVoucherById(id: string) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id },
        include: {
          partner: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      if (!voucher) {
        return {
          success: false,
          error: 'Voucher não encontrado'
        }
      }

      return {
        success: true,
        data: voucher
      }
    } catch (error) {
      console.error('Erro ao buscar voucher:', error)
      return {
        success: false,
        error: 'Erro ao buscar voucher'
      }
    }
  }

  static async updateVoucher(id: string, data: UpdateVoucherDTO) {
    try {
      const existingVoucher = await prisma.voucher.findUnique({
        where: { id }
      })

      if (!existingVoucher) {
        return {
          success: false,
          error: 'Voucher não encontrado'
        }
      }

      if (existingVoucher.status === VoucherStatus.REDEEMED) {
        return {
          success: false,
          error: 'Não é possível editar um voucher já utilizado'
        }
      }

      let updateData: any = { ...data }
      
      // Recalcular taxas se o valor mudou
      if (data.value && data.value !== existingVoucher.value) {
        const { platformFee, partnerEarning } = this.calculateFees(data.value)
        updateData.platformFee = platformFee
        updateData.partnerEarning = partnerEarning
      }

      const voucher = await prisma.voucher.update({
        where: { id },
        data: updateData,
        include: {
          partner: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      return {
        success: true,
        data: voucher
      }
    } catch (error) {
      console.error('Erro ao atualizar voucher:', error)
      return {
        success: false,
        error: 'Erro ao atualizar voucher'
      }
    }
  }

  static async validateVoucher(code: string): Promise<VoucherValidation> {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { code },
        include: {
          partner: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!voucher) {
        return {
          isValid: false,
          error: 'Voucher não encontrado'
        }
      }

      if (voucher.status !== VoucherStatus.ACTIVE) {
        return {
          isValid: false,
          voucher,
          error: `Voucher está ${voucher.status.toLowerCase()}`
        }
      }

      if (new Date() > voucher.expiresAt) {
        // Marcar como expirado
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: VoucherStatus.EXPIRED }
        })

        return {
          isValid: false,
          voucher,
          error: 'Voucher expirado'
        }
      }

      const warnings = []
      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      
      if (voucher.expiresAt <= oneDayFromNow) {
        warnings.push('Voucher expira em menos de 24 horas')
      }

      return {
        isValid: true,
        voucher,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      console.error('Erro ao validar voucher:', error)
      return {
        isValid: false,
        error: 'Erro ao validar voucher'
      }
    }
  }

  static async redeemVoucher(data: RedeemVoucherDTO) {
    try {
      const validation = await this.validateVoucher(data.code)
      
      if (!validation.isValid || !validation.voucher) {
        return {
          success: false,
          error: validation.error
        }
      }

      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId }
      })

      if (!patient) {
        return {
          success: false,
          error: 'Paciente não encontrado'
        }
      }

      const voucher = await prisma.voucher.update({
        where: { id: validation.voucher.id },
        data: {
          status: VoucherStatus.REDEEMED,
          patientId: data.patientId,
          redeemedAt: new Date()
        },
        include: {
          partner: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })

      return {
        success: true,
        data: voucher,
        message: `Voucher de R$ ${voucher.value.toFixed(2)} resgatado com sucesso!`
      }
    } catch (error) {
      console.error('Erro ao resgatar voucher:', error)
      return {
        success: false,
        error: 'Erro ao resgatar voucher'
      }
    }
  }

  static async getVoucherStats(): Promise<VoucherStats> {
    try {
      const [counts, values, recentActivity] = await Promise.all([
        prisma.voucher.groupBy({
          by: ['status'],
          _count: {
            _all: true
          }
        }),

        prisma.voucher.aggregate({
          _sum: {
            value: true,
            platformFee: true,
            partnerEarning: true
          },
          where: {
            status: {
              in: [VoucherStatus.ACTIVE, VoucherStatus.REDEEMED]
            }
          }
        }),

        prisma.voucher.findMany({
          take: 10,
          orderBy: {
            updatedAt: 'desc'
          },
          include: {
            partner: {
              select: {
                businessName: true
              }
            },
            patient: {
              select: {
                fullName: true
              }
            }
          }
        })
      ])

      const statusCounts = counts.reduce((acc, item) => {
        acc[item.status] = item._count._all
        return acc
      }, {} as Record<string, number>)

      const redeemedVouchers = await prisma.voucher.aggregate({
        _sum: {
          value: true
        },
        where: {
          status: VoucherStatus.REDEEMED
        }
      })

      const partnerStats = await prisma.voucher.groupBy({
        by: ['partnerId'],
        _count: {
          _all: true
        },
        _sum: {
          value: true
        },
        include: {
          partner: {
            select: {
              businessName: true
            }
          }
        }
      })

      return {
        total: statusCounts[VoucherStatus.ACTIVE] + statusCounts[VoucherStatus.REDEEMED] + statusCounts[VoucherStatus.EXPIRED] + statusCounts[VoucherStatus.CANCELLED] || 0,
        active: statusCounts[VoucherStatus.ACTIVE] || 0,
        redeemed: statusCounts[VoucherStatus.REDEEMED] || 0,
        expired: statusCounts[VoucherStatus.EXPIRED] || 0,
        cancelled: statusCounts[VoucherStatus.CANCELLED] || 0,
        totalValue: values._sum.value || 0,
        redeemedValue: redeemedVouchers._sum.value || 0,
        platformRevenue: values._sum.platformFee || 0,
        partnerPayouts: values._sum.partnerEarning || 0,
        byPartner: [], // Implementar se necessário
        recentActivity: recentActivity.map(voucher => ({
          id: voucher.id,
          type: voucher.status === VoucherStatus.REDEEMED ? 'REDEEMED' as const :
                voucher.status === VoucherStatus.EXPIRED ? 'EXPIRED' as const :
                voucher.status === VoucherStatus.CANCELLED ? 'CANCELLED' as const : 'CREATED' as const,
          voucherCode: voucher.code,
          value: voucher.value,
          date: voucher.updatedAt,
          partnerName: voucher.partner?.businessName,
          patientName: voucher.patient?.fullName
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de vouchers:', error)
      return {
        total: 0,
        active: 0,
        redeemed: 0,
        expired: 0,
        cancelled: 0,
        totalValue: 0,
        redeemedValue: 0,
        platformRevenue: 0,
        partnerPayouts: 0,
        byPartner: [],
        recentActivity: []
      }
    }
  }

  static async expireOldVouchers(): Promise<number> {
    try {
      const result = await prisma.voucher.updateMany({
        where: {
          status: VoucherStatus.ACTIVE,
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: VoucherStatus.EXPIRED
        }
      })

      return result.count
    } catch (error) {
      console.error('Erro ao expirar vouchers antigos:', error)
      return 0
    }
  }
}