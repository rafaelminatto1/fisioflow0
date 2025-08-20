import { prisma } from '@/lib/prisma'
import { Appointment, AppointmentStatus, WorkingHours } from '@prisma/client'

export interface AppointmentWithPatient extends Appointment {
  patient: {
    user: {
      name: string | null
    } | null
  }
}

export interface AppointmentWithTherapist extends Appointment {
  therapist: {
    user: {
      name: string | null
    } | null
  }
}

export interface AppointmentWithRelations extends Appointment {
  patient: {
    user: {
      name: string | null
    } | null
  }
  therapist: {
    user: {
      name: string | null
    } | null
  }
}
import { addDays, addHours, format } from 'date-fns'

export interface CreateAppointmentDto {
  patientId: string
  therapistId: string
  scheduledAt: Date
  duration: number // em minutos
  notes?: string
  status?: AppointmentStatus
  price?: number
}

export interface AppointmentConflict {
  type: 'OVERLAP' | 'WORKING_HOURS' | 'PATIENT_UNAVAILABLE' | 'THERAPIST_UNAVAILABLE'
  message: string
  conflictingAppointment?: Appointment
}

export class SchedulingService {
  // Verificar disponibilidade e detectar conflitos
  static async checkAvailability(
    therapistId: string,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<{ available: boolean; conflicts: AppointmentConflict[] }> {
    const conflicts: AppointmentConflict[] = []
    
    // 1. Verificar horário de trabalho
    const workingHours = await this.getWorkingHours(therapistId, scheduledAt)
    if (!workingHours) {
      conflicts.push({
        type: 'WORKING_HOURS',
        message: 'Fisioterapeuta não trabalha neste horário'
      })
    } else {
      const appointmentEnd = addHours(scheduledAt, duration / 60)
      const startTime = scheduledAt.getHours() * 60 + scheduledAt.getMinutes()
      const endTime = appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes()
      
      // Converter horários de trabalho para minutos
      const [startHour, startMinute] = workingHours.startTime.split(':').map(Number)
      const [endHour, endMinute] = workingHours.endTime.split(':').map(Number)
      const workingStartTime = startHour * 60 + startMinute
      const workingEndTime = endHour * 60 + endMinute
      
      if (startTime < workingStartTime || endTime > workingEndTime) {
        conflicts.push({
          type: 'WORKING_HOURS',
          message: `Horário fora do expediente (${workingHours.startTime} - ${workingHours.endTime})`
        })
      }
    }
    
    // 2. Verificar sobreposição com outros agendamentos
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        },
        scheduledAt: {
          gte: addDays(scheduledAt, -1), // Buscar 1 dia antes
          lte: addDays(scheduledAt, 1)   // Buscar 1 dia depois
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
      }
    })
    
    for (const appointment of overlappingAppointments) {
      const appointmentEnd = addHours(appointment.scheduledAt, appointment.duration / 60)
      const newAppointmentEnd = addHours(scheduledAt, duration / 60)
      
      if (this.isOverlapping(
        scheduledAt, newAppointmentEnd,
        appointment.scheduledAt, appointmentEnd
      )) {
        conflicts.push({
          type: 'OVERLAP',
          message: `Conflito com consulta às ${format(appointment.scheduledAt, 'HH:mm')}`,
          conflictingAppointment: appointment
        })
      }
    }
    
    // 3. Verificar disponibilidade do paciente
    // Por enquanto, vamos pular esta verificação até implementar a lógica correta
    // const patientConflicts = await prisma.appointment.findMany({
    //   where: {
    //     patientId: (await this.getPatientIdFromAppointment(scheduledAt, duration)) || '',
    //     status: {
    //       in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
    //     },
    //     scheduledAt: {
    //       gte: addDays(scheduledAt, -1),
    //       lte: addDays(scheduledAt, 1)
    //     },
    //     ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
    //   }
    // })
    
    // for (const appointment of patientConflicts) {
    //   const appointmentEnd = addHours(appointment.scheduledAt, appointment.duration / 60)
    //   const newAppointmentEnd = addHours(scheduledAt, duration / 60)
    //   
    //   if (this.isOverlapping(
    //     scheduledAt, newAppointmentEnd,
    //     appointment.scheduledAt, appointmentEnd
    //   )) {
    //     conflicts.push({
    //       type: 'PATIENT_UNAVAILABLE',
    //       message: `Paciente já tem consulta às ${format(appointment.scheduledAt, 'HH:mm')}`
    //     })
    //   }
    // }
    
    return {
      available: conflicts.length === 0,
      conflicts
    }
  }
  
  // Criar agendamento
  static async createAppointment(data: CreateAppointmentDto): Promise<AppointmentWithRelations> {
    // Verificar disponibilidade
    const availability = await this.checkAvailability(
      data.therapistId,
      data.scheduledAt,
      data.duration
    )
    
    if (!availability.available) {
      throw new Error(`Conflitos detectados: ${availability.conflicts.map(c => c.message).join(', ')}`)
    }
    
    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        status: data.status || AppointmentStatus.SCHEDULED,
        price: data.price || 0 // Preço padrão se não fornecido
      },
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
    
    // Enviar notificação WhatsApp (simulado)
    await this.sendWhatsAppReminder(appointment)
    
    return appointment
  }
  
  // Buscar agendamentos do terapeuta
  static async getTherapistAppointments(
    therapistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentWithPatient[]> {
    return await prisma.appointment.findMany({
      where: {
        therapistId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: {
          include: { user: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })
  }
  
  // Buscar agendamentos do paciente
  static async getPatientAppointments(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentWithTherapist[]> {
    return await prisma.appointment.findMany({
      where: {
        patientId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        therapist: {
          include: { user: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })
  }
  
  // Atualizar agendamento
  static async updateAppointment(
    id: string,
    data: Partial<CreateAppointmentDto>
  ): Promise<AppointmentWithRelations> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, therapist: true }
    })
    
    if (!appointment) {
      throw new Error('Agendamento não encontrado')
    }
    
    // Se mudou horário, verificar disponibilidade
    if (data.scheduledAt || data.duration) {
      const availability = await this.checkAvailability(
        data.therapistId || appointment.therapistId,
        data.scheduledAt || appointment.scheduledAt,
        data.duration || appointment.duration,
        id
      )
      
      if (!availability.available) {
        throw new Error(`Conflitos detectados: ${availability.conflicts.map(c => c.message).join(', ')}`)
      }
    }
    
    return await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
  }
  
  // Cancelar agendamento
  static async cancelAppointment(id: string, reason?: string): Promise<AppointmentWithRelations> {
    // Primeiro buscar o agendamento para obter as notas atuais
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
    
    if (!currentAppointment) {
      throw new Error('Agendamento não encontrado')
    }
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        notes: reason ? `${currentAppointment.notes || ''}\n\nCancelado: ${reason}` : currentAppointment.notes
      },
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
    
    // Enviar notificação de cancelamento
    await this.sendWhatsAppCancellation(appointment)
    
    return appointment
  }
  
  // Reagendamento automático
  static async rescheduleAppointment(
    id: string,
    newDate: Date
  ): Promise<AppointmentWithRelations> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, therapist: true }
    })
    
    if (!appointment) {
      throw new Error('Agendamento não encontrado')
    }
    
    // Verificar disponibilidade no novo horário
    const availability = await this.checkAvailability(
      appointment.therapistId,
      newDate,
      appointment.duration,
      id
    )
    
    if (!availability.available) {
      throw new Error(`Novo horário não disponível: ${availability.conflicts.map(c => c.message).join(', ')}`)
    }
    
    // Atualizar horário
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: newDate,
        status: AppointmentStatus.SCHEDULED
      },
      include: {
        patient: {
          include: { user: true }
        },
        therapist: {
          include: { user: true }
        }
      }
    })
    
    // Enviar notificação de reagendamento
    await this.sendWhatsAppReschedule(updatedAppointment)
    
    return updatedAppointment
  }
  
  // Buscar próximos agendamentos
  static async getUpcomingAppointments(
    therapistId: string,
    days: number = 7
  ): Promise<AppointmentWithPatient[]> {
    const startDate = new Date()
    const endDate = addDays(startDate, days)
    
    return await prisma.appointment.findMany({
      where: {
        therapistId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        }
      },
      include: {
        patient: {
          include: { user: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })
  }
  
  // Verificar sobreposição de horários
  private static isOverlapping(
    start1: Date, end1: Date,
    start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1
  }
  
  // Obter horário de trabalho
  private static async getWorkingHours(
    therapistId: string,
    date: Date
  ): Promise<WorkingHours | null> {
    const dayOfWeek = date.getDay()
    
    return await prisma.workingHours.findFirst({
      where: {
        therapistId,
        dayOfWeek
      }
    })
  }
  
  // Obter ID do paciente (helper)
  private static async getPatientIdFromAppointment(): Promise<string | null> {
    // Esta função seria implementada baseada no contexto
    // Por enquanto, retorna null
    return null
  }
  
  // Enviar lembrete WhatsApp (simulado)
  private static async sendWhatsAppReminder(appointment: AppointmentWithRelations): Promise<void> {
    try {
      // Aqui seria integração real com Twilio WhatsApp
      console.log(`📱 WhatsApp: Lembrete enviado para ${appointment.patient?.user?.name || 'Paciente'} - Consulta às ${format(appointment.scheduledAt, 'HH:mm')}`)
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
    }
  }
  
  // Enviar cancelamento WhatsApp (simulado)
  private static async sendWhatsAppCancellation(appointment: AppointmentWithRelations): Promise<void> {
    try {
      console.log(`📱 WhatsApp: Cancelamento enviado para ${appointment.patient?.user?.name || 'Paciente'}`)
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
    }
  }
  
  // Enviar reagendamento WhatsApp (simulado)
  private static async sendWhatsAppReschedule(appointment: AppointmentWithRelations): Promise<void> {
    try {
      console.log(`📱 WhatsApp: Reagendamento enviado para ${appointment.patient?.user?.name || 'Paciente'} - Nova data: ${format(appointment.scheduledAt, 'dd/MM/yyyy HH:mm')}`)
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
    }
  }
}
