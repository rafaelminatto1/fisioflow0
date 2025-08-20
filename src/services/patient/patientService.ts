import { prisma } from '@/lib/prisma'
import { EncryptionService, encryptCPF, encryptPhone } from '@/services/encryption/encryptionService'
import { validateCPF } from '@/lib/utils'
import { CreatePatientDto, PatientFilters, PaginatedResponse } from '@/types'
import { Patient } from '@prisma/client'

interface PatientWithRelations extends Patient {
  medicalRecords?: Array<Record<string, unknown>>
  appointments?: Array<Record<string, unknown>>
  evolutions?: Array<Record<string, unknown>>
}

export class PatientService {
  // Criar paciente com criptografia LGPD
  static async createPatient(data: CreatePatientDto): Promise<Patient> {
    // Validar CPF
    if (!validateCPF(data.cpf)) {
      throw new Error('CPF inválido')
    }
    
    // Verificar se CPF já existe (comparando hash)
    const cpfHash = EncryptionService.hashSensitiveData(data.cpf)
    const existingPatient = await prisma.patient.findFirst({
      where: {
        cpf: {
          contains: cpfHash.substring(0, 8) // Busca parcial por performance
        }
      }
    })
    
    if (existingPatient) {
      // Verificar se é realmente o mesmo CPF descriptografando
      const existingCPF = EncryptionService.decrypt(existingPatient.cpf)
      if (existingCPF === data.cpf.replace(/\D/g, '')) {
        throw new Error('CPF já cadastrado')
      }
    }
    
    // Criptografar dados sensíveis
    const encryptedData = {
      ...data,
      cpf: encryptCPF(data.cpf),
      phone: encryptPhone(data.phone),
      email: data.email ? EncryptionService.encrypt(data.email) : null,
    }
    
    // Criar paciente com transação para auditoria LGPD
    return await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          ...encryptedData,
          dataConsent: true,
          imageConsent: data.imageConsent || false,
          consentDate: new Date(),
        }
      })
      
      // Log de auditoria LGPD
      await tx.auditLog.create({
        data: {
          action: 'PATIENT_CREATED',
          userId: data.createdBy,
          patientId: patient.id,
          metadata: {
            timestamp: new Date(),
            ipAddress: 'system',
            userAgent: 'system'
          }
        }
      }).catch(() => {
        // Ignorar erro se tabela não existir ainda
        console.log('Audit log table not found, skipping...')
      })
      
      return patient
    })
  }
  
  // Buscar pacientes com descriptografia
  static async findPatients(
    filters: PatientFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Patient>> {
    const skip = (page - 1) * limit
    
    // Construir where clause
    const where: Record<string, unknown> = {
      active: filters.active !== false,
    }
    
    if (filters.search) {
      // Para busca, precisamos fazer uma busca mais complexa
      // pois os dados estão criptografados
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        // Nota: CPF e email criptografados não podem ser buscados diretamente
      ]
    }
    
    if (filters.therapistId) {
      where.medicalRecords = {
        some: {
          therapistId: filters.therapistId
        }
      }
    }
    
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          medicalRecords: {
            select: { id: true, physioDiagnosis: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          appointments: {
            select: { id: true, scheduledAt: true, status: true },
            orderBy: { scheduledAt: 'desc' },
            take: 1
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ])
    
    // Descriptografar dados para retorno
    const decryptedPatients = patients.map(patient => ({
      ...patient,
      cpf: EncryptionService.decrypt(patient.cpf),
      phone: EncryptionService.decrypt(patient.phone),
      email: patient.email ? EncryptionService.decrypt(patient.email) : null,
    }))
    
    return {
      success: true,
      data: decryptedPatients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
  
  // Buscar paciente por ID com descriptografia
  static async findPatientById(id: string): Promise<Patient | null> {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        medicalRecords: {
          include: {
            therapist: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        appointments: {
          include: {
            therapist: {
              include: { user: true }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        evolutions: {
          include: {
            therapist: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!patient) return null
    
    // Descriptografar dados sensíveis
    return {
      ...patient,
      cpf: EncryptionService.decrypt(patient.cpf),
      phone: EncryptionService.decrypt(patient.phone),
      email: patient.email ? EncryptionService.decrypt(patient.email) : null,
    }
  }
  
  // Atualizar paciente
  static async updatePatient(id: string, data: Partial<CreatePatientDto>): Promise<Patient> {
    const encryptedData: Record<string, unknown> = { ...data }
    
    // Criptografar campos sensíveis se fornecidos
    if (data.cpf) {
      if (!validateCPF(data.cpf)) {
        throw new Error('CPF inválido')
      }
      encryptedData.cpf = encryptCPF(data.cpf)
    }
    
    if (data.phone) {
      encryptedData.phone = encryptPhone(data.phone)
    }
    
    if (data.email) {
      encryptedData.email = EncryptionService.encrypt(data.email)
    }
    
    const patient = await prisma.patient.update({
      where: { id },
      data: encryptedData
    })
    
    // Descriptografar para retorno
    return {
      ...patient,
      cpf: EncryptionService.decrypt(patient.cpf),
      phone: EncryptionService.decrypt(patient.phone),
      email: patient.email ? EncryptionService.decrypt(patient.email) : null,
    }
  }
  
  // Deletar paciente (LGPD - Direito ao esquecimento)
  static async deletePatient(id: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Soft delete - manter para auditoria
      await tx.patient.update({
        where: { id },
        data: {
          active: false,
          // Anonimizar dados
          fullName: 'DADOS_REMOVIDOS',
          cpf: 'REMOVIDO',
          phone: 'REMOVIDO',
          email: null,
        }
      })
      
      // Log de auditoria LGPD
      await tx.auditLog.create({
        data: {
          action: 'PATIENT_DELETED',
          userId,
          patientId: id,
          metadata: {
            timestamp: new Date(),
            reason: 'LGPD_RIGHT_TO_BE_FORGOTTEN'
          }
        }
      }).catch(() => {
        console.log('Audit log table not found, skipping...')
      })
    })
  }
  
  // Exportar dados do paciente (LGPD - Portabilidade)
  static async exportPatientData(id: string): Promise<Record<string, unknown>> {
    const patient = await this.findPatientById(id)
    if (!patient) throw new Error('Paciente não encontrado')
    
    return {
      dadosPessoais: {
        nome: patient.fullName,
        cpf: patient.cpf,
        telefone: patient.phone,
        email: patient.email,
        endereco: patient.address,
        dataNascimento: patient.birthDate,
        genero: patient.gender
      },
      dadosMedicos: {
        tipoSanguineo: patient.bloodType,
        alergias: patient.allergies,
        medicamentos: patient.medications,
        condicoesMedicas: patient.medicalConditions
      },
      prontuarios: (patient as PatientWithRelations).medicalRecords || [],
      consultas: (patient as PatientWithRelations).appointments || [],
      evolucoes: (patient as PatientWithRelations).evolutions || [],
      consentimentos: {
        dadosConsentimento: patient.dataConsent,
        imagemConsentimento: patient.imageConsent,
        dataConsentimento: patient.consentDate
      },
      exportadoEm: new Date().toISOString()
    }
  }
}
