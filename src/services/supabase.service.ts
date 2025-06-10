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
import type {
  TeamMemberWithTeam,
  TeamMemberWithUser,
  DepartmentWithResponsible,
  TeamWithRelations,
  UserWithManager,
} from '../types/supabase-helpers';

// ====================================
// DEPARTMENTS SERVICE
// ====================================
export const departmentsService = {
  // Listar todos os departamentos
  async getAll(): Promise<DepartmentWithDetails[]> {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        responsible:users!departments_responsible_id_fkey(id, name, email),
        teams(id, name)
      `)
      .order('name');

    if (error) throw error;

    // Tipar corretamente o retorno
    const typedData = data as DepartmentWithResponsible[];

    // Contar membros de cada departamento
    const departmentsWithCount = await Promise.all(
      (typedData || []).map(async (dept) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .contains('department_ids', [dept.id]);

        return {
          ...dept,
          member_count: count || 0,
        } as DepartmentWithDetails;
      })
    );

    return departmentsWithCount;
  },

  // Buscar departamento por ID
  async getById(id: string): Promise<DepartmentWithDetails | null> {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        responsible:users!departments_responsible_id_fkey(id, name, email),
        teams(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        manager:users!users_reports_to_fkey(id, name, email)
      `)
      .order('name');

    if (error) throw error;

    const typedData = data as UserWithManager[];

    // Buscar times e subordinados para cada usuário
    const usersWithDetails = await Promise.all(
      (typedData || []).map(async (user) => {
        // Buscar times
        const { data: teamData } = await supabase
          .from('team_members')
          .select('teams(id, name, department_id)')
          .eq('user_id', user.id);

        const typedTeamData = teamData as TeamMemberWithTeam[] | null;
        const teams = typedTeamData?.map(tm => tm.teams).filter(Boolean) || [];

        // Buscar subordinados diretos
        const { data: reportsData } = await supabase
          .from('users')
          .select('id, name, email, position')
          .eq('reports_to', user.id);

        return {
          ...user,
          teams,
          direct_reports: reportsData || [],
        } as UserWithDetails;
      })
    );

    return usersWithDetails;
  },

  // Buscar usuário por ID
  async getById(id: string): Promise<UserWithDetails | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        manager:users!users_reports_to_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Buscar times
    const { data: teamData } = await supabase
      .from('team_members')
      .select('teams(id, name, department_id)')
      .eq('user_id', id);

    const typedTeamData = teamData as TeamMemberWithTeam[] | null;
    const teams = typedTeamData?.map(tm => tm.teams).filter(Boolean) || [];

    // Buscar subordinados
    const { data: reportsData } = await supabase
      .from('users')
      .select('id, name, email, position')
      .eq('reports_to', id);

    return {
      ...data,
      teams,
      direct_reports: reportsData || [],
    };
  },

  // Criar usuário (já é criado automaticamente pelo trigger)
  // Este método é para atualizar dados adicionais após criação
  async updateAfterCreation(id: string, userData: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  // Desativar usuário (soft delete)
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

  // Buscar usuários por departamento
  async getByDepartment(departmentId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .contains('department_ids', [departmentId])
      .order('name');

    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        department:departments(id, name),
        responsible:users!teams_responsible_id_fkey(id, name, email)
      `)
      .order('name');

    if (error) throw error;

    const typedData = data as TeamWithRelations[];

    // Buscar membros de cada time
    const teamsWithMembers = await Promise.all(
      (typedData || []).map(async (team) => {
        const { data: membersData } = await supabase
          .from('team_members')
          .select('users(id, name, email, position)')
          .eq('team_id', team.id);

        const typedMembersData = membersData as TeamMemberWithUser[] | null;
        const members = typedMembersData?.map(tm => tm.users).filter(Boolean) || [];

        return {
          ...team,
          members,
        } as TeamWithDetails;
      })
    );

    return teamsWithMembers;
  },

  // Buscar time por ID
  async getById(id: string): Promise<TeamWithDetails | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        department:departments(id, name),
        responsible:users!teams_responsible_id_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Buscar membros
    const { data: membersData } = await supabase
      .from('team_members')
      .select('users(id, name, email, position)')
      .eq('team_id', id);

    const typedMembersData = membersData as TeamMemberWithUser[] | null;
    const members = typedMembersData?.map(tm => tm.users).filter(Boolean) || [];

    return {
      ...data,
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

  // Adicionar múltiplos membros
  async addMembers(teamId: string, userIds: string[]): Promise<void> {
    const members = userIds.map(userId => ({
      team_id: teamId,
      user_id: userId,
    }));

    const { error } = await supabase
      .from('team_members')
      .insert(members);

    if (error) throw error;
  },

  // Substituir todos os membros do time
  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    // Primeiro remove todos os membros atuais
    await this.removeMember(teamId, '');
    
    // Depois adiciona os novos
    if (userIds.length > 0) {
      await this.addMembers(teamId, userIds);
    }
  },
};

// ====================================
// HELPER FUNCTIONS
// ====================================
export const supabaseHelpers = {
  // Verificar se um email já existe
  async emailExists(email: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return !!data;
  },

  // Buscar departamentos de um usuário
  async getUserDepartments(userId: string): Promise<Department[]> {
    const { data: teamData } = await supabase
      .from('team_members')
      .select('teams(department_id)')
      .eq('user_id', userId);

    const typedTeamData = teamData as Array<{ teams: { department_id: string | null } | null }> | null;
    const departmentIds = [...new Set(
      typedTeamData?.map(tm => tm.teams?.department_id).filter(Boolean) || []
    )];

    if (departmentIds.length === 0) return [];

    const { data } = await supabase
      .from('departments')
      .select('*')
      .in('id', departmentIds);

    return data || [];
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