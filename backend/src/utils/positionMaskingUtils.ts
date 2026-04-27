// backend/src/utils/positionMaskingUtils.ts
//
// Mascaramento de cargo para usuários marcados como
// position_is_confidential. A regra é a mesma usada na view
// users_safe (banco), replicada aqui porque o backend lê com
// supabaseAdmin (service_role), que bypassa RLS e a view.
//
// Quem vê o cargo cru:
//   - próprio usuário
//   - admin
//   - diretor
//   - líder direto (target.reports_to === viewer.id)
//   - quando target.position_is_confidential = false (todos)
//
// Quando o viewer NÃO pode ver, position vira:
//   "<cargo-base> de <time-ou-departamento>"
//   ex.: "Especialista de Projetos", "Analista de Inovações"
//
// Cargo-base é resolvido nesta ordem:
//   1) job_positions.name (via users.position_id)
//   2) users.position com sufixo de senioridade removido
//   3) "Colaborador" (fallback)
//
// Área é resolvida nesta ordem:
//   1) primeiro time do usuário (team_members → teams)
//   2) departments.name
//   3) sem área (apenas o cargo-base)

import { supabaseAdmin } from '../config/supabase';

export interface ViewerContext {
  id: string;
  is_admin?: boolean;
  is_director?: boolean;
}

export interface MaskingTarget {
  id: string;
  position?: string | null;
  position_is_confidential?: boolean | null;
  position_id?: string | null;
  department_id?: string | null;
  reports_to?: string | null;
}

const SENIORITY_SUFFIX_RE =
  /\s*[-]?\s*(M[DCLXVI]+|[IVX]+|\d+|Jr\.?|Pl\.?|Sr\.?|J[uú]nior|Pleno|S[eê]nior)\s*$/i;

export function stripPositionSeniority(position: string | null | undefined): string {
  if (!position) return '';
  return position.replace(SENIORITY_SUFFIX_RE, '').trim();
}

export function canViewPosition(viewer: ViewerContext | null | undefined, target: MaskingTarget): boolean {
  if (!target.position_is_confidential) return true;
  if (!viewer) return false;
  if (viewer.id === target.id) return true;
  if (viewer.is_admin) return true;
  if (viewer.is_director) return true;
  if (target.reports_to && target.reports_to === viewer.id) return true;
  return false;
}

export function buildMaskedPosition(
  target: MaskingTarget,
  jobPositionName: string | null | undefined,
  teamName: string | null | undefined,
  departmentName: string | null | undefined
): string {
  const baseRole =
    (jobPositionName && jobPositionName.trim()) ||
    stripPositionSeniority(target.position) ||
    '';
  const area = (teamName && teamName.trim()) || (departmentName && departmentName.trim()) || '';

  if (!baseRole && !area) return 'Colaborador';
  if (!baseRole) return `Colaborador de ${area}`;
  if (!area) return baseRole;
  return `${baseRole} de ${area}`;
}

interface MaskingLookups {
  jobPositionNameById: Map<string, string>;
  departmentNameById: Map<string, string>;
  firstTeamNameByUserId: Map<string, string>;
}

async function loadLookups(targets: MaskingTarget[]): Promise<MaskingLookups> {
  const positionIds = Array.from(
    new Set(targets.map(t => t.position_id).filter((v): v is string => !!v))
  );
  const departmentIds = Array.from(
    new Set(targets.map(t => t.department_id).filter((v): v is string => !!v))
  );
  const userIds = targets.map(t => t.id);

  const [positionsRes, departmentsRes, teamMembersRes] = await Promise.all([
    positionIds.length > 0
      ? supabaseAdmin.from('job_positions').select('id, name').in('id', positionIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
    departmentIds.length > 0
      ? supabaseAdmin.from('departments').select('id, name').in('id', departmentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
    userIds.length > 0
      ? supabaseAdmin
          .from('team_members')
          .select('user_id, created_at, team:teams!team_id(id, name)')
          .in('user_id', userIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  const jobPositionNameById = new Map<string, string>();
  for (const p of (positionsRes.data ?? []) as Array<{ id: string; name: string }>) {
    if (p?.id && p?.name) jobPositionNameById.set(p.id, p.name);
  }

  const departmentNameById = new Map<string, string>();
  for (const d of (departmentsRes.data ?? []) as Array<{ id: string; name: string }>) {
    if (d?.id && d?.name) departmentNameById.set(d.id, d.name);
  }

  // Como o select já vem ordenado por created_at asc, o primeiro team_member
  // de cada user_id é o "primeiro time" — mantemos só esse.
  const firstTeamNameByUserId = new Map<string, string>();
  for (const tm of (teamMembersRes.data ?? []) as Array<{ user_id: string; team: { name?: string } | { name?: string }[] | null }>) {
    if (firstTeamNameByUserId.has(tm.user_id)) continue;
    const team = Array.isArray(tm.team) ? tm.team[0] : tm.team;
    const name = team?.name;
    if (name) firstTeamNameByUserId.set(tm.user_id, name);
  }

  return { jobPositionNameById, departmentNameById, firstTeamNameByUserId };
}

/**
 * Aplica mascaramento de cargo a uma lista de usuários.
 * Substitui `position` por uma string mascarada quando:
 *   - target.position_is_confidential = true E
 *   - viewer não é admin/diretor/próprio/líder direto.
 *
 * Não modifica os objetos originais — devolve cópias rasas.
 */
export async function applyPositionMasking<T extends MaskingTarget>(
  viewer: ViewerContext | null | undefined,
  users: T[]
): Promise<T[]> {
  if (!Array.isArray(users) || users.length === 0) return users;

  const targetsToMask = users.filter(u => !canViewPosition(viewer, u));
  if (targetsToMask.length === 0) return users;

  const lookups = await loadLookups(targetsToMask);

  return users.map(u => {
    if (canViewPosition(viewer, u)) return u;
    const masked = buildMaskedPosition(
      u,
      u.position_id ? lookups.jobPositionNameById.get(u.position_id) : null,
      lookups.firstTeamNameByUserId.get(u.id),
      u.department_id ? lookups.departmentNameById.get(u.department_id) : null
    );
    return { ...u, position: masked };
  });
}

/**
 * Versão para um único alvo. Útil em getUserById e similares.
 */
export async function applyPositionMaskingToOne<T extends MaskingTarget>(
  viewer: ViewerContext | null | undefined,
  user: T | null | undefined
): Promise<T | null | undefined> {
  if (!user) return user;
  if (canViewPosition(viewer, user)) return user;
  const result = await applyPositionMasking(viewer, [user]);
  return result[0];
}
