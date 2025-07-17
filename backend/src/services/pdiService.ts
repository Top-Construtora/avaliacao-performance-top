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
        const { data, error } = await supabase
          .from('development_plans')
          .update({
            items: pdiData.items,
            cycle_id: pdiData.cycleId,
            leader_evaluation_id: pdiData.leaderEvaluationId,
            periodo: pdiData.periodo,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPDI.id)
          .select()
          .single();

        if (error) throw new ApiError(500, error.message);
        return data;
      } else {
        // Criar novo PDI
        const { data, error } = await supabase
          .from('development_plans')
          .insert({
            employee_id: pdiData.employeeId,
            cycle_id: pdiData.cycleId,
            leader_evaluation_id: pdiData.leaderEvaluationId,
            items: pdiData.items,
            periodo: pdiData.periodo,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: pdiData.createdBy
          })
          .select()
          .single();

        if (error) throw new ApiError(500, error.message);
        return data;
      }
    } catch (error: any) {
      console.error('Service error:', error);
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
          employee:users!employee_id(id, name, position),
          leader_evaluation:leader_evaluations!leader_evaluation_id(
            id,
            evaluator:users!evaluator_id(id, name)
          )
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
      console.error('Service error:', error);
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
      console.error('Service error:', error);
      throw error;
    }
  },

  // Validar estrutura do PDI
  validatePDIItems(items: PDIItem[]): boolean {
    if (!items || items.length === 0) return false;

    return items.every(item => 
      item.competencia && 
      item.resultadosEsperados && 
      item.comoDesenvolver && 
      item.calendarizacao &&
      item.status &&
      ['curto', 'medio', 'longo'].includes(item.prazo)
    );
  }
};