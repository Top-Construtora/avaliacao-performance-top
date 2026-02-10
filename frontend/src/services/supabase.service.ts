// src/services/supabase.service.ts
import { departmentService } from './department.service';
import { userService } from './user.service';
import { teamService } from './team.service';
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
      const departments = await departmentService.getAll();

      // Buscar dados relacionados separadamente
      const departmentsWithDetails = await Promise.all(
        (departments || []).map(async (dept) => {
          // Buscar responsável
          let responsible = null;
          if (dept.responsible_id) {
            responsible = await userService.getUserById(dept.responsible_id);
          }

          // Buscar times
          const allTeams = await teamService.getAll();
          const teams = allTeams.filter(t => t.department_id === dept.id);

          // Contar membros ativos
          const allUsers = await userService.getUsers({ active: true });
          const member_count = allUsers.length;

          return {
            ...dept,
            responsible,
            teams: teams || [],
            member_count: member_count || 0,
          } as DepartmentWithDetails;
        })
      );

      return departmentsWithDetails;
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  },

  // Buscar departamento por ID
  async getById(id: string): Promise<DepartmentWithDetails | null> {
    const data = await departmentService.getById(id);
    if (!data) return null;

    // Buscar responsável
    let responsible = null;
    if (data.responsible_id) {
      responsible = await userService.getUserById(data.responsible_id);
    }

    // Buscar times
    const allTeams = await teamService.getAll();
    const teams = allTeams.filter(t => t.department_id === id);

    return {
      ...data,
      responsible,
      teams: teams || [],
    };
  },

  // Criar departamento
  async create(department: DepartmentInsert): Promise<Department> {
    return await departmentService.create(department);
  },

  // Atualizar departamento
  async update(id: string, department: DepartmentUpdate): Promise<Department> {
    return await departmentService.update(id, department);
  },

  // Deletar departamento
  async delete(id: string): Promise<void> {
    await departmentService.delete(id);
  },
};

// ====================================
// USERS SERVICE
// ====================================
export const usersService = {
  // Listar todos os usuários
  async getAll(): Promise<UserWithDetails[]> {
    try {
      const users = await userService.getUsers();

      // Converter para UserWithDetails
      const usersWithDetails = (users || []).map(user => ({
        ...user,
        manager: null, // Carregar sob demanda
        teams: [], // Carregar sob demanda
        direct_reports: [], // Carregar sob demanda
        track: null,
        track_position: null,
        salary_level: null,
      } as UserWithDetails));

      return usersWithDetails;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  // Buscar usuário por ID
  async getById(id: string): Promise<UserWithDetails | null> {
    try {
      const data = await userService.getUserById(id);
      if (!data) return null;

      return {
        ...data,
        manager: null,
        teams: [],
        direct_reports: [],
      } as UserWithDetails;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },

  // Atualizar usuário
  async update(id: string, user: UserUpdate): Promise<User> {
    return await userService.updateUser(id, user);
  },

  // Desativar usuário
  async deactivate(id: string): Promise<void> {
    await userService.updateUser(id, { active: false });
  },

  // Reativar usuário
  async activate(id: string): Promise<void> {
    await userService.updateUser(id, { active: true });
  },

  // Deletar usuário
  async delete(id: string): Promise<void> {
    await userService.deleteUser(id);
  },

  // Buscar líderes
  async getLeaders(): Promise<User[]> {
    return await userService.getUsers({ is_leader: true });
  },
};

// ====================================
// TEAMS SERVICE
// ====================================
export const teamsService = {
  // Listar todos os times
  async getAll(): Promise<TeamWithDetails[]> {
    try {
      const teams = await teamService.getAll();

      // Buscar dados relacionados
      const teamsWithDetails = await Promise.all(
        (teams || []).map(async (team) => {
          // Buscar departamento
          let department = null;
          if (team.department_id) {
            department = await departmentService.getById(team.department_id);
          }

          // Buscar responsável
          let responsible = null;
          if (team.responsible_id) {
            responsible = await userService.getUserById(team.responsible_id);
          }

          // Buscar membros
          const members = await teamService.getMembers(team.id);

          return {
            ...team,
            department,
            responsible,
            members,
          } as TeamWithDetails;
        })
      );

      return teamsWithDetails;
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
  },

  // Buscar time por ID
  async getById(id: string): Promise<TeamWithDetails | null> {
    try {
      const data = await teamService.getById(id);
      if (!data) return null;

      // Buscar departamento
      let department = null;
      if (data.department_id) {
        department = await departmentService.getById(data.department_id);
      }

      // Buscar responsável
      let responsible = null;
      if (data.responsible_id) {
        responsible = await userService.getUserById(data.responsible_id);
      }

      // Buscar membros
      const members = await teamService.getMembers(id);

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
    return await teamService.create(team);
  },

  // Atualizar time
  async update(id: string, team: TeamUpdate): Promise<Team> {
    return await teamService.update(id, team);
  },

  // Deletar time
  async delete(id: string): Promise<void> {
    await teamService.delete(id);
  },

  // Adicionar membro ao time
  async addMember(teamId: string, userId: string): Promise<void> {
    await teamService.addMember(teamId, userId);
  },

  // Remover membro do time
  async removeMember(teamId: string, userId: string): Promise<void> {
    await teamService.removeMember(teamId, userId);
  },

  // Substituir todos os membros do time
  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    await teamService.replaceMembers(teamId, userIds);
  },
};

// ====================================
// HELPERS
// ====================================
export const supabaseHelpers = {
  // Buscar usuários por time
  async getUsersByTeam(teamId: string): Promise<User[]> {
    return await teamService.getMembers(teamId);
  },

  // Buscar times de um usuário
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const allTeams = await teamService.getAll();
      const userTeams: Team[] = [];

      for (const team of allTeams) {
        const members = await teamService.getMembers(team.id);
        if (members.some(m => m.id === userId)) {
          userTeams.push(team);
        }
      }

      return userTeams;
    } catch (error) {
      console.error('Erro ao buscar times do usuário:', error);
      return [];
    }
  },

  // Verificar se usuário é responsável por algum time/departamento
  async isUserResponsible(userId: string): Promise<boolean> {
    const teams = await teamService.getAll();
    const departments = await departmentService.getAll();

    const isTeamResponsible = teams.some(t => t.responsible_id === userId);
    const isDeptResponsible = departments.some(d => d.responsible_id === userId);

    return isTeamResponsible || isDeptResponsible;
  },
};