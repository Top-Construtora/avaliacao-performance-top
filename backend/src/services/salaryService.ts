import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { createSalaryBusinessRules } from '../utils/salaryBusinessRules';

export const salaryService = {
  // ===== USUÁRIOS =====
  async getUserById(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // ===== CLASSES SALARIAIS =====
  async getSalaryClasses(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('salary_classes')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getSalaryClassById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('salary_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSalaryClass(supabase: SupabaseClient<Database>, classData: any) {
    const { data, error } = await supabase
      .from('salary_classes')
      .insert(classData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSalaryClass(supabase: SupabaseClient<Database>, id: string, updates: any) {
    const { data, error } = await supabase
      .from('salary_classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSalaryClass(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('salary_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== CARGOS =====
  async getJobPositions(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('job_positions')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async getJobPositionById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('job_positions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createJobPosition(supabase: SupabaseClient<Database>, positionData: any) {
    const { data, error } = await supabase
      .from('job_positions')
      .insert(positionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateJobPosition(supabase: SupabaseClient<Database>, id: string, updates: any) {
    const { data, error } = await supabase
      .from('job_positions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteJobPosition(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('job_positions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== INTERNÍVEIS =====
  async getSalaryLevels(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('salary_levels')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getSalaryLevelById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('salary_levels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSalaryLevel(supabase: SupabaseClient<Database>, levelData: any) {
    const { data, error } = await supabase
      .from('salary_levels')
      .insert(levelData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSalaryLevel(supabase: SupabaseClient<Database>, id: string, updates: any) {
    const { data, error } = await supabase
      .from('salary_levels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSalaryLevel(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('salary_levels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== TRILHAS DE CARREIRA =====
  async getCareerTracks(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('career_tracks')
      .select(`
        *,
        department:departments(id, name)
      `)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getCareerTrackById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('career_tracks')
      .select(`
        *,
        department:departments(id, name),
        positions:track_positions(
          *,
          position:job_positions(id, name),
          class:salary_classes(id, code, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getTracksByDepartment(supabase: SupabaseClient<Database>, departmentId: string) {
    const { data, error } = await supabase
      .from('career_tracks')
      .select('*')
      .eq('department_id', departmentId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async createCareerTrack(supabase: SupabaseClient<Database>, trackData: any) {
    const { data, error } = await supabase
      .from('career_tracks')
      .insert(trackData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCareerTrack(supabase: SupabaseClient<Database>, id: string, updates: any) {
    const { data, error } = await supabase
      .from('career_tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCareerTrack(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('career_tracks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== POSIÇÕES NAS TRILHAS =====
  async getTrackPositions(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('track_positions')
      .select(`
        *,
        track:career_tracks(id, name),
        position:job_positions(id, name),
        class:salary_classes(id, code, name)
      `)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getTrackPositionById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('track_positions')
      .select(`
        *,
        track:career_tracks(id, name),
        position:job_positions(id, name),
        class:salary_classes(id, code, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getPositionsByTrack(supabase: SupabaseClient<Database>, trackId: string) {
    const { data, error } = await supabase
      .from('track_positions')
      .select(`
        *,
        position:job_positions(id, name),
        class:salary_classes(id, code, name)
      `)
      .eq('track_id', trackId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createTrackPosition(supabase: SupabaseClient<Database>, positionData: any) {
    // Extract custom_level_percentages if provided
    const insertData = {
      ...positionData,
      custom_level_percentages: positionData.custom_level_percentages || {}
    };

    const { data, error } = await supabase
      .from('track_positions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTrackPosition(supabase: SupabaseClient<Database>, id: string, updates: any) {
    // Include custom_level_percentages in updates if provided
    const updateData = {
      ...updates,
      ...(updates.custom_level_percentages !== undefined && {
        custom_level_percentages: updates.custom_level_percentages
      })
    };

    const { data, error } = await supabase
      .from('track_positions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTrackPosition(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('track_positions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== REGRAS DE PROGRESSÃO =====
  async getProgressionRules(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('progression_rules')
      .select(`
        *,
        from_position:track_positions!from_position_id(
          id,
          position:job_positions(name),
          class:salary_classes(code)
        ),
        to_position:track_positions!to_position_id(
          id,
          position:job_positions(name),
          class:salary_classes(code)
        )
      `);

    if (error) throw error;
    return data;
  },

  async getProgressionRuleById(supabase: SupabaseClient<Database>, id: string) {
    const { data, error } = await supabase
      .from('progression_rules')
      .select(`
        *,
        from_position:track_positions!from_position_id(
          id,
          position:job_positions(name),
          class:salary_classes(code)
        ),
        to_position:track_positions!to_position_id(
          id,
          position:job_positions(name),
          class:salary_classes(code)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getRulesByFromPosition(supabase: SupabaseClient<Database>, positionId: string) {
    const { data, error } = await supabase
      .from('progression_rules')
      .select(`
        *,
        to_position:track_positions!to_position_id(
          id,
          position:job_positions(name),
          class:salary_classes(code),
          base_salary
        )
      `)
      .eq('from_position_id', positionId)
      .eq('active', true);

    if (error) throw error;
    return data;
  },

  async createProgressionRule(supabase: SupabaseClient<Database>, ruleData: any) {
    const { data, error } = await supabase
      .from('progression_rules')
      .insert(ruleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProgressionRule(supabase: SupabaseClient<Database>, id: string, updates: any) {
    const { data, error } = await supabase
      .from('progression_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProgressionRule(supabase: SupabaseClient<Database>, id: string) {
    const { error } = await supabase
      .from('progression_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== GESTÃO DE USUÁRIOS =====
  async assignUserToTrack(
    supabase: SupabaseClient<Database>, 
    userId: string, 
    trackPositionId: string, 
    salaryLevelId: string
  ) {
    const { data, error } = await supabase
      .from('users')
      .update({
        current_track_position_id: trackPositionId,
        current_salary_level_id: salaryLevelId,
        position_start_date: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== GESTÃO DE USUÁRIOS COM VALIDAÇÕES =====
  async assignUserToTrackWithValidation(
    supabase: SupabaseClient<Database>, 
    userId: string, 
    trackPositionId: string, 
    salaryLevelId: string
  ) {
    const businessRules = createSalaryBusinessRules(supabase);
    
    // Validar antes de atribuir
    const validation = await businessRules.validateTrackAssignment(
      userId,
      trackPositionId,
      salaryLevelId
    );
    
    if (!validation.isValid) {
      throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
    }
    
    // Se houver warnings, pode logar ou retornar para o frontend
    if (validation.warnings.length > 0) {
      console.warn('Avisos:', validation.warnings);
    }
    
    // Prosseguir com a atribuição
    const result = await this.assignUserToTrack(
      supabase,
      userId,
      trackPositionId,
      salaryLevelId
    );
    
    // Criar log de auditoria
    await this.createAuditLog(supabase, {
      action: 'USER_TRACK_ASSIGNMENT',
      userId,
      details: {
        trackPositionId,
        salaryLevelId,
        warnings: validation.warnings
      }
    });
    
    return {
      ...result,
      warnings: validation.warnings
    };
  },

  async updateUserSalaryLevel(
    supabase: SupabaseClient<Database>, 
    userId: string, 
    salaryLevelId: string
  ) {
    const { data, error } = await supabase
      .from('users')
      .update({
        current_salary_level_id: salaryLevelId
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserSalaryInfo(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('user_calculated_salaries')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Verificar se o usuário pode visualizar o Comitê de Gente baseado no cargo
  async checkPeopleCommitteePermission(supabase: SupabaseClient<Database>, userId: string) {
    // Buscar o usuário com suas informações de trilha
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        is_admin,
        is_director,
        is_leader,
        current_track_position_id
      `)
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Admin e Director sempre podem ver
    if (user.is_admin || user.is_director) {
      return { canView: true };
    }

    // Para líderes, verificar o cargo na trilha
    if (user.is_leader && user.current_track_position_id) {
      // Buscar a posição na trilha e depois o cargo (job_position) associado
      const { data: trackPosition, error: tpError } = await supabase
        .from('track_positions')
        .select(`
          position_id,
          position:job_positions(
            id,
            name,
            can_view_people_committee
          )
        `)
        .eq('id', user.current_track_position_id)
        .single();

      if (tpError) {
        console.error('Erro ao buscar track_position:', tpError);
        return { canView: false };
      }

      const position = trackPosition?.position as any;
      if (position) {
        // Verifica se o cargo tem permissão (pelo campo OU pelo nome)
        const positionNameLower = position.name?.toLowerCase() || '';
        const canViewByName =
          positionNameLower.includes('diretor') ||
          positionNameLower.includes('gerente') ||
          positionNameLower.includes('coordenador') ||
          positionNameLower.includes('supervisor');

        if (position.can_view_people_committee || canViewByName) {
          return {
            canView: true,
            positionName: position.name
          };
        }
      }
    }

    return { canView: false };
  },

  async getUserPossibleProgressions(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('user_possible_progressions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  // ===== PROGRESSÃO =====
  async progressUser(
    supabase: SupabaseClient<Database>,
    progressionData: {
      userId: string;
      toTrackPositionId: string;
      toSalaryLevelId: string;
      progressionType: 'horizontal' | 'vertical' | 'merit';
      reason?: string;
      approvedBy?: string;
    }
  ) {
    // Buscar informações atuais do usuário
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select(`
        current_track_position_id,
        current_salary_level_id,
        current_salary
      `)
      .eq('id', progressionData.userId)
      .single();

    if (userError) throw userError;

    // Criar registro no histórico
    const { data: history, error: historyError } = await supabase
      .from('progression_history')
      .insert({
        user_id: progressionData.userId,
        from_track_position_id: currentUser.current_track_position_id,
        to_track_position_id: progressionData.toTrackPositionId,
        from_salary_level_id: currentUser.current_salary_level_id,
        to_salary_level_id: progressionData.toSalaryLevelId,
        from_salary: currentUser.current_salary,
        progression_type: progressionData.progressionType,
        progression_date: new Date().toISOString(),
        reason: progressionData.reason,
        approved_by: progressionData.approvedBy
      })
      .select()
      .single();

    if (historyError) throw historyError;

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        current_track_position_id: progressionData.toTrackPositionId,
        current_salary_level_id: progressionData.toSalaryLevelId,
        position_start_date: new Date().toISOString()
      })
      .eq('id', progressionData.userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { history, user: updatedUser };
  },

  // ===== PROGRESSÃO COM VALIDAÇÕES =====
  async progressUserWithValidation(
    supabase: SupabaseClient<Database>,
    progressionData: {
      userId: string;
      toTrackPositionId: string;
      toSalaryLevelId: string;
      progressionType: 'horizontal' | 'vertical' | 'merit';
      reason?: string;
      approvedBy?: string;
    }
  ) {
    const businessRules = createSalaryBusinessRules(supabase);
    
    // Buscar posição atual
    const { data: currentUser } = await supabase
      .from('users')
      .select('current_track_position_id')
      .eq('id', progressionData.userId)
      .single();
      
    if (!currentUser?.current_track_position_id) {
      throw new Error('Usuário não possui cargo atual');
    }
    
    // Validar progressão
    const validation = await businessRules.validateProgression(
      progressionData.userId,
      currentUser.current_track_position_id,
      progressionData.toTrackPositionId,
      progressionData.progressionType
    );
    
    if (!validation.isValid) {
      throw new Error(`Progressão não permitida: ${validation.errors.join(', ')}`);
    }
    
    // Executar progressão
    const result = await this.progressUser(supabase, progressionData);
    
    // Notificar interessados
    await this.notifyProgression(supabase, {
      userId: progressionData.userId,
      type: progressionData.progressionType,
      approvedBy: progressionData.approvedBy
    });
    
    return {
      ...result,
      warnings: validation.warnings
    };
  },

  async getUserProgressionHistory(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('progression_history')
      .select(`
        *,
        from_position:track_positions!from_track_position_id(
          position:job_positions(name),
          class:salary_classes(code)
        ),
        to_position:track_positions!to_track_position_id(
          position:job_positions(name),
          class:salary_classes(code)
        ),
        from_level:salary_levels!from_salary_level_id(name),
        to_level:salary_levels!to_salary_level_id(name),
        approver:users!approved_by(name)
      `)
      .eq('user_id', userId)
      .order('progression_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // ===== RELATÓRIOS =====
  async getSalaryOverview(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('hr_salary_overview')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async getSalaryByDepartment(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('user_calculated_salaries')
      .select(`
        department_name,
        calculated_salary
      `);

    if (error) throw error;

    // Agrupar por departamento
    const grouped = data.reduce((acc: any, curr: any) => {
      const dept = curr.department_name || 'Sem Departamento';
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          count: 0,
          totalSalary: 0,
          avgSalary: 0,
          minSalary: Infinity,
          maxSalary: 0
        };
      }
      
      acc[dept].count++;
      acc[dept].totalSalary += curr.calculated_salary || 0;
      acc[dept].minSalary = Math.min(acc[dept].minSalary, curr.calculated_salary || 0);
      acc[dept].maxSalary = Math.max(acc[dept].maxSalary, curr.calculated_salary || 0);
      
      return acc;
    }, {});

    // Calcular médias
    Object.values(grouped).forEach((dept: any) => {
      dept.avgSalary = dept.totalSalary / dept.count;
    });

    return Object.values(grouped);
  },

  async getSalaryByPosition(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('user_calculated_salaries')
      .select(`
        position_name,
        class_code,
        calculated_salary
      `);

    if (error) throw error;

    // Agrupar por cargo
    const grouped = data.reduce((acc: any, curr: any) => {
      const key = `${curr.position_name || 'Sem Cargo'} - ${curr.class_code || ''}`;
      if (!acc[key]) {
        acc[key] = {
          position: curr.position_name,
          class: curr.class_code,
          count: 0,
          totalSalary: 0,
          avgSalary: 0,
          minSalary: Infinity,
          maxSalary: 0
        };
      }
      
      acc[key].count++;
      acc[key].totalSalary += curr.calculated_salary || 0;
      acc[key].minSalary = Math.min(acc[key].minSalary, curr.calculated_salary || 0);
      acc[key].maxSalary = Math.max(acc[key].maxSalary, curr.calculated_salary || 0);
      
      return acc;
    }, {});

    // Calcular médias
    Object.values(grouped).forEach((pos: any) => {
      pos.avgSalary = pos.totalSalary / pos.count;
    });

    return Object.values(grouped);
  },

  // ===== ANÁLISE DE EQUIDADE SALARIAL =====
  async analyzeSalaryEquity(supabase: SupabaseClient<Database>) {
    const { data: salaryData } = await supabase
      .from('user_calculated_salaries')
      .select('*');
      
    if (!salaryData) return null;
    
    // Agrupar por diferentes dimensões
    const byDepartment = this.groupByDepartment(salaryData);
    const bySeniority = this.groupBySeniority(salaryData);
    
    // Calcular gaps
    const departmentVariance = this.calculateDepartmentVariance(byDepartment);
    const seniorityProgression = this.calculateSeniorityProgression(bySeniority);
    
    // Gerar recomendações
    const recommendations: string[] = [];
    
    if (departmentVariance > 15) {
      recommendations.push(`Variância entre departamentos de ${departmentVariance.toFixed(1)}% - considerar ajustes`);
    }
    
    return {
      metrics: {
        departmentVariance,
        seniorityProgression,
        totalEmployees: salaryData.length,
        averageSalary: this.calculateAverage(salaryData.map(d => d.calculated_salary || 0))
      },
      recommendations,
      details: {
        byDepartment,
        bySeniority
      }
    };
  },

  // ===== SIMULAÇÃO DE IMPACTO ORÇAMENTÁRIO =====
  async simulateBudgetImpact(
    supabase: SupabaseClient<Database>,
    scenarios: Array<{
      type: 'individual' | 'department' | 'global';
      targetId?: string;
      percentageIncrease?: number;
      absoluteIncrease?: number;
    }>
  ) {
    const results = [];
    
    for (const scenario of scenarios) {
      let affectedUsers: any[] = [];
      
      switch (scenario.type) {
        case 'individual':
          const { data: user } = await supabase
            .from('users')
            .select('id, current_salary')
            .eq('id', scenario.targetId)
            .single();
          if (user) affectedUsers = [user];
          break;
          
        case 'department':
          const { data: deptUsers } = await supabase
            .from('user_calculated_salaries')
            .select('id, calculated_salary as current_salary')
            .eq('department_id', scenario.targetId);
          affectedUsers = deptUsers || [];
          break;
          
        case 'global':
          const { data: allUsers } = await supabase
            .from('users')
            .select('id, current_salary')
            .eq('active', true);
          affectedUsers = allUsers || [];
          break;
      }
      
      // Calcular impacto
      const currentTotal = affectedUsers.reduce((sum, u) => sum + (u.current_salary || 0), 0);
      let newTotal = 0;
      
      if (scenario.percentageIncrease) {
        newTotal = currentTotal * (1 + scenario.percentageIncrease / 100);
      } else if (scenario.absoluteIncrease) {
        newTotal = currentTotal + (scenario.absoluteIncrease * affectedUsers.length);
      }
      
      const impact = {
        scenario,
        affectedCount: affectedUsers.length,
        currentCost: currentTotal,
        newCost: newTotal,
        increase: newTotal - currentTotal,
        percentageIncrease: ((newTotal - currentTotal) / currentTotal) * 100,
        monthlyImpact: (newTotal - currentTotal) / 12,
        yearlyImpact: newTotal - currentTotal,
        // Encargos trabalhistas (simplificado)
        totalCostWithCharges: (newTotal - currentTotal) * 1.45 // Fator de 45% de encargos
      };
      
      results.push(impact);
    }
    
    return {
      scenarios: results,
      totalImpact: results.reduce((sum, r) => sum + r.increase, 0),
      totalWithCharges: results.reduce((sum, r) => sum + r.totalCostWithCharges, 0)
    };
  },

  // ===== CÁLCULO =====
  async calculateSalary(
    supabase: SupabaseClient<Database>, 
    trackPositionId: string, 
    salaryLevelId: string
  ) {
    // Buscar posição na trilha
    const { data: position, error: posError } = await supabase
      .from('track_positions')
      .select('base_salary')
      .eq('id', trackPositionId)
      .single();

    if (posError) throw posError;

    // Buscar internível
    const { data: level, error: levelError } = await supabase
      .from('salary_levels')
      .select('percentage')
      .eq('id', salaryLevelId)
      .single();

    if (levelError) throw levelError;

    // Calcular salário
    const baseSalary = position.base_salary;
    const percentage = level.percentage;
    const calculatedSalary = baseSalary * (1 + percentage / 100);

    return {
      baseSalary,
      levelPercentage: percentage,
      calculatedSalary: Number(calculatedSalary.toFixed(2))
    };
  },

  // ===== FUNÇÕES AUXILIARES =====
  createAuditLog(supabase: SupabaseClient<Database>, log: any) {
    // Implementar log de auditoria
    console.log('Audit log:', log);
  },

  async notifyProgression(supabase: SupabaseClient<Database>, notification: any) {
    // Implementar notificação
    console.log('Notification:', notification);
  },

  calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  },

  groupByDepartment(salaryData: any[]) {
    const grouped: { [key: string]: any[] } = {};
    salaryData.forEach(item => {
      const dept = item.department || 'Sem Departamento';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(item);
    });
    return grouped;
  },

  groupBySeniority(salaryData: any[]) {
    const grouped: { [key: string]: any[] } = {};
    salaryData.forEach(item => {
      const seniority = item.seniority || 'Não definido';
      if (!grouped[seniority]) {
        grouped[seniority] = [];
      }
      grouped[seniority].push(item);
    });
    return grouped;
  },

  calculateDepartmentVariance(byDepartment: { [key: string]: any[] }): number {
    const avgSalaries = Object.values(byDepartment).map(dept => {
      const salaries = dept.map(d => d.salary || 0);
      return this.calculateAverage(salaries);
    });
    
    if (avgSalaries.length === 0) return 0;
    
    const overallAvg = this.calculateAverage(avgSalaries);
    const variance = avgSalaries.reduce((sum, avg) => {
      return sum + Math.pow(avg - overallAvg, 2);
    }, 0) / avgSalaries.length;
    
    return (Math.sqrt(variance) / overallAvg) * 100;
  },

  calculateSeniorityProgression(bySeniority: { [key: string]: any[] }): number {
    const seniorityOrder = ['Júnior', 'Pleno', 'Sênior', 'Especialista'];
    const avgBySeniority: { [key: string]: number } = {};
    
    seniorityOrder.forEach(level => {
      if (bySeniority[level]) {
        const salaries = bySeniority[level].map(s => s.salary || 0);
        avgBySeniority[level] = this.calculateAverage(salaries);
      }
    });
    
    let totalProgression = 0;
    let count = 0;
    
    for (let i = 1; i < seniorityOrder.length; i++) {
      const prev = seniorityOrder[i - 1];
      const curr = seniorityOrder[i];
      
      if (avgBySeniority[prev] && avgBySeniority[curr]) {
        const progression = ((avgBySeniority[curr] - avgBySeniority[prev]) / avgBySeniority[prev]) * 100;
        totalProgression += progression;
        count++;
      }
    }
    
    return count > 0 ? totalProgression / count : 0;
  }
};