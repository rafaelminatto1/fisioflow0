import { prisma } from '@/lib/prisma'
import { ExerciseCategory, BodyRegion } from '@prisma/client'
import { CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters, ExerciseResponse } from '@/types/exercise'

export class ExerciseService {
  
  static async createExercise(data: CreateExerciseDTO, createdBy: string) {
    try {
      const exercise = await prisma.exercise.create({
        data: {
          ...data,
          createdBy,
          isPublic: data.isPublic ?? true
        }
      })

      return {
        success: true,
        data: exercise
      }
    } catch (error) {
      console.error('Erro ao criar exercício:', error)
      return {
        success: false,
        error: 'Erro ao criar exercício'
      }
    }
  }

  static async getExercises(
    filters: ExerciseFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ExerciseResponse> {
    try {
      const skip = (page - 1) * limit

      const where: any = {}

      if (filters.category) {
        where.category = filters.category
      }

      if (filters.bodyRegion && filters.bodyRegion.length > 0) {
        where.bodyRegion = {
          hasSome: filters.bodyRegion
        }
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty
      }

      if (filters.equipment && filters.equipment.length > 0) {
        where.equipment = {
          hasSome: filters.equipment
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags
        }
      }

      if (filters.search) {
        where.OR = [
          {
            name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              hasSome: [filters.search]
            }
          }
        ]
      }

      if (filters.createdBy) {
        where.createdBy = filters.createdBy
      }

      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic
      }

      const [exercises, total] = await Promise.all([
        prisma.exercise.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.exercise.count({ where })
      ])

      return {
        exercises,
        total,
        page,
        limit
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error)
      return {
        exercises: [],
        total: 0,
        page,
        limit
      }
    }
  }

  static async getExerciseById(id: string) {
    try {
      const exercise = await prisma.exercise.findUnique({
        where: { id },
        include: {
          prescriptions: {
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
          }
        }
      })

      if (!exercise) {
        return {
          success: false,
          error: 'Exercício não encontrado'
        }
      }

      return {
        success: true,
        data: exercise
      }
    } catch (error) {
      console.error('Erro ao buscar exercício:', error)
      return {
        success: false,
        error: 'Erro ao buscar exercício'
      }
    }
  }

  static async updateExercise(id: string, data: UpdateExerciseDTO, userId: string) {
    try {
      const existingExercise = await prisma.exercise.findUnique({
        where: { id }
      })

      if (!existingExercise) {
        return {
          success: false,
          error: 'Exercício não encontrado'
        }
      }

      if (existingExercise.createdBy !== userId) {
        return {
          success: false,
          error: 'Você não tem permissão para editar este exercício'
        }
      }

      const exercise = await prisma.exercise.update({
        where: { id },
        data
      })

      return {
        success: true,
        data: exercise
      }
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error)
      return {
        success: false,
        error: 'Erro ao atualizar exercício'
      }
    }
  }

  static async deleteExercise(id: string, userId: string) {
    try {
      const existingExercise = await prisma.exercise.findUnique({
        where: { id }
      })

      if (!existingExercise) {
        return {
          success: false,
          error: 'Exercício não encontrado'
        }
      }

      if (existingExercise.createdBy !== userId) {
        return {
          success: false,
          error: 'Você não tem permissão para deletar este exercício'
        }
      }

      const prescriptionsCount = await prisma.exercisePrescription.count({
        where: { exerciseId: id }
      })

      if (prescriptionsCount > 0) {
        return {
          success: false,
          error: 'Não é possível deletar um exercício que possui prescrições associadas'
        }
      }

      await prisma.exercise.delete({
        where: { id }
      })

      return {
        success: true,
        message: 'Exercício deletado com sucesso'
      }
    } catch (error) {
      console.error('Erro ao deletar exercício:', error)
      return {
        success: false,
        error: 'Erro ao deletar exercício'
      }
    }
  }

  static async getExerciseCategories() {
    return Object.values(ExerciseCategory)
  }

  static async getBodyRegions() {
    return Object.values(BodyRegion)
  }

  static async getPopularExercises(limit: number = 10) {
    try {
      const exercises = await prisma.exercise.findMany({
        include: {
          _count: {
            select: {
              prescriptions: true
            }
          }
        },
        orderBy: {
          prescriptions: {
            _count: 'desc'
          }
        },
        take: limit
      })

      return {
        success: true,
        data: exercises
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios populares:', error)
      return {
        success: false,
        error: 'Erro ao buscar exercícios populares'
      }
    }
  }

  static async getExerciseStats(userId?: string) {
    try {
      const where = userId ? { createdBy: userId } : {}

      const [
        total,
        byCategory,
        totalPrescriptions
      ] = await Promise.all([
        prisma.exercise.count({ where }),
        
        prisma.exercise.groupBy({
          by: ['category'],
          where,
          _count: {
            _all: true
          }
        }),

        prisma.exercisePrescription.count({
          where: userId ? {
            exercise: {
              createdBy: userId
            }
          } : {}
        })
      ])

      const categoryStats = byCategory.reduce((acc, item) => {
        acc[item.category] = item._count._all
        return acc
      }, {} as Record<string, number>)

      return {
        success: true,
        data: {
          total,
          byCategory: categoryStats,
          totalPrescriptions
        }
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de exercícios:', error)
      return {
        success: false,
        error: 'Erro ao buscar estatísticas'
      }
    }
  }

  static async duplicateExercise(id: string, userId: string) {
    try {
      const originalExercise = await prisma.exercise.findUnique({
        where: { id }
      })

      if (!originalExercise) {
        return {
          success: false,
          error: 'Exercício não encontrado'
        }
      }

      const duplicatedExercise = await prisma.exercise.create({
        data: {
          name: `${originalExercise.name} (Cópia)`,
          category: originalExercise.category,
          bodyRegion: originalExercise.bodyRegion,
          description: originalExercise.description,
          instructions: originalExercise.instructions,
          videoUrl: originalExercise.videoUrl,
          thumbnailUrl: originalExercise.thumbnailUrl,
          duration: originalExercise.duration,
          difficulty: originalExercise.difficulty,
          equipment: originalExercise.equipment,
          isPublic: false, // Cópias são privadas por padrão
          createdBy: userId,
          tags: originalExercise.tags
        }
      })

      return {
        success: true,
        data: duplicatedExercise
      }
    } catch (error) {
      console.error('Erro ao duplicar exercício:', error)
      return {
        success: false,
        error: 'Erro ao duplicar exercício'
      }
    }
  }
}