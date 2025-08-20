import { prisma } from '@/lib/prisma'
import { 
  CreatePrescriptionDTO, 
  UpdatePrescriptionDTO, 
  CreateExecutionDTO,
  PrescriptionFilters,
  PrescriptionResponse,
  PrescriptionStats,
  PatientProgress
} from '@/types/prescription'

export class PrescriptionService {

  static async createPrescription(data: CreatePrescriptionDTO, therapistId: string) {
    try {
      const [patient, exercise] = await Promise.all([
        prisma.patient.findUnique({ where: { id: data.patientId } }),
        prisma.exercise.findUnique({ where: { id: data.exerciseId } })
      ])

      if (!patient) {
        return {
          success: false,
          error: 'Paciente não encontrado'
        }
      }

      if (!exercise) {
        return {
          success: false,
          error: 'Exercício não encontrado'
        }
      }

      const prescription = await prisma.exercisePrescription.create({
        data: {
          ...data,
          therapistId,
          isActive: data.isActive ?? true
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true
            }
          },
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              difficulty: true,
              videoUrl: true,
              thumbnailUrl: true
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

      return {
        success: true,
        data: prescription
      }
    } catch (error) {
      console.error('Erro ao criar prescrição:', error)
      return {
        success: false,
        error: 'Erro ao criar prescrição'
      }
    }
  }

  static async getPrescriptions(
    filters: PrescriptionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PrescriptionResponse> {
    try {
      const skip = (page - 1) * limit

      const where: any = {}

      if (filters.patientId) {
        where.patientId = filters.patientId
      }

      if (filters.therapistId) {
        where.therapistId = filters.therapistId
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters.startDate) {
        where.startDate = {
          gte: filters.startDate
        }
      }

      if (filters.endDate) {
        where.endDate = {
          lte: filters.endDate
        }
      }

      if (filters.exerciseCategory) {
        where.exercise = {
          category: filters.exerciseCategory
        }
      }

      const [prescriptions, total] = await Promise.all([
        prisma.exercisePrescription.findMany({
          where,
          skip,
          take: limit,
          include: {
            patient: {
              select: {
                id: true,
                fullName: true
              }
            },
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                difficulty: true,
                videoUrl: true,
                thumbnailUrl: true
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
            },
            executions: {
              orderBy: {
                executedAt: 'desc'
              },
              take: 5
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.exercisePrescription.count({ where })
      ])

      return {
        prescriptions,
        total,
        page,
        limit
      }
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error)
      return {
        prescriptions: [],
        total: 0,
        page,
        limit
      }
    }
  }

  static async getPrescriptionById(id: string) {
    try {
      const prescription = await prisma.exercisePrescription.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              birthDate: true
            }
          },
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              bodyRegion: true,
              description: true,
              instructions: true,
              videoUrl: true,
              thumbnailUrl: true,
              duration: true,
              difficulty: true,
              equipment: true
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
          },
          executions: {
            orderBy: {
              executedAt: 'desc'
            }
          }
        }
      })

      if (!prescription) {
        return {
          success: false,
          error: 'Prescrição não encontrada'
        }
      }

      return {
        success: true,
        data: prescription
      }
    } catch (error) {
      console.error('Erro ao buscar prescrição:', error)
      return {
        success: false,
        error: 'Erro ao buscar prescrição'
      }
    }
  }

  static async updatePrescription(id: string, data: UpdatePrescriptionDTO, therapistId: string) {
    try {
      const existingPrescription = await prisma.exercisePrescription.findUnique({
        where: { id }
      })

      if (!existingPrescription) {
        return {
          success: false,
          error: 'Prescrição não encontrada'
        }
      }

      if (existingPrescription.therapistId !== therapistId) {
        return {
          success: false,
          error: 'Você não tem permissão para editar esta prescrição'
        }
      }

      const prescription = await prisma.exercisePrescription.update({
        where: { id },
        data,
        include: {
          patient: {
            select: {
              id: true,
              fullName: true
            }
          },
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              difficulty: true
            }
          }
        }
      })

      return {
        success: true,
        data: prescription
      }
    } catch (error) {
      console.error('Erro ao atualizar prescrição:', error)
      return {
        success: false,
        error: 'Erro ao atualizar prescrição'
      }
    }
  }

  static async deletePrescription(id: string, therapistId: string) {
    try {
      const existingPrescription = await prisma.exercisePrescription.findUnique({
        where: { id }
      })

      if (!existingPrescription) {
        return {
          success: false,
          error: 'Prescrição não encontrada'
        }
      }

      if (existingPrescription.therapistId !== therapistId) {
        return {
          success: false,
          error: 'Você não tem permissão para deletar esta prescrição'
        }
      }

      await prisma.exercisePrescription.delete({
        where: { id }
      })

      return {
        success: true,
        message: 'Prescrição deletada com sucesso'
      }
    } catch (error) {
      console.error('Erro ao deletar prescrição:', error)
      return {
        success: false,
        error: 'Erro ao deletar prescrição'
      }
    }
  }

  static async createExecution(data: CreateExecutionDTO) {
    try {
      const prescription = await prisma.exercisePrescription.findUnique({
        where: { id: data.prescriptionId }
      })

      if (!prescription) {
        return {
          success: false,
          error: 'Prescrição não encontrada'
        }
      }

      if (!prescription.isActive) {
        return {
          success: false,
          error: 'Prescrição inativa'
        }
      }

      const execution = await prisma.exerciseExecution.create({
        data,
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
        }
      })

      return {
        success: true,
        data: execution
      }
    } catch (error) {
      console.error('Erro ao registrar execução:', error)
      return {
        success: false,
        error: 'Erro ao registrar execução'
      }
    }
  }

  static async getExecutionsByPrescription(prescriptionId: string) {
    try {
      const executions = await prisma.exerciseExecution.findMany({
        where: { prescriptionId },
        orderBy: {
          executedAt: 'desc'
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
        }
      })

      return {
        success: true,
        data: executions
      }
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
      return {
        success: false,
        error: 'Erro ao buscar execuções'
      }
    }
  }

  static async getPrescriptionStats(therapistId?: string): Promise<PrescriptionStats> {
    try {
      const where = therapistId ? { therapistId } : {}

      const [
        total,
        active,
        inactive,
        byCategory,
        recentExecutions
      ] = await Promise.all([
        prisma.exercisePrescription.count({ where }),
        
        prisma.exercisePrescription.count({
          where: { ...where, isActive: true }
        }),
        
        prisma.exercisePrescription.count({
          where: { ...where, isActive: false }
        }),

        prisma.exercisePrescription.groupBy({
          by: ['exerciseId'],
          where,
          _count: {
            _all: true
          },
          include: {
            exercise: {
              select: {
                category: true
              }
            }
          }
        }),

        prisma.exerciseExecution.count({
          where: {
            executedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            ...(therapistId && {
              prescription: {
                therapistId
              }
            })
          }
        })
      ])

      const categoryStats: Record<string, number> = {}

      return {
        total,
        active,
        inactive,
        byCategory: categoryStats,
        recentExecutions
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de prescrições:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byCategory: {},
        recentExecutions: 0
      }
    }
  }

  static async getPatientProgress(patientId: string): Promise<PatientProgress | null> {
    try {
      const [
        prescriptions,
        executions,
        patient
      ] = await Promise.all([
        prisma.exercisePrescription.findMany({
          where: { patientId },
          include: {
            executions: true
          }
        }),

        prisma.exerciseExecution.findMany({
          where: {
            prescription: {
              patientId
            }
          },
          orderBy: {
            executedAt: 'desc'
          }
        }),

        prisma.patient.findUnique({
          where: { id: patientId },
          select: {
            fullName: true
          }
        })
      ])

      if (!patient) {
        return null
      }

      const totalPrescriptions = prescriptions.length
      const activePrescriptions = prescriptions.filter(p => p.isActive).length
      const completedExecutions = executions.length

      const painLevels = executions
        .filter(e => e.painLevel !== null)
        .map(e => e.painLevel!)
      
      const difficulties = executions
        .filter(e => e.difficulty !== null)
        .map(e => e.difficulty!)

      const averagePainLevel = painLevels.length > 0 
        ? painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length
        : undefined

      const averageDifficulty = difficulties.length > 0
        ? difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length
        : undefined

      const lastExecution = executions.length > 0 ? executions[0].executedAt : undefined

      const expectedExecutions = activePrescriptions * 7
      const adherenceRate = expectedExecutions > 0 
        ? (completedExecutions / expectedExecutions) * 100
        : 0

      return {
        patientId,
        patientName: patient.fullName,
        totalPrescriptions,
        activePrescriptions,
        completedExecutions,
        averagePainLevel,
        averageDifficulty,
        lastExecution,
        adherenceRate: Math.min(adherenceRate, 100)
      }
    } catch (error) {
      console.error('Erro ao buscar progresso do paciente:', error)
      return null
    }
  }

  static async getActivePrescriptionsByPatient(patientId: string) {
    try {
      const prescriptions = await prisma.exercisePrescription.findMany({
        where: {
          patientId,
          isActive: true
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              bodyRegion: true,
              description: true,
              instructions: true,
              videoUrl: true,
              thumbnailUrl: true,
              duration: true,
              difficulty: true,
              equipment: true
            }
          },
          executions: {
            orderBy: {
              executedAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return {
        success: true,
        data: prescriptions
      }
    } catch (error) {
      console.error('Erro ao buscar prescrições ativas do paciente:', error)
      return {
        success: false,
        error: 'Erro ao buscar prescrições'
      }
    }
  }
}