import { PrismaClient, Role, Gender, ExerciseCategory, BodyRegion } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fisioflow.com' },
    update: {},
    create: {
      email: 'admin@fisioflow.com',
      name: 'Administrador',
      role: Role.ADMIN,
      passwordHash: adminPassword,
    },
  })
  
  console.log('✅ Usuário admin criado:', admin.email)

  // Criar fisioterapeuta
  const therapistPassword = await bcrypt.hash('fisio123', 12)
  const therapistUser = await prisma.user.upsert({
    where: { email: 'fisio@fisioflow.com' },
    update: {},
    create: {
      email: 'fisio@fisioflow.com',
      name: 'Dr. João Silva',
      role: Role.FISIOTERAPEUTA,
      passwordHash: therapistPassword,
      crefito: '123456-F',
    },
  })

  const therapist = await prisma.therapist.upsert({
    where: { userId: therapistUser.id },
    update: {},
    create: {
      userId: therapistUser.id,
      crefito: '123456-F',
      specialty: 'Fisioterapia Traumato-Ortopédica',
    },
  })

  console.log('✅ Fisioterapeuta criado:', therapistUser.email)

  // Criar horários de trabalho
  const workingDays = [1, 2, 3, 4, 5] // Segunda a sexta
  for (const day of workingDays) {
    await prisma.workingHours.upsert({
      where: {
        therapistId_dayOfWeek: {
          therapistId: therapist.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        therapistId: therapist.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
      },
    })
  }

  console.log('✅ Horários de trabalho criados')

  // Criar exercícios de exemplo
  const exercises = [
    {
      name: 'Alongamento Cervical',
      category: ExerciseCategory.STRETCHING,
      bodyRegion: [BodyRegion.CERVICAL],
      description: 'Exercício de alongamento para musculatura cervical',
      instructions: '1. Sente-se com a coluna ereta\n2. Incline a cabeça lateralmente\n3. Mantenha por 30 segundos\n4. Repita para o outro lado',
      difficulty: 1,
      equipment: [],
      tags: ['cervical', 'alongamento', 'dor no pescoço'],
      createdBy: therapistUser.id,
    },
    {
      name: 'Fortalecimento Quadríceps',
      category: ExerciseCategory.STRENGTHENING,
      bodyRegion: [BodyRegion.KNEE],
      description: 'Exercício para fortalecimento do músculo quadríceps',
      instructions: '1. Sente-se em uma cadeira\n2. Estenda uma perna\n3. Mantenha por 5 segundos\n4. Abaixe lentamente\n5. Repita 10 vezes',
      difficulty: 2,
      equipment: ['cadeira'],
      tags: ['quadríceps', 'fortalecimento', 'joelho'],
      createdBy: therapistUser.id,
    },
    {
      name: 'Mobilização Lombar',
      category: ExerciseCategory.MOBILITY,
      bodyRegion: [BodyRegion.LUMBAR],
      description: 'Exercício de mobilização para coluna lombar',
      instructions: '1. Deite-se de costas\n2. Leve os joelhos ao peito\n3. Balance suavemente\n4. Mantenha por 30 segundos',
      difficulty: 1,
      equipment: ['colchonete'],
      tags: ['lombar', 'mobilização', 'dor nas costas'],
      createdBy: therapistUser.id,
    },
  ]

  for (const exercise of exercises) {
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: exercise.name }
    })
    
    if (!existingExercise) {
      await prisma.exercise.create({
        data: exercise,
      })
    }
  }

  console.log('✅ Exercícios de exemplo criados')

  // Criar paciente de exemplo
  const patientPassword = await bcrypt.hash('paciente123', 12)
  const patientUser = await prisma.user.upsert({
    where: { email: 'paciente@fisioflow.com' },
    update: {},
    create: {
      email: 'paciente@fisioflow.com',
      name: 'Maria Santos',
      role: Role.PACIENTE,
      passwordHash: patientPassword,
    },
  })

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      cpf: '123.456.789-01', // Em produção seria criptografado
      fullName: 'Maria Santos',
      birthDate: new Date('1985-03-15'),
      gender: Gender.FEMININO,
      phone: '(11) 99999-9999',
      email: 'paciente@fisioflow.com',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      },
      dataConsent: true,
      imageConsent: true,
      consentDate: new Date(),
      createdBy: therapistUser.id,
    },
  })

  console.log('✅ Paciente de exemplo criado:', patientUser.email)

  // Criar prontuário médico
  const existingRecord = await prisma.medicalRecord.findFirst({
    where: {
      patientId: patient.id,
      therapistId: therapist.id,
    }
  })

  if (!existingRecord) {
    await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        therapistId: therapist.id,
        chiefComplaint: 'Dor lombar há 2 meses',
        presentIllness: 'Paciente relata dor lombar de início insidioso há aproximadamente 2 meses, com piora aos movimentos de flexão.',
        pastMedicalHistory: 'Nega cirurgias prévias. Histórico de sedentarismo.',
        physioDiagnosis: 'Lombalgia mecânica',
        coffitoCode: 'CIF-01',
        icd10: 'M54.5',
      },
    })
  }

  console.log('✅ Prontuário médico criado')

  // Criar consulta de exemplo
  const appointmentDate = new Date()
  appointmentDate.setDate(appointmentDate.getDate() + 7) // Próxima semana
  appointmentDate.setHours(14, 0, 0, 0) // 14:00

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      therapistId: therapist.id,
      scheduledAt: appointmentDate,
      duration: 60,
      price: 150.00,
      notes: 'Primeira consulta - avaliação inicial',
    },
  })

  console.log('✅ Consulta de exemplo criada')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
