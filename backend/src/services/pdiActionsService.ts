import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { AppError } from '../errors/AppError';
import { PDIItem } from '../types/pdi.types';

/**
 * Ações do PDI normalizadas (fase 5C).
 *
 * Modo de transição (dual-write): o JSONB development_plans.items continua
 * sendo a fonte das telas legadas; esta tabela é a fonte de vínculo com
 * cursos, prazo real (due_date) e lembretes. O id do item é compartilhado
 * entre as duas estruturas. due_date/course_id vivem SÓ na tabela e são
 * preservados quando o restante do item é reescrito pelo fluxo legado.
 */

export const pdiActionsService = {
  /** Garante id em todos os itens (muta uma cópia) e devolve a lista. */
  ensureItemIds(items: PDIItem[]): PDIItem[] {
    return (items || []).map((item) => ({
      ...item,
      id: item.id && String(item.id).trim() !== '' ? item.id : randomUUID(),
    }));
  },

  /**
   * Espelha os itens do JSONB na tabela pdi_actions:
   * upsert dos presentes (sem tocar due_date/course_id) e remoção dos ausentes.
   * Nunca lança — falha aqui não pode quebrar o fluxo legado de PDI.
   */
  async syncFromItems(supabase: SupabaseClient, planId: string, items: PDIItem[]): Promise<void> {
    try {
      const ids = (items || []).map((i) => i.id).filter(Boolean) as string[];

      if (ids.length > 0) {
        const rows = (items || []).map((item, index) => ({
          development_plan_id: planId,
          id: item.id!,
          competencia: item.competencia || '',
          prazo: ['curto', 'medio', 'longo'].includes(item.prazo) ? item.prazo : 'curto',
          resultados_esperados: item.resultadosEsperados || null,
          como_desenvolver: item.comoDesenvolver || null,
          calendarizacao: item.calendarizacao || null,
          observacao: item.observacao || null,
          status: ['1', '2', '3', '4', '5'].includes(item.status) ? item.status : '1',
          position: index,
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('pdi_actions')
          .upsert(rows, { onConflict: 'development_plan_id,id' });
        if (upsertError) {
          console.error('[pdiActions] sync upsert error:', upsertError.message);
          return;
        }
      }

      // Remove ações que saíram do PDI
      let deleteQuery = supabase.from('pdi_actions').delete().eq('development_plan_id', planId);
      if (ids.length > 0) {
        deleteQuery = deleteQuery.not('id', 'in', `(${ids.map((id) => `"${id}"`).join(',')})`);
      }
      const { error: deleteError } = await deleteQuery;
      if (deleteError) {
        console.error('[pdiActions] sync delete error:', deleteError.message);
      }
    } catch (error: any) {
      console.error('[pdiActions] sync error:', error?.message);
    }
  },

  /** Ações do plano ativo do usuário, com o curso vinculado. */
  async myActions(supabase: SupabaseClient, userId: string) {
    const { data: plan } = await supabase
      .from('development_plans')
      .select('id')
      .eq('employee_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();
    if (!plan) return { plan_id: null, actions: [] };

    const { data: actions, error } = await supabase
      .from('pdi_actions')
      .select('*, course:courses!pdi_actions_course_id_fkey(id, title)')
      .eq('development_plan_id', plan.id)
      .order('position');
    if (error) throw AppError.internal(`Erro ao listar ações: ${error.message}`);
    return { plan_id: plan.id, actions: actions || [] };
  },

  /**
   * Atualiza status/prazo/curso de uma ação. Status é espelhado de volta no
   * JSONB (as telas legadas continuam coerentes); due_date/course_id só tabela.
   */
  async updateAction(
    supabase: SupabaseClient,
    planId: string,
    actionId: string,
    userId: string,
    input: { status?: string; due_date?: string | null; course_id?: string | null },
    canManageOthers: boolean,
  ) {
    const { data: plan } = await supabase
      .from('development_plans')
      .select('id, employee_id, items')
      .eq('id', planId)
      .single();
    if (!plan) throw AppError.notFound('PDI não encontrado');
    if (plan.employee_id !== userId && !canManageOthers) {
      throw AppError.forbidden('Você não pode alterar o PDI de outra pessoa');
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status !== undefined) {
      if (!['1', '2', '3', '4', '5'].includes(input.status)) {
        throw AppError.badRequest('Status inválido');
      }
      updates.status = input.status;
    }
    if (input.due_date !== undefined) updates.due_date = input.due_date;
    if (input.course_id !== undefined) updates.course_id = input.course_id;

    const { data: action, error } = await supabase
      .from('pdi_actions')
      .update(updates)
      .eq('development_plan_id', planId)
      .eq('id', actionId)
      .select('*, course:courses!pdi_actions_course_id_fkey(id, title)')
      .single();
    if (error || !action) throw AppError.notFound('Ação não encontrada');

    // Espelha o status no JSONB (dual-write)
    if (input.status !== undefined && Array.isArray(plan.items)) {
      const mirrored = plan.items.map((item: any) =>
        item?.id === actionId ? { ...item, status: input.status } : item,
      );
      await supabase
        .from('development_plans')
        .update({ items: mirrored, updated_at: new Date().toISOString() })
        .eq('id', planId);
    }

    return action;
  },

  /**
   * Conclui as ações do plano ativo vinculadas a um curso recém-concluído.
   * Retorna as ações concluídas (para a notificação).
   */
  async completeActionsForCourse(
    supabase: SupabaseClient,
    userId: string,
    courseId: string,
  ): Promise<Array<{ id: string; competencia: string }>> {
    const { data: plan } = await supabase
      .from('development_plans')
      .select('id, items')
      .eq('employee_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();
    if (!plan) return [];

    const { data: linked } = await supabase
      .from('pdi_actions')
      .select('id, competencia, status')
      .eq('development_plan_id', plan.id)
      .eq('course_id', courseId)
      .not('status', 'in', '("4","5")');
    if (!linked?.length) return [];

    const ids = linked.map((a: any) => a.id);
    await supabase
      .from('pdi_actions')
      .update({ status: '4', updated_at: new Date().toISOString() })
      .eq('development_plan_id', plan.id)
      .in('id', ids);

    // Espelha no JSONB
    if (Array.isArray(plan.items)) {
      const mirrored = plan.items.map((item: any) =>
        ids.includes(item?.id) ? { ...item, status: '4' } : item,
      );
      await supabase
        .from('development_plans')
        .update({ items: mirrored, updated_at: new Date().toISOString() })
        .eq('id', plan.id);
    }

    return linked.map((a: any) => ({ id: a.id, competencia: a.competencia }));
  },
};
