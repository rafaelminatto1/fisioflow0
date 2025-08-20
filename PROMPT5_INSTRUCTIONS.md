# 🎯 PROMPT 5: Biblioteca de Exercícios e Prescrições

## 📋 **OBJETIVO**
Implementar sistema completo de gerenciamento de exercícios fisioterapêuticos e prescrições para pacientes.

---

## 🏗️ **O QUE JÁ EXISTE**

### **Schema Prisma (já implementado):**
```prisma
enum ExerciseCategory {
  STRETCHING      // Alongamento
  STRENGTHENING   // Fortalecimento
  MOBILITY        // Mobilidade
  BALANCE         // Equilíbrio
  CARDIO          // Cardiovascular
  FUNCTIONAL      // Funcional
}

enum BodyRegion {
  CERVICAL
  THORACIC
  LUMBAR
  SHOULDER
  ELBOW
  WRIST_HAND
  HIP
  KNEE
  ANKLE_FOOT
  CORE
}

model Exercise {
  id                String   @id @default(cuid())
  name              String
  category          ExerciseCategory
  bodyRegion        BodyRegion[]
  description       String   @db.Text
  instructions      String   @db.Text
  videoUrl          String?
  thumbnailUrl      String?
  duration          Int?     // segundos
  difficulty        Int      @default(1) // 1-5
  equipment         String[] @default([])
  isPublic          Boolean  @default(true)
  createdBy         String
  tags              String[] @default([])
  prescriptions     ExercisePrescription[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([category])
  @@index([name])
}

model ExercisePrescription {
  id              String   @id @default(cuid())
  patientId       String
  exerciseId      String
  therapistId     String
  sets            Int?
  repetitions     Int?
  holdTime        Int?     // segundos
  restTime        Int?     // segundos
  frequency       String   // "2x ao dia", "3x semana"
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean  @default(true)
  patient         Patient  @relation(fields: [patientId], references: [id])
  exercise        Exercise @relation(fields: [exerciseId], references: [id])
  therapist       Therapist @relation(fields: [therapistId], references: [id])
  executions      ExerciseExecution[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([patientId])
  @@index([isActive])
}

model ExerciseExecution {
  id                String   @id @default(cuid())
  prescriptionId    String
  executedAt        DateTime @default(now())
  setsCompleted     Int?
  repsCompleted     Int?
  painLevel         Int?     // 0-10
  difficulty        Int?     // 1-5
  notes             String?
  prescription      ExercisePrescription @relation(fields: [prescriptionId], references: [id])
  
  @@index([prescriptionId])
  @@index([executedAt])
}
```

---

## 🚀 **O QUE IMPLEMENTAR**

### **1. ExerciseService** (`src/services/exercise/exerciseService.ts`)
```typescript
export class ExerciseService {
  // CRUD básico
  static async createExercise(data: CreateExerciseDto): Promise<Exercise>
  static async findExerciseById(id: string): Promise<Exercise | null>
  static async findExercises(filters: ExerciseFilters): Promise<Exercise[]>
  static async updateExercise(id: string, data: UpdateExerciseDto): Promise<Exercise>
  static async deleteExercise(id: string): Promise<void>
  
  // Funcionalidades específicas
  static async findExercisesByCategory(category: ExerciseCategory): Promise<Exercise[]>
  static async findExercisesByBodyRegion(region: BodyRegion): Promise<Exercise[]>
  static async findExercisesByDifficulty(min: number, max: number): Promise<Exercise[]>
  static async searchExercises(query: string): Promise<Exercise[]>
  
  // Upload de mídia
  static async uploadVideo(exerciseId: string, file: File): Promise<string>
  static async uploadThumbnail(exerciseId: string, file: File): Promise<string>
}
```

### **2. PrescriptionService** (`src/services/prescription/prescriptionService.ts`)
```typescript
export class PrescriptionService {
  // CRUD de prescrições
  static async createPrescription(data: CreatePrescriptionDto): Promise<ExercisePrescription>
  static async findPrescriptionById(id: string): Promise<ExercisePrescription | null>
  static async findPatientPrescriptions(patientId: string): Promise<ExercisePrescription[]>
  static async findTherapistPrescriptions(therapistId: string): Promise<ExercisePrescription[]>
  static async updatePrescription(id: string, data: UpdatePrescriptionDto): Promise<ExercisePrescription>
  static async deactivatePrescription(id: string): Promise<ExercisePrescription>
  
  // Execuções
  static async recordExecution(data: CreateExecutionDto): Promise<ExerciseExecution>
  static async getExecutionHistory(prescriptionId: string): Promise<ExerciseExecution[]>
  
  // Relatórios
  static async getPatientProgress(patientId: string): Promise<PatientProgressReport>
  static async getPrescriptionStats(prescriptionId: string): Promise<PrescriptionStats>
}
```

### **3. API Routes**

#### **`/api/exercises`**
```typescript
// GET - Listar exercícios com filtros
// POST - Criar novo exercício
export async function GET(request: NextRequest)
export async function POST(request: NextRequest)
```

#### **`/api/exercises/[id]`**
```typescript
// GET - Buscar exercício específico
// PUT - Atualizar exercício
// DELETE - Deletar exercício
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> })
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> })
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> })
```

#### **`/api/prescriptions`**
```typescript
// GET - Listar prescrições com filtros
// POST - Criar nova prescrição
export async function GET(request: NextRequest)
export async function POST(request: NextRequest)
```

#### **`/api/prescriptions/[id]`**
```typescript
// GET - Buscar prescrição específica
// PUT - Atualizar prescrição
// DELETE - Deletar prescrição
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> })
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> })
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> })
```

#### **`/api/prescriptions/[id]/executions`**
```typescript
// GET - Histórico de execuções
// POST - Registrar nova execução
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> })
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> })
```

### **4. Hooks Customizados**

#### **`useExercises`** (`src/hooks/useExercises.ts`)
```typescript
export function useExercises(initialFilters?: ExerciseFilters) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchExercises = async (filters?: ExerciseFilters) => Promise<void>
  const createExercise = async (data: CreateExerciseDto) => Promise<Exercise>
  const updateExercise = async (id: string, data: UpdateExerciseDto) => Promise<Exercise>
  const deleteExercise = async (id: string) => Promise<void>
  
  return { exercises, loading, error, fetchExercises, createExercise, updateExercise, deleteExercise }
}
```

#### **`usePrescriptions`** (`src/hooks/usePrescriptions.ts`)
```typescript
export function usePrescriptions(initialFilters?: PrescriptionFilters) {
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPrescriptions = async (filters?: PrescriptionFilters) => Promise<void>
  const createPrescription = async (data: CreatePrescriptionDto) => Promise<ExercisePrescription>
  const updatePrescription = async (id: string, data: UpdatePrescriptionDto) => Promise<ExercisePrescription>
  const deactivatePrescription = async (id: string) => Promise<ExercisePrescription>
  
  return { prescriptions, loading, error, fetchPrescriptions, createPrescription, updatePrescription, deactivatePrescription }
}
```

### **5. Interfaces TypeScript**

#### **`src/types/exercise.ts`**
```typescript
export interface CreateExerciseDto {
  name: string
  category: ExerciseCategory
  bodyRegion: BodyRegion[]
  description: string
  instructions: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  difficulty: number
  equipment: string[]
  isPublic: boolean
  tags: string[]
}

export interface UpdateExerciseDto extends Partial<CreateExerciseDto> {}

export interface ExerciseFilters {
  category?: ExerciseCategory
  bodyRegion?: BodyRegion[]
  difficulty?: { min: number; max: number }
  search?: string
  isPublic?: boolean
}
```

#### **`src/types/prescription.ts`**
```typescript
export interface CreatePrescriptionDto {
  patientId: string
  exerciseId: string
  therapistId: string
  sets?: number
  repetitions?: number
  holdTime?: number
  restTime?: number
  frequency: string
  startDate: Date
  endDate?: Date
}

export interface UpdatePrescriptionDto extends Partial<CreatePrescriptionDto> {}

export interface CreateExecutionDto {
  prescriptionId: string
  setsCompleted?: number
  repsCompleted?: number
  painLevel?: number
  difficulty?: number
  notes?: string
}
```

### **6. Páginas de Interface**

#### **`/therapist/exercises`** - Lista de Exercícios
- Tabela com filtros por categoria, região corporal, dificuldade
- Botão para criar novo exercício
- Ações: editar, deletar, visualizar

#### **`/therapist/exercises/new`** - Criar Exercício
- Formulário completo com todos os campos
- Upload de vídeo e thumbnail
- Seleção de categoria e regiões corporais
- Tags e equipamentos

#### **`/therapist/exercises/[id]`** - Visualizar/Editar Exercício
- Visualização completa do exercício
- Formulário de edição
- Histórico de prescrições

#### **`/therapist/prescriptions`** - Lista de Prescrições
- Tabela com filtros por paciente, exercício, status
- Botão para criar nova prescrição
- Ações: editar, desativar, visualizar progresso

#### **`/therapist/prescriptions/new`** - Criar Prescrição
- Seleção de paciente
- Seleção de exercício
- Configuração de parâmetros (sets, reps, etc.)
- Definição de frequência e período

#### **`/therapist/prescriptions/[id]`** - Visualizar Prescrição
- Detalhes da prescrição
- Histórico de execuções
- Gráficos de progresso
- Formulário para registrar execução

---

## 🔧 **IMPLEMENTAÇÃO PASSO A PASSO**

### **Passo 1: Services**
1. Criar `src/services/exercise/exerciseService.ts`
2. Criar `src/services/prescription/prescriptionService.ts`
3. Implementar todos os métodos estáticos

### **Passo 2: Types**
1. Criar `src/types/exercise.ts`
2. Criar `src/types/prescription.ts`
3. Definir todas as interfaces e DTOs

### **Passo 3: API Routes**
1. Criar todas as rotas da API
2. Implementar validação com Zod
3. Implementar controle de acesso por roles
4. Tratamento de erros consistente

### **Passo 4: Hooks**
1. Criar `src/hooks/useExercises.ts`
2. Criar `src/hooks/usePrescriptions.ts`
3. Implementar gerenciamento de estado

### **Passo 5: Páginas**
1. Criar todas as páginas de interface
2. Implementar formulários com validação
3. Implementar tabelas com filtros
4. Implementar upload de arquivos

### **Passo 6: Testes**
1. Testar todas as funcionalidades
2. Verificar build sem erros
3. Testar upload de arquivos
4. Verificar responsividade

---

## 📱 **FUNCIONALIDADES ESPECIAIS**

### **Upload de Mídia**
- Suporte para vídeos MP4, WebM
- Suporte para imagens JPG, PNG, WebP
- Validação de tamanho e formato
- Armazenamento em pasta pública ou serviço de CDN

### **Sistema de Filtros**
- Filtros por categoria de exercício
- Filtros por região corporal
- Filtros por dificuldade
- Busca por texto (nome, descrição, tags)
- Filtros combinados

### **Relatórios de Progresso**
- Gráficos de evolução
- Estatísticas de aderência
- Histórico de execuções
- Análise de dor e dificuldade

---

## 🎨 **DESIGN E UX**

### **Padrões a Seguir**
- Usar componentes shadcn/ui existentes
- Manter consistência com páginas já criadas
- Implementar loading states
- Tratamento de erros amigável
- Responsividade mobile-first

### **Componentes Necessários**
- Tabelas com paginação
- Formulários com validação
- Modais de confirmação
- Upload de arquivos
- Filtros avançados
- Gráficos de progresso

---

## 🧪 **TESTES E VALIDAÇÃO**

### **Validação de Dados**
- Todos os inputs com Zod
- Validação de arquivos de upload
- Sanitização de dados
- Tratamento de erros de validação

### **Controle de Acesso**
- Apenas fisioterapeutas podem criar exercícios
- Apenas fisioterapeutas podem prescrever
- Pacientes só veem suas prescrições
- Admin tem acesso total

---

## 📝 **NOTAS IMPORTANTES**

1. **Seguir padrões existentes** - Use a mesma estrutura dos services já criados
2. **Validação consistente** - Use Zod em todas as APIs
3. **Tratamento de erros** - Implemente try/catch em todos os métodos
4. **Logs de auditoria** - Registre todas as operações importantes
5. **Performance** - Use índices do banco e paginação
6. **Segurança** - Valide uploads e sanitize dados

---

## 🚀 **PRÓXIMOS PASSOS APÓS PROMPT 5**

1. **PROMPT 6:** Sistema de IA com RAG
2. **PROMPT 7:** Portal do Paciente
3. **PROMPT 8:** Sistema de Parcerias
4. **PROMPT 9:** Sistema Financeiro
5. **PROMPT 10:** Deploy e Otimizações

---

*Implemente seguindo os padrões estabelecidos e mantenha a qualidade do código! 🎯*
