import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../middleware/errorHandler';
import { PDIData, PDIItem } from '../types/pdi.types';

export const pdiService = {
  // Salvar ou atualizar PDI
  async savePDI(supabase: SupabaseClient, pdiData: PDIData) {
    try {
      // Validar que há pelo menos um item
      if (!pdiData.items || pdiData.items.length === 0) {
        throw new ApiError(400, 'O PDI deve conter pelo menos um item');
      }

      // Verificar se há pelo menos um item em algum prazo
      const hasItems = pdiData.items.some(item =>
        ['curto', 'medio', 'longo'].includes(item.prazo)
      );

      if (!hasItems) {
        throw new ApiError(400, 'O PDI deve conter pelo menos um item em algum prazo (curto, médio ou longo)');
      }

      // Verificar se existe PDI ativo
      const { data: existingPDI } = await supabase
        .from('development_plans')
        .select('*')
        .eq('employee_id', pdiData.employeeId)
        .eq('status', 'active')
        .single();

      if (existingPDI) {
        // Atualizar PDI existente
        const updateData = {
          items: pdiData.items,
          cycle_id: pdiData.cycleId || existingPDI.cycle_id || null,
          leader_evaluation_id: pdiData.leaderEvaluationId || existingPDI.leader_evaluation_id || null,
          periodo: pdiData.periodo || existingPDI.periodo || 'Anual',
          timeline: pdiData.periodo || existingPDI.timeline || 'Anual',
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('development_plans')
          .update(updateData)
          .eq('id', existingPDI.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar PDI:', error);
          throw new ApiError(500, error.message);
        }
        return data;
      } else {
        // Criar novo PDI
        const insertData = {
          employee_id: pdiData.employeeId,
          cycle_id: pdiData.cycleId || null,
          leader_evaluation_id: pdiData.leaderEvaluationId || null,
          timeline: pdiData.periodo || 'Anual',
          items: pdiData.items,
          periodo: pdiData.periodo || 'Anual',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: pdiData.createdBy || null
        };

        const { data, error } = await supabase
          .from('development_plans')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar PDI:', error);
          throw new ApiError(500, error.message);
        }
        return data;
      }
    } catch (error: any) {
      if (!(error instanceof ApiError)) {
        console.error('Erro inesperado no PDI service:', error.message);
      }
      throw error;
    }
  },

  // Buscar PDI do colaborador
  async getPDI(supabase: SupabaseClient, employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('development_plans')
        .select(`
          *,
          employee:users!employee_id(id, name, position)
        `)
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new ApiError(500, error.message);
      }

      return data;
    } catch (error: any) {
      if (!(error instanceof ApiError)) {
        console.error('Erro inesperado ao buscar PDI:', error.message);
      }
      throw error;
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(supabase: SupabaseClient, cycleId: string) {
    try {
      const { data, error } = await supabase
        .from('development_plans')
        .select(`
          *,
          employee:users!employee_id(id, name, position, department)
        `)
        .eq('cycle_id', cycleId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(500, error.message);
      return data || [];
    } catch (error: any) {
      if (!(error instanceof ApiError)) {
        console.error('Erro inesperado ao buscar PDIs por ciclo:', error.message);
      }
      throw error;
    }
  },

  // Validar estrutura do PDI
  validatePDIItems(items: PDIItem[]): boolean {
    if (!items || items.length === 0) {
      return false;
    }

    return items.every((item) => {
      return !!(
        item.competencia &&
        item.resultadosEsperados &&
        item.comoDesenvolver &&
        item.calendarizacao &&
        item.status &&
        ['1', '2', '3', '4', '5'].includes(item.status) &&
        ['curto', 'medio', 'longo'].includes(item.prazo)
      );
    });
  }
};
