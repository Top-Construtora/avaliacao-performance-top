// src/services/supabase.service.ts
import { departmentService } from './department.service';
import { userService } from './user.service';
import { teamService } from './team.service';
import { dataCacheService } from './dataCache.service';
import type {
  Department,
  DepartmentInsert,
  DepartmentUpdate,
  User,
  UserUpdate,
  Team,
  TeamInsert,
  TeamUpdate,
  UserWithDetails,
  TeamWithDetails,
  DepartmentWithDetails,
} from '../types/supabase';

// ====================================
// DEPARTMENTS SERVICE
// ====================================
export const departmentsService = {
  // Listar todos os departamentos
  async getAll(): Promise<DepartmentWithDetails[]> {
    try {
      // Usar cache centralizado
      const { departments, teams: allTeams, users: allUsers } = await dataCacheService.getAll();

      // Criar mapa de usuários para lookup rápido
      const usersMap = new Map(allUsers.map(u => [u.id, u]));

      // Mapear departamentos com detalhes
      const departmentsWithDetails = (departments || []).map((dept) => {
        // Buscar responsável do mapa
        const responsible = dept.responsible_id ? usersMap.get(dept.responsible_id) || null : null;

        // Filtrar times deste departamento
        const teams = allTeams.filter(t => t.department_id === dept.id);

        // Contar membros (usuários com department_id igual)
        const member_count = allUsers.filter(u => u.department_id === dept.id).length;

        return {
          ...dept,
          responsible,
          teams: teams || [],
          member_count: member_count || 0,
        } as DepartmentWithDetails;
      });

      return departmentsWithDetails;
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  },

  // Buscar departamento por ID
  async getById(id: string): Promise<DepartmentWithDetails | null> {
    try {
      const { departments, teams: allTeams, users: allUsers } = await dataCacheService.getAll();

      const data = departments.find(d => d.id === id);
      if (!data) return null;

      const usersMap = new Map(allUsers.map(u => [u.id, u]));
      const responsible = data.responsible_id ? usersMap.get(data.responsible_id) || null : null;
      const teams = allTeams.filter(t => t.department_id === id);

      return {
        ...data,
        responsible,
        teams: teams || [],
      };
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      return null;
    }
  },

  // Criar departamento
  async create(department: DepartmentInsert): Promise<Department> {
    const result = await departmentService.create(department);
    dataCacheService.invalidate();
    return result;
  },

  // Atualizar departamento
  async update(id: string, department: DepartmentUpdate): Promise<Department> {
    const result = await departmentService.update(id, department);
    dataCacheService.invalidate();
    return result;
  },

  // Deletar departamento
  async delete(id: string): Promise<void> {
    await departmentService.delete(id);
    dataCacheService.invalidate();
  },
};

// ====================================
// USERS SERVICE
// ====================================
export const usersService = {
  // Listar todos os usuários
  async getAll(): Promise<UserWithDetails[]> {
    try {
      // Usar cache centralizado - UMA única chamada
      const { users, teams, departments, teamMembers: allTeamMembers } = await dataCacheService.getAll();

      // Criar mapas para lookup rápido
      const usersMap = new Map(users.map(u => [u.id, u]));
      const departmentsMap = new Map(departments.map(d => [d.id, d]));
      const teamsMap = new Map(teams.map(t => [t.id, t]));

      // Criar mapa de times por usuário usando dados batch
      const userTeamsMap = new Map<string, Team[]>();
      allTeamMembers.forEach(({ team_id, user }) => {
        if (user && user.id) {
          const currentTeams = userTeamsMap.get(user.id) || [];
          const team = teamsMap.get(team_id);
          if (team) {
            currentTeams.push(team);
            userTeamsMap.set(user.id, currentTeams);
          }
        }
      });

      // Converter para UserWithDetails
      const usersWithDetails = (users || []).map(user => {
        // Buscar manager do mapa
        const manager = user.manager_id ? usersMap.get(user.manager_id) || null : null;

        // Buscar times do usuário do mapa
        const userTeams = userTeamsMap.get(user.id) || [];

        // Buscar departamento do usuário
        const userDepartment = user.department_id ? departmentsMap.get(user.department_id) || null : null;

        // Buscar liderados diretos
        const direct_reports = users.filter(u => u.manager_id === user.id);

        return {
          ...user,
          manager,
          teams: userTeams,
          departments: userDepartment ? [userDepartment] : [],
          direct_reports,
          // Manter os dados de trilha e nível salarial que vêm do backend
          track: (user as any).track || null,
          track_position: (user as any).track_position || null,
          salary_level: (user as any).salary_level || null,
        } as UserWithDetails;
      });

      return usersWithDetails;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  // Buscar usuário por ID
  async getById(id: string): Promise<UserWithDetails | null> {
    try {
      const { users, teams, departments, teamMembers } = await dataCacheService.getAll();

      const data = users.find(u => u.id === id);
      if (!data) return null;

      const usersMap = new Map(users.map(u => [u.id, u]));
      const departmentsMap = new Map(departments.map(d => [d.id, d]));
      const teamsMap = new Map(teams.map(t => [t.id, t]));

      // Buscar times do usuário
      const userTeams = teamMembers
        .filter(({ user }) => user && user.id === id)
        .map(({ team_id }) => teamsMap.get(team_id))
        .filter(Boolean) as Team[];

      const manager = data.manager_id ? usersMap.get(data.manager_id) || null : null;
      const userDepartment = data.department_id ? departmentsMap.get(data.department_id) || null : null;
      const direct_reports = users.filter(u => u.manager_id === id);

      return {
        ...data,
        manager,
        teams: userTeams,
        departments: userDepartment ? [userDepartment] : [],
        direct_reports,
      } as UserWithDetails;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },

  // Atualizar usuário
  async update(id: string, user: UserUpdate): Promise<User> {
    const result = await userService.updateUser(id, user);
    dataCacheService.invalidate();
    return result;
  },

  // Desativar usuário
  async deactivate(id: string): Promise<void> {
    await userService.updateUser(id, { active: false });
    dataCacheService.invalidate();
  },

  // Reativar usuário
  async activate(id: string): Promise<void> {
    await userService.updateUser(id, { active: true });
    dataCacheService.invalidate();
  },

  // Deletar usuário
  async delete(id: string): Promise<void> {
    await userService.deleteUser(id);
    dataCacheService.invalidate();
  },

  // Buscar líderes
  async getLeaders(): Promise<User[]> {
    const { users } = await dataCacheService.getAll();
    return users.filter(u => u.is_leader);
  },
};

// ====================================
// TEAMS SERVICE
// ====================================
export const teamsService = {
  // Listar todos os times
  async getAll(): Promise<TeamWithDetails[]> {
    try {
      // Usar cache centralizado - UMA única chamada
      const { teams, departments, users: allUsers, teamMembers: allTeamMembers } = await dataCacheService.getAll();

      // Criar mapas para lookup rápido
      const departmentsMap = new Map(departments.map(d => [d.id, d]));
      const usersMap = new Map(allUsers.map(u => [u.id, u]));

      // Criar mapa de membros por time usando dados batch
      const membersMap = new Map<string, User[]>();
      allTeamMembers.forEach(({ team_id, user }) => {
        if (user) {
          const currentMembers = membersMap.get(team_id) || [];
          currentMembers.push(user);
          membersMap.set(team_id, currentMembers);
        }
      });

      // Mapear times com detalhes
      const teamsWithDetails = (teams || []).map((team) => {
        const department = team.department_id ? departmentsMap.get(team.department_id) || null : null;
        const responsible = team.responsible_id ? usersMap.get(team.responsible_id) || null : null;
        const members = membersMap.get(team.id) || [];

        return {
          ...team,
          department,
          responsible,
          members,
        } as TeamWithDetails;
      });

      return teamsWithDetails;
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
  },

  // Buscar time por ID
  async getById(id: string): Promise<TeamWithDetails | null> {
    try {
      const { teams, departments, users: allUsers, teamMembers } = await dataCacheService.getAll();

      const data = teams.find(t => t.id === id);
      if (!data) return null;

      const departmentsMap = new Map(departments.map(d => [d.id, d]));
      const usersMap = new Map(allUsers.map(u => [u.id, u]));

      const department = data.department_id ? departmentsMap.get(data.department_id) || null : null;
      const responsible = data.responsible_id ? usersMap.get(data.responsible_id) || null : null;
      const members = teamMembers
        .filter(({ team_id }) => team_id === id)
        .map(({ user }) => user)
        .filter(Boolean);

      return {
        ...data,
        department,
        responsible,
        members,
      };
    } catch (error) {
      console.error('Erro ao buscar time:', error);
      return null;
    }
  },

  // Criar time
  async create(team: TeamInsert): Promise<Team> {
    const result = await teamService.create(team);
    dataCacheService.invalidate();
    return result;
  },

  // Atualizar time
  async update(id: string, team: TeamUpdate): Promise<Team> {
    const result = await teamService.update(id, team);
    dataCacheService.invalidate();
    return result;
  },

  // Deletar time
  async delete(id: string): Promise<void> {
    await teamService.delete(id);
    dataCacheService.invalidate();
  },

  // Adicionar membro ao time
  async addMember(teamId: string, userId: string): Promise<void> {
    await teamService.addMember(teamId, userId);
    dataCacheService.invalidate();
  },

  // Remover membro do time
  async removeMember(teamId: string, userId: string): Promise<void> {
    await teamService.removeMember(teamId, userId);
    dataCacheService.invalidate();
  },

  // Substituir todos os membros do time
  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    await teamService.replaceMembers(teamId, userIds);
    dataCacheService.invalidate();
  },
};

// ====================================
// HELPERS
// ====================================
export const supabaseHelpers = {
  // Buscar usuários por time
  async getUsersByTeam(teamId: string): Promise<User[]> {
    const { teamMembers } = await dataCacheService.getAll();
    return teamMembers
      .filter(({ team_id }) => team_id === teamId)
      .map(({ user }) => user)
      .filter(Boolean);
  },

  // Buscar times de um usuário
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const { teams, teamMembers } = await dataCacheService.getAll();

      // Encontrar team_ids onde o usuário é membro
      const userTeamIds = new Set(
        teamMembers
          .filter(({ user }) => user && user.id === userId)
          .map(({ team_id }) => team_id)
      );

      // Filtrar times
      return teams.filter(team => userTeamIds.has(team.id));
    } catch (error) {
      console.error('Erro ao buscar times do usuário:', error);
      return [];
    }
  },

  // Verificar se usuário é responsável por algum time/departamento
  async isUserResponsible(userId: string): Promise<boolean> {
    const { teams, departments } = await dataCacheService.getAll();

    const isTeamResponsible = teams.some(t => t.responsible_id === userId);
    const isDeptResponsible = departments.some(d => d.responsible_id === userId);

    return isTeamResponsible || isDeptResponsible;
  },

  // Invalidar cache manualmente
  invalidateCache(): void {
    dataCacheService.invalidate();
  },

  // Recarregar cache
  async reloadCache(): Promise<void> {
    await dataCacheService.reload();
  },
};
