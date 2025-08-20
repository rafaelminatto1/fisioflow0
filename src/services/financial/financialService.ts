import { prisma } from '@/lib/prisma'
import { 
  FinancialReport,
  FinancialSummary,
  PaymentMethod,
  PaymentStatus
} from '@/types/financial'

export class FinancialService {
  
  static async generateReport(
    startDate: Date,
    endDate: Date,
    therapistId?: string
  ): Promise<FinancialReport> {
    try {
      // Filtros base
      const appointmentWhere: any = {
        scheduledAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      }

      if (therapistId) {
        appointmentWhere.therapistId = therapistId
      }

      // Buscar consultas do período
      const appointments = await prisma.appointment.findMany({
        where: appointmentWhere,
        include: {
          patient: {
            select: {
              id: true,
              fullName: true
            }
          },
          therapist: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      // Calcular receita
      const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      const paidRevenue = appointments
        .filter(apt => apt.isPaid)
        .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      const pendingRevenue = totalRevenue - paidRevenue

      // Agrupar por método de pagamento (simulado)
      const revenueByMethod: Record<PaymentMethod, number> = {
        [PaymentMethod.CASH]: totalRevenue * 0.3,
        [PaymentMethod.CREDIT_CARD]: totalRevenue * 0.25,
        [PaymentMethod.DEBIT_CARD]: totalRevenue * 0.15,
        [PaymentMethod.PIX]: totalRevenue * 0.20,
        [PaymentMethod.BANK_TRANSFER]: totalRevenue * 0.05,
        [PaymentMethod.HEALTH_INSURANCE]: totalRevenue * 0.05
      }

      // Agrupar por terapeuta
      const revenueByTherapist = appointments.reduce((acc, apt) => {
        const therapistId = apt.therapistId
        const therapistName = apt.therapist.user.name || 'Sem nome'
        
        const existing = acc.find(item => item.therapistId === therapistId)
        if (existing) {
          existing.total += apt.price.toNumber()
          existing.appointments += 1
        } else {
          acc.push({
            therapistId,
            therapistName,
            total: apt.price.toNumber(),
            appointments: 1
          })
        }
        
        return acc
      }, [] as Array<{therapistId: string; therapistName: string; total: number; appointments: number}>)

      // Estatísticas de consultas
      const totalAppointments = await prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          ...(therapistId && { therapistId })
        }
      })

      const completedAppointments = appointments.length
      const cancelledAppointments = await prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'CANCELLED',
          ...(therapistId && { therapistId })
        }
      })

      const noShowAppointments = await prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'NO_SHOW',
          ...(therapistId && { therapistId })
        }
      })

      const averagePrice = appointments.length > 0 
        ? totalRevenue / appointments.length 
        : 0

      // Pacientes
      const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId))]
      const totalPatientsInPeriod = uniquePatientIds.length

      // Pacientes novos (primeira consulta no período)
      const newPatients = await prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      // Top pacientes
      const topPatients = appointments.reduce((acc, apt) => {
        const existing = acc.find(item => item.patientId === apt.patientId)
        if (existing) {
          existing.totalSpent += apt.price.toNumber()
          existing.appointments += 1
        } else {
          acc.push({
            patientId: apt.patientId,
            patientName: apt.patient.fullName,
            totalSpent: apt.price.toNumber(),
            appointments: 1
          })
        }
        return acc
      }, [] as Array<{patientId: string; patientName: string; totalSpent: number; appointments: number}>)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

      // Receita diária
      const dailyRevenue = this.getDailyRevenue(appointments, startDate, endDate)

      // Comparação mensal
      const currentMonthRevenue = totalRevenue
      const previousMonthStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
      const previousMonthEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
      
      const previousMonthAppointments = await prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          },
          status: 'COMPLETED',
          ...(therapistId && { therapistId })
        }
      })
      
      const previousMonthRevenue = previousMonthAppointments
        .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      
      const growth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0

      return {
        period: {
          startDate,
          endDate
        },
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
          overdue: 0, // Implementar lógica de vencimento
          byMethod: revenueByMethod,
          byTherapist: revenueByTherapist
        },
        expenses: {
          total: 0, // Implementar sistema de despesas
          categories: []
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
          averagePrice
        },
        patients: {
          total: totalPatientsInPeriod,
          new: newPatients,
          returning: totalPatientsInPeriod - newPatients,
          topPatients
        },
        trends: {
          dailyRevenue,
          monthlyComparison: {
            currentMonth: currentMonthRevenue,
            previousMonth: previousMonthRevenue,
            growth
          }
        }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error)
      throw new Error('Erro ao gerar relatório financeiro')
    }
  }

  private static getDailyRevenue(appointments: any[], startDate: Date, endDate: Date) {
    const dailyRevenue: Array<{date: Date; revenue: number; appointments: number}> = []
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt)
        return aptDate.toDateString() === currentDate.toDateString()
      })
      
      const dayRevenue = dayAppointments.reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      
      dailyRevenue.push({
        date: new Date(currentDate),
        revenue: dayRevenue,
        appointments: dayAppointments.length
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dailyRevenue
  }

  static async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const currentDate = new Date()
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // Receita do mês atual
      const monthlyAppointments = await prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: 'COMPLETED'
        }
      })
      
      const totalRevenue = monthlyAppointments
        .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      
      const totalExpenses = 0 // Implementar sistema de despesas
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      
      // Pagamentos pendentes e vencidos (simulado)
      const pendingPayments = monthlyAppointments
        .filter(apt => !apt.isPaid)
        .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      
      const overduePayments = 0 // Implementar lógica de vencimento
      
      const averageSessionPrice = monthlyAppointments.length > 0 
        ? totalRevenue / monthlyAppointments.length
        : 0
      
      const monthlyRecurringRevenue = totalRevenue // Simplificado
      
      // Cash flow dos últimos 6 meses
      const cashFlow = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
        
        const monthAppointments = await prisma.appointment.findMany({
          where: {
            scheduledAt: {
              gte: monthStart,
              lte: monthEnd
            },
            status: 'COMPLETED'
          }
        })
        
        const monthRevenue = monthAppointments
          .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
        
        const monthExpenses = 0 // Implementar
        
        cashFlow.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        })
      }
      
      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        pendingPayments,
        overduePayments,
        averageSessionPrice,
        monthlyRecurringRevenue,
        cashFlow
      }
    } catch (error) {
      console.error('Erro ao gerar resumo financeiro:', error)
      throw new Error('Erro ao gerar resumo financeiro')
    }
  }

  static async getTherapistRevenue(therapistId: string, month: number, year: number) {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      
      const appointments = await prisma.appointment.findMany({
        where: {
          therapistId,
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        }
      })
      
      const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      const paidRevenue = appointments
        .filter(apt => apt.isPaid)
        .reduce((sum, apt) => sum + apt.price.toNumber(), 0)
      
      return {
        therapistId,
        month,
        year,
        totalAppointments: appointments.length,
        totalRevenue,
        paidRevenue,
        pendingRevenue: totalRevenue - paidRevenue
      }
    } catch (error) {
      console.error('Erro ao buscar receita do terapeuta:', error)
      throw new Error('Erro ao buscar receita do terapeuta')
    }
  }
}