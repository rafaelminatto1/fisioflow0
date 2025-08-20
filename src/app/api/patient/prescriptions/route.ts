import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PatientPortalService } from '@/services/patient/patientPortalService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    // Buscar o paciente associado ao usuário
    let patientId = session.user.patientId

    if (!patientId) {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id }
      })
      
      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }
      
      patientId = patient.id
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const prescriptions = activeOnly
      ? await PatientPortalService.getActivePrescriptionsWithProgress(patientId)
      : await prisma.exercisePrescription.findMany({
          where: { patientId },
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
              take: 5
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error('Erro na API de prescrições do paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}