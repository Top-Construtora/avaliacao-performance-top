// src/services/supabase.service.ts
import { supabase } from '../lib/supabase';
import type {
  Department,
  DepartmentInsert,
  DepartmentUpdate,
  User,
  UserInsert,
  UserUpdate,
  Team,
  TeamInsert,
  TeamUpdate,
  TeamMember,
  TeamMemberInsert,
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
      // Query simplificada sem joins complexos
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;

      // Buscar dados relacionados separadamente
      const departmentsWithDetails = await Promise.all(
        (departments || []).map(async (dept) => {
          // Buscar responsável
          let responsible = null;
          if (dept.responsible_id) {
            const { data: respData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', dept.responsible_id)
              .single();
            responsible = respData;
          }

          // Buscar times
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .eq('department_id', dept.id);

          // Contar membros
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

          return {
            ...dept,
            responsible,
            teams: teams || [],
            member_count: count || 0,
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
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    // Buscar responsável
    let responsible = null;
    if (data.responsible_id) {
      const { data: respData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', data.responsible_id)
        .single();
      responsible = respData;
    }

    // Buscar times
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('department_id', id);

    return {
      ...data,
      responsible,
      teams: teams || [],
    };
  },

  // Criar departamento
  async create(department: DepartmentInsert): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar departamento
  async update(id: string, department: DepartmentUpdate): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update(department)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar departamento
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ====================================
// USERS SERVICE
// ====================================
export const usersService = {
  // Listar todos os usuários
  async getAll(): Promise<UserWithDetails[]> {
    try {
      // Query simplificada
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;

      // Buscar dados relacionados
      const usersWithDetails = await Promise.all(
        (users || []).map(async (user) => {
          // Buscar manager
          let manager = null;
          if (user.reports_to) {
            const { data: managerData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', user.reports_to)
              .single();
            manager = managerData;
          }

          // Buscar times
          const { data: teamMemberships } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id);

          const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
          let teams: Team[] = [];
          
          if (teamIds.length > 0) {
            const { data: teamsData } = await supabase
              .from('teams')
              .select('*')
              .in('id', teamIds);
            teams = teamsData || [];
          }

          // Buscar subordinados
          const { data: directReports } = await supabase
            .from('users')
            .select('id, name, email, position')
            .eq('reports_to', user.id);

          return {
            ...user,
            manager,
            teams,
            direct_reports: directReports || [],
          } as UserWithDetails;
        })
      );

      return usersWithDetails;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  // Buscar usuário por ID
  async getById(id: string): Promise<UserWithDetails | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    // Buscar manager
    let manager = null;
    if (data.reports_to) {
      const { data: managerData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', data.reports_to)
        .single();
      manager = managerData;
    }

    // Buscar times
    const { data: teamMemberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', id);

    const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
    let teams: Team[] = [];
    
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);
      teams = teamsData || [];
    }

    // Buscar subordinados
    const { data: directReports } = await supabase
      .from('users')
      .select('id, name, email, position')
      .eq('reports_to', id);

    return {
      ...data,
      manager,
      teams,
      direct_reports: directReports || [],
    };
  },

  // Atualizar usuário
  async update(id: string, user: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Desativar usuário
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Reativar usuário
  async activate(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ active: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar líderes
  async getLeaders(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_leader', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },
};

// ====================================
// TEAMS SERVICE
// ====================================
export const teamsService = {
  // Listar todos os times
  async getAll(): Promise<TeamWithDetails[]> {
    try {
      // Query simplificada
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;

      // Buscar dados relacionados
      const teamsWithDetails = await Promise.all(
        (teams || []).map(async (team) => {
          // Buscar departamento
          let department = null;
          if (team.department_id) {
            const { data: deptData } = await supabase
              .from('departments')
              .select('*')
              .eq('id', team.department_id)
              .single();
            department = deptData;
          }

          // Buscar responsável
          let responsible = null;
          if (team.responsible_id) {
            const { data: respData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', team.responsible_id)
              .single();
            responsible = respData;
          }

          // Buscar membros
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', team.id);

          const memberIds = teamMembers?.map(tm => tm.user_id) || [];
          let members: any[] = [];
          
          if (memberIds.length > 0) {
            const { data: membersData } = await supabase
              .from('users')
              .select('id, name, email, position, profile_image')
              .in('id', memberIds);
            members = membersData || [];
          }

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
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    // Buscar departamento
    let department = null;
    if (data.department_id) {
      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .eq('id', data.department_id)
        .single();
      department = deptData;
    }

    // Buscar responsável
    let responsible = null;
    if (data.responsible_id) {
      const { data: respData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', data.responsible_id)
        .single();
      responsible = respData;
    }

    // Buscar membros
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', id);

    const memberIds = teamMembers?.map(tm => tm.user_id) || [];
    let members: any[] = [];
    
    if (memberIds.length > 0) {
      const { data: membersData } = await supabase
        .from('users')
        .select('id, name, email, position, profile_image')
        .in('id', memberIds);
      members = membersData || [];
    }

    return {
      ...data,
      department,
      responsible,
      members,
    };
  },

  // Criar time
  async create(team: TeamInsert): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar time
  async update(id: string, team: TeamUpdate): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update(team)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar time
  async delete(id: string): Promise<void> {
    // Primeiro remove todos os membros
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id);

    // Depois deleta o time
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Adicionar membro ao time
  async addMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: userId });

    if (error) throw error;
  },

  // Remover membro do time
  async removeMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Substituir todos os membros do time
  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    // Remove todos os membros atuais
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    // Adiciona os novos membros
    if (userIds.length > 0) {
      const members = userIds.map(userId => ({
        team_id: teamId,
        user_id: userId,
      }));

      const { error } = await supabase
        .from('team_members')
        .insert(members);

      if (error) throw error;
    }
  },
};

// ====================================
// HELPERS
// ====================================
export const supabaseHelpers = {
  // Buscar usuários por time
  async getUsersByTeam(teamId: string): Promise<User[]> {
    const { data } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const userIds = data?.map(tm => tm.user_id) || [];
    
    if (userIds.length === 0) return [];

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
      .order('name');

    return users || [];
  },

  // Buscar times de um usuário
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      // Evitar query direta em team_members se possível
      const { data } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      const teamIds = data?.map(tm => tm.team_id) || [];
      
      if (teamIds.length === 0) return [];

      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('name');

      return teams || [];
    } catch (error) {
      console.error('Erro ao buscar times do usuário:', error);
      return [];
    }
  },

  // Verificar se usuário é responsável por algum time/departamento
  async isUserResponsible(userId: string): Promise<boolean> {
    const { data: teamData } = await supabase
      .from('teams')
      .select('id')
      .eq('responsible_id', userId)
      .limit(1);

    const { data: deptData } = await supabase
      .from('departments')
      .select('id')
      .eq('responsible_id', userId)
      .limit(1);

    return !!(teamData?.length || deptData?.length);
  },
};