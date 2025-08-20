import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

export function useAuth() {
  const { data: session, status } = useSession()
  
  const hasRole = (role: Role) => {
    return session?.user?.role === role
  }
  
  const canAccess = (roles: Role[]) => {
    return roles.includes(session?.user?.role as Role)
  }

  const isAdmin = () => hasRole(Role.ADMIN)
  const isTherapist = () => hasRole(Role.FISIOTERAPEUTA)
  const isIntern = () => hasRole(Role.ESTAGIARIO)
  const isPatient = () => hasRole(Role.PACIENTE)
  const isPartner = () => hasRole(Role.PARCEIRO)

  const canManageUsers = () => isAdmin()
  const canManagePatients = () => canAccess([Role.ADMIN, Role.FISIOTERAPEUTA, Role.ESTAGIARIO])
  const canManageAppointments = () => canAccess([Role.ADMIN, Role.FISIOTERAPEUTA])
  const canViewReports = () => canAccess([Role.ADMIN, Role.FISIOTERAPEUTA])
  const canManageExercises = () => canAccess([Role.ADMIN, Role.FISIOTERAPEUTA, Role.PARCEIRO])

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    hasRole,
    canAccess,
    
    // Role checks
    isAdmin,
    isTherapist,
    isIntern,
    isPatient,
    isPartner,
    
    // Permission checks
    canManageUsers,
    canManagePatients,
    canManageAppointments,
    canViewReports,
    canManageExercises,
  }
}

// Hook para obter dados específicos do usuário logado
export function useUserProfile() {
  const { user } = useAuth()
  
  return {
    userId: user?.id,
    therapistId: user?.therapistId,
    patientId: user?.patientId,
    partnerId: user?.partnerId,
    crefito: user?.crefito,
    supervisorId: user?.supervisorId,
  }
}
