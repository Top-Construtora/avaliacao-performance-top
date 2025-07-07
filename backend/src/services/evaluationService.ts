import { ApiError } from '../middleware/errorHandler';

export const evaluationService = {
  // ====================================
  // CICLOS DE AVALIAÇÃO
  // ====================================
  
  // Buscar todos os ciclos
  async getEvaluationCycles(supabase: any) {
    try {
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch evaluation cycles');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar ciclo atual
  async getCurrentCycle(supabase: any) {
    try {
      
      const now = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .in('status', ['active', 'open']) // Aceitar ambos os status
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch current cycle');
      }

      // Retorna o primeiro item ou null
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar novo ciclo
  async createCycle(supabase: any, cycleData: any) {
    try {
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .insert({
          title: cycleData.title,
          description: cycleData.description,
          start_date: cycleData.start_date,
          end_date: cycleData.end_date,
          status: cycleData.status || 'draft',
          is_editable: true,
          created_by: cycleData.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to create cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Atualizar status do ciclo
  async updateCycleStatus(supabase: any, cycleId: string, status: string) {
    try {
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', cycleId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to update cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // AVALIAÇÕES
  // ====================================
  
  // Buscar avaliações do funcionário
  async getEmployeeEvaluations(supabase: any, employeeId: string) {
    try {
      
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          evaluation_competencies (*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Se a tabela não existir, retornar array vazio
        if (error.code === '42P01') {
          console.warn('Evaluations table does not exist');
          return [];
        }
        throw new ApiError(500, error.message || 'Failed to fetch evaluations');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar autoavaliação
  async createSelfEvaluation(supabase: any, evaluationData: any) {
    try {
      
      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          cycle_id: evaluationData.cycleId,
          employee_id: evaluationData.employeeId,
          evaluator_id: evaluationData.employeeId, // Autoavaliação
          evaluation_type: 'self',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to create evaluation');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // DASHBOARD E RELATÓRIOS
  // ====================================
  
  // Buscar dados do dashboard
  async getCycleDashboard(supabase: any, cycleId: string) {
    try {
      
      // Por enquanto, retornar dados mockados
      return [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar dados do Nine Box
  async getNineBoxData(supabase: any, cycleId: string) {
    try {
      
      // Por enquanto, retornar dados mockados
      return [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // CONSENSO
  // ====================================
  
  // Criar reunião de consenso
  async createConsensusMeeting(supabase: any, meetingData: any) {
    try {
      console.log('Creating consensus meeting:', meetingData);
      
      // Por enquanto, retornar sucesso mockado
      return { id: 'temp-consensus-id', ...meetingData };
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Completar reunião de consenso
  async completeConsensusMeeting(supabase: any, meetingId: string, data: any) {
    try {
      console.log('Completing consensus meeting:', meetingId, data);
      
      // Por enquanto, retornar sucesso
      return { success: true };
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  }
};