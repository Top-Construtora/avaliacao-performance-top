export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  active: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN';
  department_id?: string;
  admission_date?: string;
  position_start_date?: string;
  intern_level?: string;
  
  // Campos de trilha/salário (opcionais)
  current_track_position_id?: string;
  current_salary_level_id?: string;
  current_salary?: number;
  track_id?: string;
  position_id?: string;
  
  // Relacionamentos (opcionais, preenchidos em algumas queries)
  department?: Department;
  teams?: Team[];
  managed_teams?: Team[];
  managed_department?: Department;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  responsible_id?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  responsible?: User;
}

export interface Team {
  id: string;
  name: string;
  department_id?: string;
  responsible_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  department?: Department;
  responsible?: User;
  members?: User[];
}

// Helper para determinar o "role" baseado nos booleans
export function getUserRole(user: User): 'admin' | 'director' | 'leader' | 'employee' {
  // Admin é um caso especial - diretor com email específico
  if (user.email === 'admin@empresa.com' && user.is_director) {
    return 'admin';
  }
  
  if (user.is_director) {
    return 'director';
  }
  
  if (user.is_leader) {
    return 'leader';
  }
  
  return 'employee';
}

// Helper para verificar permissões
export function hasPermission(user: User, permission: string): boolean {
  const role = getUserRole(user);
  
  const permissions: Record<string, string[]> = {
    admin: ['*'], // Acesso total
    director: [
      'users.manage',
      'departments.manage',
      'teams.manage',
      'evaluations.manage',
      'reports.view',
      'salary.manage'
    ],
    leader: [
      'teams.view',
      'teams.manage_own',
      'evaluations.create',
      'evaluations.view_team',
      'reports.view_team'
    ],
    employee: [
      'profile.view_own',
      'profile.edit_own',
      'evaluations.view_own',
      'evaluations.create_self'
    ]
  };
  
  const userPermissions = permissions[role] || [];
  
  // Admin tem acesso a tudo
  if (userPermissions.includes('*')) {
    return true;
  }
  
  return userPermissions.includes(permission);
}

// Types para requisições de login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  profile?: User;
}

// Types para atualização de usuário
export interface UpdateUserRequest {
  name?: string;
  position?: string;
  phone?: string;
  birth_date?: string;
  profile_image?: string;
  department_id?: string;
  is_leader?: boolean;
  is_director?: boolean;
  active?: boolean;
}

// Enum para tipos de contrato
export enum ContractType {
  CLT = 'CLT',
  PJ = 'PJ',
  INTERN = 'INTERN'
}

// Type guards
export function isDirector(user: User): boolean {
  return user.is_director === true;
}

export function isLeader(user: User): boolean {
  return user.is_leader === true;
}

export function isActive(user: User): boolean {
  return user.active === true;
}

export function canManageUsers(user: User): boolean {
  return isDirector(user);
}

export function canManageTeams(user: User): boolean {
  return isDirector(user) || isLeader(user);
}