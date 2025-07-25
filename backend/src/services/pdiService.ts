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

      // Converter items para o formato da tabela development_plans
      const goals: string[] = [];
      const actions: string[] = [];
      const resources: string[] = [];
      const items: any[] = [];
      
      // Processar cada item do PDI
      pdiData.items.forEach((item, index) => {
        const prazoLabel = item.prazo === 'curto' ? 'Curto Prazo' : 
                          item.prazo === 'medio' ? 'Médio Prazo' : 'Longo Prazo';
        
        goals.push(`${prazoLabel} - ${item.competencia}: ${item.resultadosEsperados}`);
        actions.push(`${prazoLabel} - ${item.comoDesenvolver} (Prazo: ${item.calendarizacao})`);
        
        if (item.observacao && item.observacao.trim() !== '') {
          resources.push(`${prazoLabel} - ${item.observacao}`);
        }
        
        // Adicionar item com estrutura completa para o campo JSONB
        items.push({
          id: item.id || `${Date.now()}-${index}`,
          competencia: item.competencia,
          calendarizacao: item.calendarizacao,
          comoDesenvolver: item.comoDesenvolver,
          resultadosEsperados: item.resultadosEsperados,
          status: item.status || '1',
          observacao: item.observacao || '',
          prazo: item.prazo
        });
      });
      
      // Verificar se temos pelo menos um item (devido à constraint)
      if (items.length === 0) {
        throw new ApiError(400, 'O PDI deve conter pelo menos um item');
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
            goals,
            actions,
            resources,
            timeline: pdiData.periodo || 'Anual',
            items: items,
            periodo: pdiData.periodo || 'Anual',
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
            consensus_evaluation_id: null, // PDI criado manualmente
            goals,
            actions,
            resources,
            timeline: pdiData.periodo || 'Anual',
            status: 'active' as const,
            items: items,
            periodo: pdiData.periodo || 'Anual',
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

      if (!data) return null;

      // Converter dados do formato do banco para o formato do frontend
      const items: PDIItem[] = [];
      
      // Se temos o campo items (novo formato), usar ele
      if (data.items && Array.isArray(data.items)) {
        console.log('PDI tem campo items:', data.items);
        return {
          ...data,
          items: data.items,
          periodo: data.periodo || data.timeline || 'Anual'
        };
      }
      
      // Se não tem items, tentar reconstruir dos campos goals/actions (formato antigo)
      if (data.goals && data.actions) {
        data.goals.forEach((goal: string, index: number) => {
          const action = data.actions[index] || '';
          const resource = data.resources?.[index] || '';
          
          // Extrair prazo da string
          let prazo: 'curto' | 'medio' | 'longo' = 'curto';
          if (goal.startsWith('Curto Prazo')) prazo = 'curto';
          else if (goal.startsWith('Médio Prazo')) prazo = 'medio';
          else if (goal.startsWith('Longo Prazo')) prazo = 'longo';
          
          // Extrair competência e resultados esperados
          const goalParts = goal.replace(/^(Curto|Médio|Longo) Prazo - /, '').split(': ');
          const competencia = goalParts[0] || '';
          const resultadosEsperados = goalParts[1] || '';
          
          // Extrair como desenvolver e calendarização
          const actionParts = action.replace(/^(Curto|Médio|Longo) Prazo - /, '').match(/(.+) \(Prazo: (.+)\)/);
          const comoDesenvolver = actionParts?.[1] || action;
          const calendarizacao = actionParts?.[2] || '';
          
          // Extrair observação
          const observacao = resource.replace(/^(Curto|Médio|Longo) Prazo - /, '');
          
          items.push({
            id: `item-${index}`,
            competencia,
            resultadosEsperados,
            comoDesenvolver,
            calendarizacao,
            status: '1', // Default status
            observacao,
            prazo
          });
        });
      }

      return {
        ...data,
        items,
        periodo: data.periodo || data.timeline || 'Anual'
      };
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