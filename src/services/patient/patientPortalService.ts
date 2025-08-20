import { prisma } from '@/lib/prisma'
import { 
  PatientDashboardData, 
  PatientActivity, 
  PatientAppointment, 
  PatientPrescription,
  PatientProgress,
  PatientProfile,
  PatientAppointmentRequest
} from '@/types/patientPortal'

export class PatientPortalService {

  static async getDashboardData(patientId: string): Promise<PatientDashboardData | null> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          appointments: {
            where: {
              scheduledAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
              }
            },
            include: {
              therapist: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              scheduledAt: 'desc'
            }
          },
          prescriptions: {
            where: {
              isActive: true
            },
            include: {
              exercise: true,
              therapist: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              executions: {
                orderBy: {
                  executedAt: 'desc'
                },
                take: 10
              }
            }
          }
        }
      })

      if (!patient) {
        return null
      }

      // Estatísticas gerais
      const [totalPrescriptions, activePrescriptions, completedExecutions] = await Promise.all([
        prisma.exercisePrescription.count({
          where: { patientId }
        }),
        prisma.exercisePrescription.count({
          where: { patientId, isActive: true }
        }),
        prisma.exerciseExecution.count({
          where: {
            prescription: {
              patientId
            }
          }
        })
      ])

      // Próximos agendamentos
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          scheduledAt: {
            gte: new Date()
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED']
          }
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        take: 5
      })

      const lastAppointment = patient.appointments.find(apt => 
        apt.status === 'COMPLETED' && apt.scheduledAt < new Date()
      )

      const nextAppointment = upcomingAppointments[0]

      // Atividades recentes
      const recentActivity = await this.getRecentActivity(patientId)

      // Prescrições ativas com progresso
      const activePrescriptionsWithProgress = await this.getActivePrescriptionsWithProgress(patientId)

      // Resumo de saúde
      const healthSummary = await this.getHealthSummary(patientId)

      return {
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          email: patient.email || undefined,
          phone: patient.phone,
          birthDate: patient.birthDate,
          gender: patient.gender
        },
        stats: {
          totalPrescriptions,
          activePrescriptions,
          completedExecutions,
          upcomingAppointments: upcomingAppointments.length,
          lastAppointment: lastAppointment?.scheduledAt,
          nextAppointment: nextAppointment?.scheduledAt
        },
        recentActivity,
        upcomingAppointments: upcomingAppointments.map(apt => ({
          id: apt.id,
          scheduledAt: apt.scheduledAt,
          duration: apt.duration,
          status: apt.status,
          therapist: {
            name: apt.therapist.user.name || 'Fisioterapeuta',
            specialty: apt.therapist.specialty
          },
          canReschedule: true,
          canCancel: true
        })),
        activePrescriptions: activePrescriptionsWithProgress,
        healthSummary
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      return null
    }
  }

  static async getRecentActivity(patientId: string, limit: number = 10): Promise<PatientActivity[]> {
    try {
      const activities: PatientActivity[] = []

      // Execuções de exercícios recentes
      const recentExecutions = await prisma.exerciseExecution.findMany({
        where: {
          prescription: {
            patientId
          }
        },
        include: {
          prescription: {
            include: {
              exercise: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          executedAt: 'desc'
        },
        take: 5
      })

      recentExecutions.forEach(execution => {
        activities.push({
          id: `execution-${execution.id}`,
          type: 'EXERCISE_COMPLETED',
          title: 'Exercício realizado',
          description: `${execution.prescription.exercise.name}`,
          date: execution.executedAt,
          metadata: {
            exerciseName: execution.prescription.exercise.name,
            painLevel: execution.painLevel || undefined
          }
        })
      })

      // Consultas recentes
      const recentAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          status: 'COMPLETED'
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'desc'
        },
        take: 3
      })

      recentAppointments.forEach(appointment => {
        activities.push({
          id: `appointment-${appointment.id}`,
          type: 'APPOINTMENT_ATTENDED',
          title: 'Consulta realizada',
          description: `Consulta com ${appointment.therapist.user.name}`,
          date: appointment.scheduledAt,
          metadata: {
            therapistName: appointment.therapist.user.name || 'Fisioterapeuta'
          }
        })
      })

      return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Erro ao buscar atividade recente:', error)
      return []
    }
  }

  static async getActivePrescriptionsWithProgress(patientId: string): Promise<PatientPrescription[]> {
    try {
      const prescriptions = await prisma.exercisePrescription.findMany({
        where: {
          patientId,
          isActive: true
        },
        include: {
          exercise: true,
          therapist: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          executions: {
            orderBy: {
              executedAt: 'desc'
            }
          }
        }
      })

      return prescriptions.map(prescription => {
        const totalExecutions = prescription.executions.length
        
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const thisWeekExecutions = prescription.executions.filter(
          execution => execution.executedAt >= oneWeekAgo
        ).length

        const lastExecution = prescription.executions[0]
        
        const painLevels = prescription.executions
          .filter(e => e.painLevel !== null)
          .map(e => e.painLevel!)
        
        const averagePainLevel = painLevels.length > 0
          ? painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length
          : undefined

        // Calcular taxa de conclusão baseada na frequência esperada
        const daysSinceStart = Math.ceil(
          (new Date().getTime() - new Date(prescription.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        const expectedExecutions = Math.max(1, Math.floor(daysSinceStart / 2)) // Aproximadamente a cada 2 dias
        const completionRate = Math.min(100, (totalExecutions / expectedExecutions) * 100)

        return {
          id: prescription.id,
          exercise: {
            id: prescription.exercise.id,
            name: prescription.exercise.name,
            category: prescription.exercise.category,
            description: prescription.exercise.description,
            instructions: prescription.exercise.instructions,
            videoUrl: prescription.exercise.videoUrl || undefined,
            thumbnailUrl: prescription.exercise.thumbnailUrl || undefined,
            duration: prescription.exercise.duration || undefined,
            difficulty: prescription.exercise.difficulty
          },
          sets: prescription.sets || undefined,
          repetitions: prescription.repetitions || undefined,
          holdTime: prescription.holdTime || undefined,
          frequency: prescription.frequency,
          startDate: prescription.startDate,
          endDate: prescription.endDate || undefined,
          isActive: prescription.isActive,
          progress: {
            totalExecutions,
            thisWeekExecutions,
            lastExecution: lastExecution?.executedAt,
            averagePainLevel,
            completionRate: Math.round(completionRate)
          },
          therapist: {
            name: prescription.therapist.user.name || 'Fisioterapeuta',
            specialty: prescription.therapist.specialty
          }
        }
      })
    } catch (error) {
      console.error('Erro ao buscar prescrições ativas:', error)
      return []
    }
  }

  static async getHealthSummary(patientId: string) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const recentExecutions = await prisma.exerciseExecution.findMany({
        where: {
          prescription: {
            patientId
          },
          executedAt: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: {
          executedAt: 'asc'
        }
      })

      const painLevels = recentExecutions
        .filter(e => e.painLevel !== null)
        .map(e => e.painLevel!)

      const averagePainLevel = painLevels.length > 0
        ? painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length
        : undefined

      // Calcular taxa de aderência
      const activePrescriptions = await prisma.exercisePrescription.count({
        where: { patientId, isActive: true }
      })

      const expectedExecutions = activePrescriptions * 15 // ~15 execuções por prescrição em 30 dias
      const adherenceRate = expectedExecutions > 0 
        ? Math.min(100, (recentExecutions.length / expectedExecutions) * 100)
        : 0

      // Determinar tendência de progresso
      let progressTrend: 'improving' | 'stable' | 'declining' = 'stable'
      
      if (painLevels.length >= 5) {
        const firstHalf = painLevels.slice(0, Math.floor(painLevels.length / 2))
        const secondHalf = painLevels.slice(Math.floor(painLevels.length / 2))
        
        const firstAvg = firstHalf.reduce((sum, level) => sum + level, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, level) => sum + level, 0) / secondHalf.length
        
        if (secondAvg < firstAvg - 0.5) {
          progressTrend = 'improving'
        } else if (secondAvg > firstAvg + 0.5) {
          progressTrend = 'declining'
        }
      }

      return {
        averagePainLevel,
        adherenceRate: Math.round(adherenceRate),
        progressTrend,
        lastUpdate: new Date()
      }
    } catch (error) {
      console.error('Erro ao calcular resumo de saúde:', error)
      return {
        averagePainLevel: undefined,
        adherenceRate: 0,
        progressTrend: 'stable' as const,
        lastUpdate: new Date()
      }
    }
  }

  static async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      })

      if (!patient) {
        return null
      }

      return {
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email || undefined,
        phone: patient.phone,
        birthDate: patient.birthDate,
        gender: patient.gender,
        address: patient.address as any,
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          privacy: {
            shareDataForResearch: patient.dataConsent,
            allowMarketing: false
          }
        },
        medicalInfo: {
          bloodType: patient.bloodType || undefined,
          allergies: patient.allergies,
          medications: patient.medications,
          medicalConditions: patient.medicalConditions
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do paciente:', error)
      return null
    }
  }

  static async requestAppointment(
    patientId: string, 
    request: PatientAppointmentRequest
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      // Verificar disponibilidade (simulado)
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          scheduledAt: request.preferredDate,
          ...(request.therapistId && { therapistId: request.therapistId })
        }
      })

      if (existingAppointment) {
        return {
          success: false,
          error: 'Horário não disponível'
        }
      }

      // Por enquanto, apenas simular o pedido
      // Em implementação real, criaria um pedido na tabela de solicitações
      
      return {
        success: true,
        appointmentId: `request-${Date.now()}`
      }
    } catch (error) {
      console.error('Erro ao solicitar agendamento:', error)
      return {
        success: false,
        error: 'Erro ao processar solicitação'
      }
    }
  }
}