// src/services/supabase.service.ts
import { supabase } from '../lib/supabase';
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
  // OTIMIZADO: Uma única query com JOINs em vez de N+1 queries
  async getAll(): Promise<UserWithDetails[]> {
    try {
      // Query otimizada com todos os JOINs necessários
      // Primeiro buscar usuários com track e salary_level
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          track:career_tracks(id, name, code),
          salary_level:salary_levels(id, name, percentage)
        `)
        .order('name');

      if (error) throw error;

      // Preparar IDs para queries em batch
      const userIds = (users || []).map(u => u.id);
      const managerIds = [...new Set((users || []).filter(u => u.reports_to).map(u => u.reports_to))];
      const trackPositionIds = [...new Set(
        (users || [])
          .filter(u => u.current_track_position_id)
          .map(u => u.current_track_position_id)
      )];

      // OTIMIZAÇÃO: Executar todas as queries auxiliares em PARALELO
      const [trackPositionsResult, managersResult, directReportsResult] = await Promise.all([
        // Query 1: track_positions
        trackPositionIds.length > 0
          ? supabase
              .from('track_positions')
              .select(`
                id,
                base_salary,
                position:job_positions(id, name, code),
                class:salary_classes(id, name, code)
              `)
              .in('id', trackPositionIds)
          : Promise.resolve({ data: [] }),

        // Query 2: managers
        managerIds.length > 0
          ? supabase
              .from('users')
              .select('id, name, email')
              .in('id', managerIds)
          : Promise.resolve({ data: [] }),

        // Query 3: direct_reports
        userIds.length > 0
          ? supabase
              .from('users')
              .select('id, name, email, position, reports_to')
              .in('reports_to', userIds)
          : Promise.resolve({ data: [] })
      ]);

      // Criar mapas para lookup O(1)
      const trackPositionsMap = new Map((trackPositionsResult.data || []).map(tp => [tp.id, tp]));
      const managersMap = new Map((managersResult.data || []).map(m => [m.id, m]));

      // Agrupar direct_reports por manager
      const directReportsMap = new Map<string, any[]>();
      (directReportsResult.data || []).forEach((dr: any) => {
        if (!directReportsMap.has(dr.reports_to)) {
          directReportsMap.set(dr.reports_to, []);
        }
        directReportsMap.get(dr.reports_to)!.push({
          id: dr.id,
          name: dr.name,
          email: dr.email,
          position: dr.position
        });
      });

      // Montar resultado final
      const usersWithDetails = (users || []).map(user => ({
        ...user,
        manager: user.reports_to ? managersMap.get(user.reports_to) || null : null,
        teams: [], // Teams não são usados no NineBox, carregar sob demanda se necessário
        direct_reports: directReportsMap.get(user.id) || [],
        track: user.track,
        track_position: user.current_track_position_id
          ? trackPositionsMap.get(user.current_track_position_id) || null
          : null,
        salary_level: user.salary_level,
      } as UserWithDetails));

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

  // Deletar usuário (soft delete primeiro, hard delete se já estiver desativado)
  async delete(id: string): Promise<void> {
    // Verificar se o usuário já está desativado
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('active')
      .eq('id', id)
      .single();

    if (getUserError) throw getUserError;

    // Se usuário já está desativado, fazer hard delete em cascata
    if (user.active === false) {
      // Deletar avaliações
      await supabase.from('self_evaluations').delete().eq('employee_id', id);
      await supabase.from('leader_evaluations').delete().eq('employee_id', id);
      await supabase.from('leader_evaluations').delete().eq('evaluator_id', id);
      await supabase.from('consensus_evaluations').delete().eq('employee_id', id);

      // Deletar PDIs
      await supabase.from('development_plans').delete().eq('employee_id', id);

      // Deletar membros de times
      await supabase.from('team_members').delete().eq('user_id', id);

      // Remover como responsável
      await supabase.from('teams').update({ responsible_id: null }).eq('responsible_id', id);
      await supabase.from('departments').update({ responsible_id: null }).eq('responsible_id', id);

      // Remover reports_to
      await supabase.from('users').update({ reports_to: null }).eq('reports_to', id);

      // Deletar competências de avaliação
      const { data: selfEvals } = await supabase.from('self_evaluations').select('id').eq('employee_id', id);
      const { data: leaderEvals } = await supabase.from('leader_evaluations').select('id').eq('employee_id', id);

      const evalIds = [
        ...(selfEvals?.map(e => e.id) || []),
        ...(leaderEvals?.map(e => e.id) || [])
      ];

      if (evalIds.length > 0) {
        await supabase.from('evaluation_competencies').delete().in('evaluation_id', evalIds);
      }

      // Finalmente deletar o usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } else {
      // Se usuário está ativo, fazer soft delete
      const { error } = await supabase
        .from('users')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    }
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