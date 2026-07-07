// Controle de acesso a nível de OBJETO (ownership) para dados sensíveis de RH
// (avaliações, PDI, salário). O backend usa `service_role` (que ignora o RLS),
// então estas checagens são a barreira de autorização de fato — precisam ser
// aplicadas explicitamente nos controllers.
//
// Regra padrão de "dados do colaborador X":
//   - o próprio colaborador           (user.id === employeeId)
//   - admin ou diretor                (veem todos)
//   - líder DIRETO do colaborador     (users.reports_to === user.id)

import { AppError } from '../errors/AppError';

export interface AccessUser {
  id: string;
  is_admin?: boolean;
  is_director?: boolean;
  is_leader?: boolean;
}

/** Admin ou diretor enxergam todos os dados de RH. */
export function isPrivileged(user?: AccessUser | null): boolean {
  return !!(user && ((user as any).is_admin || user.is_director));
}

/** `leaderId` é o líder direto de `employeeId`? (consulta users.reports_to) */
export async function isDirectLeaderOf(
  supabase: any,
  leaderId: string,
  employeeId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('reports_to')
    .eq('id', employeeId)
    .single();
  if (error || !data) return false;
  return data.reports_to === leaderId;
}

/** Pode acessar os dados de RH de `employeeId`? */
export async function canAccessEmployeeData(
  supabase: any,
  user: AccessUser | undefined,
  employeeId: string,
): Promise<boolean> {
  if (!user || !employeeId) return false;
  if (user.id === employeeId) return true;
  if (isPrivileged(user)) return true;
  if (user.is_leader && (await isDirectLeaderOf(supabase, user.id, employeeId))) return true;
  return false;
}

/** Lança 403 se o usuário não puder acessar os dados de `employeeId`. */
export async function assertCanAccessEmployeeData(
  supabase: any,
  user: AccessUser | undefined,
  employeeId: string,
): Promise<void> {
  if (!(await canAccessEmployeeData(supabase, user, employeeId))) {
    throw AppError.forbidden('Você não tem permissão para acessar os dados deste colaborador');
  }
}
