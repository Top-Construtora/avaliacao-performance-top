import { useMemo } from 'react';
import { useAuth, useUserRole } from '../context/AuthContext';
import { 
  UserRole, 
  hasPermission as checkPermission,
  validateSecurityOperation,
  ROLE_PERMISSIONS
} from '../types/auth';

export function usePermissions() {
  const { user, profile } = useAuth();
  const { role, isDirector, isLeader } = useUserRole();

  const isAdmin = profile?.is_admin === true;

  // Funções de verificação de permissão
  const permissions = useMemo(() => ({
    // Verificar permissão específica
    hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
      if (!user || !profile?.active) return false;
      if (isAdmin) return true; // Admin tem todas as permissões
      return checkPermission(role as UserRole, resource, action);
    },

    // Verificações rápidas
    canCreateUser: () => isAdmin || isDirector,
    canEditUser: (userId: string) => {
      if (isAdmin || isDirector) return true;
      if (isLeader && profile?.reports_to === userId) return true;
      return userId === user?.id;
    },
    canDeactivateUser: () => isAdmin || isDirector,
    canCreateTeam: () => isAdmin || isDirector || isLeader,
    canEditTeam: (teamId: string, responsibleId?: string) => {
      if (isAdmin || isDirector) return true;
      return isLeader && responsibleId === user?.id;
    },
    canDeleteTeam: () => isAdmin || isDirector,

    canCreateDepartment: () => isAdmin || isDirector,
    canEditDepartment: () => isAdmin || isDirector,
    canDeleteDepartment: () => isAdmin || isDirector,

    canViewReports: () => isAdmin || isDirector,
    canViewAuditLogs: () => isAdmin || isDirector,
    canAccessConsensus: () => isAdmin || isDirector,
    canAccessNineBox: () => isAdmin || isDirector,

    canEvaluateUser: (userId: string) => {
      if (userId === user?.id) return true; // Autoavaliação
      if (isAdmin || isDirector) return true;
      return isLeader && profile?.reports_to === userId;
    },

    // Validar operação de segurança
    validateOperation: (operation: string, targetData?: any) => {
      return validateSecurityOperation(operation, role as UserRole, targetData);
    },

    // Obter todas as permissões do usuário
    getAllPermissions: () => {
      return ROLE_PERMISSIONS[role as UserRole] || [];
    },
  }), [user, profile, role, isDirector, isLeader, isAdmin]);

  return permissions;
}

// Hook para verificar acesso a recursos específicos
export function useResourceAccess(resource: string) {
  const permissions = usePermissions();

  return {
    canCreate: permissions.hasPermission(resource, 'create'),
    canRead: permissions.hasPermission(resource, 'read'),
    canUpdate: permissions.hasPermission(resource, 'update'),
    canDelete: permissions.hasPermission(resource, 'delete'),
  };
}

// Hook para controle de visibilidade de elementos UI
export function useUIPermissions() {
  const { isDirector, isLeader, role } = useUserRole();
  const { profile } = useAuth();

  const isAdmin = profile?.is_admin === true;

  return {
    // Navegação
    showSelfEvaluation: !isAdmin && !isDirector && profile?.active,
    showLeaderEvaluation: (isAdmin || isLeader || isDirector) && profile?.active,
    showPotentialEvaluation: (isAdmin || isLeader || isDirector) && profile?.active,
    showConsensus: (isAdmin || isDirector) && profile?.active,
    showNineBox: (isAdmin || isDirector) && profile?.active,
    showActionPlan: (isAdmin || isDirector) && profile?.active,
    showReports: (isAdmin || isDirector) && profile?.active,
    showUserManagement: (isAdmin || isDirector) && profile?.active,

    // Ações
    showCreateUserButton: isAdmin || isDirector,
    showCreateTeamButton: isAdmin || isDirector || isLeader,
    showCreateDepartmentButton: isAdmin || isDirector,
    showExportButton: isAdmin || isDirector || isLeader,
    showBulkActionsButton: isAdmin || isDirector,

    // Informações sensíveis
    showSalaryInfo: isAdmin || isDirector,
    showFullContactInfo: isAdmin || isDirector || isLeader,
    showAuditLogs: isAdmin || isDirector,
    showSystemSettings: isAdmin || isDirector,
  };
}

// Hook para validação de operações antes de executar
export function useOperationValidator() {
  const permissions = usePermissions();
  const { profile } = useAuth();

  return {
    canExecute: (operation: string, targetData?: any): boolean => {
      const validation = permissions.validateOperation(operation, targetData);
      return validation.isValid && profile?.active === true;
    },
    
    getValidationErrors: (operation: string, targetData?: any): string[] => {
      const validation = permissions.validateOperation(operation, targetData);
      return validation.errors;
    },
    
    getValidationWarnings: (operation: string, targetData?: any): string[] => {
      const validation = permissions.validateOperation(operation, targetData);
      return validation.warnings;
    },
  };
}