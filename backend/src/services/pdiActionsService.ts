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
 * entre as duas estruturas. due_date/course_id/course_url vivem SÓ na tabela e
 * são preservados quando o restante do item é reescrito pelo fluxo legado.
 */

/**
 * Aceita só http(s). O link é renderizado como âncora clicável na tela do
 * colaborador — sem esta trava, um `javascript:` salvo aqui viraria execução
 * de script no navegador de quem clicasse.
 *
 * Nota sobre o nome: `course_url` guarda qualquer **material de apoio** — vídeo,
 * artigo, livro, podcast — e não só curso. A tela usa esse vocabulário mais
 * amplo de propósito: falar em "curso" faz o líder indicar só curso, quando o
 * desenvolvimento também acontece por leitura, mentoria e prática.
 */
function normalizeCourseUrl(raw: string): string {
  const valor = raw.trim();
  // Sem esquema, assume https — é o que a pessoa quer dizer ao colar "udemy.com/x"
  const comEsquema = /^[a-z][a-z0-9+.-]*:/i.test(valor) ? valor : `https://${valor}`;

  let url: URL;
  try {
    url = new URL(comEsquema);
  } catch {
    throw AppError.badRequest('Link do curso inválido');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw AppError.badRequest('O link do curso precisa começar com http:// ou https://');
  }
  return url.toString();
}

/**
 * Converte a calendarização ("2026-03") no prazo real da ação ("2026-03-31").
 *
 * A tela pede só mês/ano — é a granularidade que um PDI tem de verdade ("em
 * algum momento de março"). Mas o lembrete de prazo precisa perguntar ao banco
 * "o que vence nos próximos 7 dias?", e isso não se faz com texto: "2026-03" é
 * string, o Postgres não sabe que março acaba no dia 31.
 *
 * Então o dia é derivado aqui, invisível para quem preenche. O último dia do mês
 * é a leitura correta do prazo: a ação tem até o fim do mês para acontecer.
 */
export function prazoDoMes(calendarizacao?: string | null): string | null {
  if (!calendarizacao) return null;
  const valor = String(calendarizacao).trim();

  // Data completa (formato legado do JSONB) já serve como prazo
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

  const partes = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!partes) return null;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  if (mes < 1 || mes > 12) return null;

  // Dia 0 do mês seguinte = último dia deste mês (cobre fevereiro bissexto)
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${partes[1]}-${partes[2]}-${String(ultimoDia).padStart(2, '0')}`;
}

/** Bucket privado das evidências — ver migration 20260817120000. */
const BUCKET_EVIDENCIAS = 'pdi-evidencias';

/** Limite do relato de evidências. Campo de texto, não de anexo. */
const LIMITE_EVIDENCIAS = 5000;

/**
 * Quem pode abrir um plano: o dono, o líder direto do dono, e RH/diretoria.
 * Devolve o plano para quem chamou não precisar buscá-lo de novo.
 */
async function planoComAcesso(
  supabase: SupabaseClient,
  planId: string,
  userId: string,
  isHR: boolean,
) {
  const { data: plan } = await supabase
    .from('development_plans')
    .select('id, employee_id')
    .eq('id', planId)
    .single();
  if (!plan) throw AppError.notFound('PDI não encontrado');

  if (plan.employee_id !== userId && !isHR) {
    const { data: dono } = await supabase
      .from('users')
      .select('reports_to')
      .eq('id', plan.employee_id)
      .single();
    if (dono?.reports_to !== userId) {
      throw AppError.forbidden('Você não pode ver o PDI de outra pessoa');
    }
  }
  return plan;
}

export const pdiActionsService = {
  /** Garante id em todos os itens (muta uma cópia) e devolve a lista. */
  ensureItemIds(items: PDIItem[]): PDIItem[] {
    return (items || []).map((item) => ({
      ...item,
      id: item.id && String(item.id).trim() !== '' ? item.id : randomUUID(),
    }));
  },

  /**
   * Espelha os itens do JSONB na tabela pdi_actions: upsert dos presentes e
   * remoção dos ausentes. O material indicado (course_id/course_url) não é
   * tocado — não vem do JSONB e sobrevive a qualquer edição do plano.
   *
   * O `due_date` é derivado da calendarização, então acompanha o mês que o líder
   * escolheu: mudou de março para abril, o prazo muda junto.
   *
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
          due_date: prazoDoMes(item.calendarizacao),
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

  /**
   * Ações normalizadas de um plano, para quem gerencia o PDI de outra pessoa.
   * As telas legadas leem o JSONB, que não conhece curso nem prazo — é por aqui
   * que o líder enxerga (e edita) o que só existe na tabela.
   */
  async planActions(supabase: SupabaseClient, planId: string, userId: string, isHR: boolean) {
    // O dono lê o próprio (só não edita status/prazo). Fora isso: RH, ou o
    // líder direto — ser líder de alguém não dá acesso ao PDI de quem não é
    // seu liderado.
    const plan = await planoComAcesso(supabase, planId, userId, isHR);

    const { data: actions, error } = await supabase
      .from('pdi_actions')
      .select('*, course:courses!pdi_actions_course_id_fkey(id, title)')
      .eq('development_plan_id', planId)
      .order('position');
    if (error) throw AppError.internal(`Erro ao listar ações: ${error.message}`);

    const anexos = await pdiActionsService.anexosDoPlano(supabase, planId);
    return {
      plan_id: planId,
      employee_id: plan.employee_id,
      actions: (actions || []).map((a: any) => ({ ...a, attachments: anexos.get(a.id) || [] })),
    };
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

    const anexos = await pdiActionsService.anexosDoPlano(supabase, plan.id);
    return {
      plan_id: plan.id,
      actions: (actions || []).map((a: any) => ({ ...a, attachments: anexos.get(a.id) || [] })),
    };
  },

  /**
   * Atualiza status/prazo/curso de uma ação. Status é espelhado de volta no
   * JSONB (as telas legadas continuam coerentes); due_date/course_id só tabela.
   *
   * Quem pode: o líder direto do dono do plano (users.reports_to) — e nunca o
   * próprio dono, senão o status vira autodeclaração: atestar que a ação andou
   * é de quem lidera. RH e diretoria editam qualquer PDI, inclusive o próprio,
   * por serem os responsáveis pelo processo.
   */
  async updateAction(
    supabase: SupabaseClient,
    planId: string,
    actionId: string,
    userId: string,
    input: {
      status?: string;
      due_date?: string | null;
      course_id?: string | null;
      course_url?: string | null;
      course_url_title?: string | null;
    },
    isHR: boolean,
  ) {
    const { data: plan } = await supabase
      .from('development_plans')
      .select('id, employee_id, items')
      .eq('id', planId)
      .single();
    if (!plan) throw AppError.notFound('PDI não encontrado');

    if (!isHR) {
      if (plan.employee_id === userId) {
        throw AppError.forbidden(
          'O PDI é acompanhado pelo seu líder: só ele registra status e prazo das suas ações.',
        );
      }

      const { data: dono } = await supabase
        .from('users')
        .select('reports_to')
        .eq('id', plan.employee_id)
        .single();
      if (dono?.reports_to !== userId) {
        throw AppError.forbidden('Você só pode alterar o PDI de quem se reporta a você.');
      }
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
    if (input.course_url !== undefined) {
      updates.course_url = input.course_url ? normalizeCourseUrl(input.course_url) : null;
    }
    if (input.course_url_title !== undefined) {
      updates.course_url_title = input.course_url_title?.trim() || null;
    }

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

  // ===== EVIDÊNCIAS E ANEXOS (por item) =====

  /**
   * Relato do que a pessoa fez na ação. Quem escreve é o dono do plano — é a
   * contrapartida do status, que só o líder registra: um lado relata, o outro
   * atesta. RH edita para corrigir.
   */
  async updateEvidencias(
    supabase: SupabaseClient,
    planId: string,
    actionId: string,
    userId: string,
    evidencias: string | null,
    isHR: boolean,
  ) {
    const plan = await planoComAcesso(supabase, planId, userId, isHR);
    if (plan.employee_id !== userId && !isHR) {
      throw AppError.forbidden('As evidências são escritas pelo próprio colaborador.');
    }

    const texto = (evidencias || '').trim();
    if (texto.length > LIMITE_EVIDENCIAS) {
      throw AppError.badRequest(`As evidências devem ter até ${LIMITE_EVIDENCIAS} caracteres.`);
    }

    const { data: action, error } = await supabase
      .from('pdi_actions')
      .update({ evidencias: texto || null, updated_at: new Date().toISOString() })
      .eq('development_plan_id', planId)
      .eq('id', actionId)
      .select('*, course:courses!pdi_actions_course_id_fkey(id, title)')
      .single();
    if (error || !action) throw AppError.notFound('Ação não encontrada');
    return action;
  },

  /** Anexos de todas as ações de um plano, agrupados por ação. */
  async anexosDoPlano(supabase: SupabaseClient, planId: string) {
    const { data } = await supabase
      .from('pdi_action_attachments')
      .select('id, action_id, file_name, content_type, file_size, uploaded_by, created_at')
      .eq('development_plan_id', planId)
      .order('created_at');

    const porAcao = new Map<string, any[]>();
    (data || []).forEach((anexo: any) => {
      const lista = porAcao.get(anexo.action_id) || [];
      lista.push(anexo);
      porAcao.set(anexo.action_id, lista);
    });
    return porAcao;
  },

  /**
   * Guarda um arquivo de evidência. Sobe primeiro para o Storage e só então
   * grava a linha: registro sem arquivo viraria anexo que não abre.
   *
   * Podem anexar o dono, o líder direto e o RH — o líder também precisa juntar
   * material ao acompanhamento (ata de mentoria, feedback escrito).
   */
  async addAttachment(
    supabase: SupabaseClient,
    planId: string,
    actionId: string,
    userId: string,
    isHR: boolean,
    arquivo: { filename: string; contentType: string; buffer: Buffer },
  ) {
    await planoComAcesso(supabase, planId, userId, isHR);

    const { data: acao } = await supabase
      .from('pdi_actions')
      .select('id')
      .eq('development_plan_id', planId)
      .eq('id', actionId)
      .single();
    if (!acao) throw AppError.notFound('Ação não encontrada');

    const nomeSeguro = arquivo.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const path = `${planId}/${actionId}/${Date.now()}_${nomeSeguro}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_EVIDENCIAS)
      .upload(path, arquivo.buffer, { contentType: arquivo.contentType, upsert: false });
    if (uploadError) {
      throw AppError.internal(`Erro no upload do anexo: ${uploadError.message}`);
    }

    const { data: anexo, error } = await supabase
      .from('pdi_action_attachments')
      .insert({
        development_plan_id: planId,
        action_id: actionId,
        file_name: arquivo.filename,
        storage_path: path,
        content_type: arquivo.contentType,
        file_size: arquivo.buffer.length,
        uploaded_by: userId,
      })
      .select('id, action_id, file_name, content_type, file_size, uploaded_by, created_at')
      .single();

    if (error || !anexo) {
      // Sem a linha o arquivo é inalcançável: tirar do Storage evita lixo.
      await supabase.storage.from(BUCKET_EVIDENCIAS).remove([path]);
      throw AppError.internal('Erro ao registrar o anexo');
    }
    return anexo;
  },

  /**
   * URL temporária para baixar um anexo. O bucket é privado, então este é o
   * único caminho de leitura — e ele passa pela mesma checagem de acesso do
   * plano.
   */
  async attachmentUrl(
    supabase: SupabaseClient,
    attachmentId: string,
    userId: string,
    isHR: boolean,
  ) {
    const { data: anexo } = await supabase
      .from('pdi_action_attachments')
      .select('id, development_plan_id, file_name, storage_path')
      .eq('id', attachmentId)
      .single();
    if (!anexo) throw AppError.notFound('Anexo não encontrado');

    await planoComAcesso(supabase, anexo.development_plan_id, userId, isHR);

    const { data, error } = await supabase.storage
      .from(BUCKET_EVIDENCIAS)
      .createSignedUrl(anexo.storage_path, 300, { download: anexo.file_name });
    if (error || !data?.signedUrl) {
      throw AppError.internal('Não foi possível gerar o link do anexo');
    }
    return { url: data.signedUrl, file_name: anexo.file_name };
  },

  /** Remove o anexo. Só quem subiu (ou o RH) desfaz. */
  async removeAttachment(
    supabase: SupabaseClient,
    attachmentId: string,
    userId: string,
    isHR: boolean,
  ) {
    const { data: anexo } = await supabase
      .from('pdi_action_attachments')
      .select('id, development_plan_id, storage_path, uploaded_by')
      .eq('id', attachmentId)
      .single();
    if (!anexo) throw AppError.notFound('Anexo não encontrado');

    await planoComAcesso(supabase, anexo.development_plan_id, userId, isHR);
    if (anexo.uploaded_by !== userId && !isHR) {
      throw AppError.forbidden('Só quem anexou o arquivo pode removê-lo.');
    }

    const { error } = await supabase.from('pdi_action_attachments').delete().eq('id', attachmentId);
    if (error) throw AppError.internal('Erro ao remover o anexo');

    await supabase.storage.from(BUCKET_EVIDENCIAS).remove([anexo.storage_path]);
    return { id: attachmentId };
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
