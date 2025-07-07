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

  // Funções de verificação de permissão
  const permissions = useMemo(() => ({
    // Verificar permissão específica
    hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
      if (!user || !profile?.active) return false;
      return checkPermission(role as UserRole, resource, action);
    },

    // Verificações rápidas
    canCreateUser: () => isDirector,
    canEditUser: (userId: string) => {
      if (isDirector) return true;
      if (isLeader && profile?.reports_to === userId) return true;
      return userId === user?.id;
    },
    canDeactivateUser: () => isDirector,
    canCreateTeam: () => isDirector || isLeader,
    canEditTeam: (teamId: string, responsibleId?: string) => {
      if (isDirector) return true;
      return isLeader && responsibleId === user?.id;
    },
    canDeleteTeam: () => isDirector,
    
    canCreateDepartment: () => isDirector,
    canEditDepartment: () => isDirector,
    canDeleteDepartment: () => isDirector,
    
    canViewReports: () => isDirector,
    canViewAuditLogs: () => isDirector,
    canAccessConsensus: () => isDirector,
    canAccessNineBox: () => isDirector,
    
    canEvaluateUser: (userId: string) => {
      if (userId === user?.id) return true; // Autoavaliação
      if (isDirector) return true;
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
  }), [user, profile, role, isDirector, isLeader]);

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

  return {
    // Navegação
    showSelfEvaluation: !isDirector && profile?.active,
    showLeaderEvaluation: (isLeader || isDirector) && profile?.active,
    showPotentialEvaluation: (isLeader || isDirector) && profile?.active,
    showConsensus: isDirector && profile?.active,
    showNineBox: isDirector && profile?.active,
    showActionPlan: isDirector && profile?.active,
    showReports: isDirector && profile?.active,
    showUserManagement: isDirector && profile?.active,
    
    // Ações
    showCreateUserButton: isDirector,
    showCreateTeamButton: isDirector || isLeader,
    showCreateDepartmentButton: isDirector,
    showExportButton: isDirector || isLeader,
    showBulkActionsButton: isDirector,
    
    // Informações sensíveis
    showSalaryInfo: isDirector,
    showFullContactInfo: isDirector || isLeader,
    showAuditLogs: isDirector,
    showSystemSettings: isDirector,
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