// Tipos relacionados à autenticação e permissões

export type UserRole = 'director' | 'leader' | 'collaborator';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
}

// Mapeamento de permissões por papel
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  director: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'consensus', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
  ],
  leader: [
    { resource: 'users', actions: ['read', 'update'] }, // apenas subordinados
    { resource: 'teams', actions: ['create', 'read', 'update'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // suas avaliações
    { resource: 'reports', actions: ['read'] }, // relatórios limitados
  ],
  collaborator: [
    { resource: 'users', actions: ['read'] }, // apenas próprio perfil e colegas
    { resource: 'teams', actions: ['read'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // apenas próprias
  ],
};

// Helper para verificar permissões
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const resourcePermission = permissions.find(p => p.resource === resource);
  return resourcePermission ? resourcePermission.actions.includes(action) : false;
}

// Tipos para controle de acesso em componentes
export interface AccessControl {
  requireAuth: boolean;
  requireRoles?: UserRole[];
  requireActive?: boolean;
  redirectTo?: string;
}

// Configuração de rotas com controle de acesso
export const ROUTE_ACCESS: Record<string, AccessControl> = {
  '/': { requireAuth: true, requireActive: true },
  '/login': { requireAuth: false },
  '/reset-password': { requireAuth: false },
  '/self-evaluation': { 
    requireAuth: true, 
    requireRoles: ['collaborator', 'leader'],
    requireActive: true 
  },
  '/leader-evaluation': { 
    requireAuth: true, 
    requireRoles: ['leader', 'director'],
    requireActive: true 
  },
  '/potential-evaluation': { 
    requireAuth: true, 
    requireRoles: ['leader', 'director'],
    requireActive: true 
  },
  '/consensus': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/nine-box': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/action-plan': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/reports': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/users': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/users/new': { 
    requireAuth: true, 
    requireRoles: ['director'],
    requireActive: true 
  },
  '/notifications': { 
    requireAuth: true,
    requireActive: true 
  },
  '/settings': { 
    requireAuth: true,
    requireActive: true 
  },
};

// Tipos para auditoria
export interface AuditLog {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Tipos para validação de segurança
export interface SecurityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validador de segurança para operações críticas
export function validateSecurityOperation(
  operation: string,
  userRole: UserRole,
  targetData?: any
): SecurityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações específicas por operação
  switch (operation) {
    case 'promote_to_director':
      if (userRole !== 'director') {
        errors.push('Apenas diretores podem promover outros usuários a diretor');
      }
      break;
    
    case 'deactivate_user':
      if (userRole !== 'director') {
        errors.push('Apenas diretores podem desativar usuários');
      }
      if (targetData?.is_director) {
        warnings.push('Você está desativando um diretor. Isso pode afetar o sistema.');
      }
      break;
    
    case 'delete_department':
      if (userRole !== 'director') {
        errors.push('Apenas diretores podem excluir departamentos');
      }
      if (targetData?.teams_count > 0) {
        warnings.push('Este departamento possui times ativos');
      }
      break;
    
    case 'change_team_leader':
      if (userRole !== 'director' && userRole !== 'leader') {
        errors.push('Apenas diretores e líderes podem alterar responsáveis de times');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}