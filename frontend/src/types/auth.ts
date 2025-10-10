// Tipos relacionados à autenticação e permissões

export type UserRole = 'admin' | 'director' | 'leader' | 'employee';

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
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'consensus', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit_logs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'salary', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'cycles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pdi', actions: ['create', 'read', 'update', 'delete'] },
  ],
  director: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'consensus', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'salary', actions: ['create', 'read', 'update', 'delete'] },
  ],
  leader: [
    { resource: 'users', actions: ['read', 'update'] }, // apenas subordinados
    { resource: 'teams', actions: ['create', 'read', 'update'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // suas avaliações
    { resource: 'reports', actions: ['read'] }, // relatórios limitados
    { resource: 'salary', actions: ['read'] }, // visualizar salários da equipe
  ],
  employee: [
    { resource: 'users', actions: ['read'] }, // apenas próprio perfil
    { resource: 'teams', actions: ['read'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // apenas próprias
    { resource: 'salary', actions: ['read'] }, // apenas próprio salário
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

// Helper para determinar role baseado nos booleans
export function getUserRole(user: { is_admin: boolean; is_director: boolean; is_leader: boolean }): UserRole {
  if (user.is_admin) return 'admin';
  if (user.is_director) return 'director';
  if (user.is_leader) return 'leader';
  return 'employee';
}

// Tipos para controle de acesso em rotas
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
    requireRoles: ['admin', 'employee', 'leader', 'director'],
    requireActive: true
  },
  '/leader-evaluation': {
    requireAuth: true,
    requireRoles: ['admin', 'leader', 'director'],
    requireActive: true
  },
  '/potential-evaluation': {
    requireAuth: true,
    requireRoles: ['admin', 'leader', 'director'],
    requireActive: true
  },
  '/consensus': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/nine-box': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/pdi': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/reports': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/users': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/users/new': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
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
  '/salary': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/salary/tracks': {
    requireAuth: true,
    requireRoles: ['admin', 'director'],
    requireActive: true
  },
  '/salary/progressions': {
    requireAuth: true,
    requireRoles: ['admin', 'director', 'leader'],
    requireActive: true
  }
};

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

  // Admin tem permissão para tudo, sem warnings
  if (userRole === 'admin') {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  // Validações específicas por operação
  switch (operation) {
    case 'promote_to_admin':
      if (userRole !== 'admin') {
        errors.push('Apenas administradores podem promover outros usuários a admin');
      }
      break;

    case 'promote_to_director':
      if (userRole !== 'admin' && userRole !== 'director') {
        errors.push('Apenas administradores e diretores podem promover outros usuários a diretor');
      }
      break;

    case 'deactivate_user':
      if (userRole !== 'admin' && userRole !== 'director') {
        errors.push('Apenas administradores e diretores podem desativar usuários');
      }
      if (targetData?.is_admin) {
        errors.push('Não é possível desativar um administrador');
      }
      if (targetData?.is_director) {
        warnings.push('Você está desativando um diretor. Isso pode afetar o sistema.');
      }
      break;

    case 'delete_department':
      if (userRole !== 'admin' && userRole !== 'director') {
        errors.push('Apenas administradores e diretores podem excluir departamentos');
      }
      if (targetData?.teams_count > 0) {
        warnings.push('Este departamento possui times ativos');
      }
      break;

    case 'change_team_leader':
      if (userRole !== 'admin' && userRole !== 'director' && userRole !== 'leader') {
        errors.push('Apenas administradores, diretores e líderes podem alterar responsáveis de times');
      }
      break;

    case 'modify_salary':
      if (userRole !== 'admin' && userRole !== 'director') {
        errors.push('Apenas administradores e diretores podem modificar salários');
      }
      break;

    case 'approve_progression':
      if (userRole !== 'admin' && userRole !== 'director') {
        errors.push('Apenas administradores e diretores podem aprovar progressões');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Interface para contexto de autenticação
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
    is_director: boolean;
    is_leader: boolean;
    active: boolean;
  };
  role: UserRole;
  permissions: Permission[];
}

// Helper para criar contexto de autenticação
export function createAuthContext(user: any): AuthContext {
  const role = getUserRole(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin,
      is_director: user.is_director,
      is_leader: user.is_leader,
      active: user.active
    },
    role,
    permissions: ROLE_PERMISSIONS[role]
  };
}

// Middleware types
export interface AuthRequest extends Express.Request {
  auth?: AuthContext;
}

// Token payload
export interface TokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  is_admin: boolean;
  is_director: boolean;
  is_leader: boolean;
  iat?: number;
  exp?: number;
}