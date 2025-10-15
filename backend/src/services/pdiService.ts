import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../middleware/errorHandler';
import { PDIData, PDIItem } from '../types/pdi.types';

export const pdiService = {
  // Salvar ou atualizar PDI
  async savePDI(supabase: SupabaseClient, pdiData: PDIData) {
    try {
      console.log('🔄 Backend - Salvando PDI:', pdiData);
      console.log('📊 Backend - Total de itens recebidos:', pdiData.items?.length || 0);
      console.log('📋 Backend - Items detalhados:', pdiData.items);

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
        console.log('📝 Atualizando PDI existente:', existingPDI.id);
        console.log('📌 Items a serem atualizados:', JSON.stringify(pdiData.items, null, 2));

        // Atualizar PDI existente
        const updateData = {
          items: pdiData.items,
          cycle_id: pdiData.cycleId || existingPDI.cycle_id || null,
          leader_evaluation_id: pdiData.leaderEvaluationId || existingPDI.leader_evaluation_id || null,
          periodo: pdiData.periodo || existingPDI.periodo || 'Anual',
          timeline: pdiData.periodo || existingPDI.timeline || 'Anual',
          updated_at: new Date().toISOString()
        };

        console.log('📦 Dados completos para update:', JSON.stringify(updateData, null, 2));

        const { data, error } = await supabase
          .from('development_plans')
          .update(updateData)
          .eq('id', existingPDI.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao atualizar PDI:', error);
          throw new ApiError(500, error.message);
        }
        console.log('✅ PDI atualizado com sucesso');
        return data;
      } else {
        console.log('➕ Criando novo PDI');
        console.log('📌 Items a serem salvos:', JSON.stringify(pdiData.items, null, 2));

        // Criar novo PDI
        const insertData = {
          employee_id: pdiData.employeeId,
          cycle_id: pdiData.cycleId || null,
          leader_evaluation_id: pdiData.leaderEvaluationId || null,
          timeline: pdiData.periodo || 'Anual',
          items: pdiData.items, // Campo JSONB com os dados do PDI
          periodo: pdiData.periodo || 'Anual',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: pdiData.createdBy || null
        };

        console.log('📦 Dados completos para insert:', JSON.stringify(insertData, null, 2));

        const { data, error } = await supabase
          .from('development_plans')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao criar PDI:', error);
          throw new ApiError(500, error.message);
        }
        console.log('✅ PDI criado com sucesso');
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
    if (!items || items.length === 0) {
      console.log('❌ Validação falhou: Nenhum item fornecido');
      return false;
    }

    console.log('🔍 Validando', items.length, 'itens do PDI...');

    const isValid = items.every((item, index) => {
      const valid =
        item.competencia &&
        item.resultadosEsperados &&
        item.comoDesenvolver &&
        item.calendarizacao &&
        item.status &&
        ['1', '2', '3', '4', '5'].includes(item.status) &&
        ['curto', 'medio', 'longo'].includes(item.prazo);

      if (!valid) {
        console.log(`❌ Item ${index} inválido:`, {
          competencia: !!item.competencia,
          resultadosEsperados: !!item.resultadosEsperados,
          comoDesenvolver: !!item.comoDesenvolver,
          calendarizacao: !!item.calendarizacao,
          status: item.status,
          statusValido: ['1', '2', '3', '4', '5'].includes(item.status),
          prazo: item.prazo,
          prazoValido: ['curto', 'medio', 'longo'].includes(item.prazo)
        });
        console.log('Item completo:', item);
      } else {
        console.log(`✅ Item ${index} válido (${item.prazo}):`, item.competencia);
      }

      return valid;
    });

    console.log(isValid ? '✅ Validação concluída com sucesso' : '❌ Validação falhou');
    return isValid;
  }
};