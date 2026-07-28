import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/**
 * Módulo de feedback contínuo (fase 3 do roadmap).
 * O client recebido é sempre o admin (authReq.supabase = service_role);
 * as regras de permissão ficam nos controllers/aqui, não no RLS.
 */

export interface CreateFeedbackInput {
  authorId: string;
  recipientId: string;
  typeId: string;
  message: string;
  competencies?: string[];
  internalNote?: string | null;
  requestId?: string | null;
}

const FEEDBACK_SELECT = `
  *,
  author:users!feedbacks_author_id_fkey(id, name, position, profile_image),
  recipient:users!feedbacks_recipient_id_fkey(id, name, position, profile_image),
  type:feedback_types!feedbacks_type_id_fkey(id, name, color, icon, restricted_to_admin)
`;

/** Remove a observação interna para quem não é admin/diretoria. */
function stripInternalNote<T extends { internal_note?: unknown }>(row: T, privileged: boolean): T {
  if (privileged) return row;
  const { internal_note: _omit, ...rest } = row as any;
  return rest;
}

export const feedbackService = {
  // ===== TIPOS =====

  async listTypes(supabase: SupabaseClient, includeInactive = false) {
    let query = supabase.from('feedback_types').select('*').order('position');
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw AppError.internal(`Erro ao listar tipos: ${error.message}`);
    return data || [];
  },

  async createType(
    supabase: SupabaseClient,
    input: {
      name: string;
      color?: string;
      icon?: string;
      restricted_to_admin?: boolean;
      position?: number;
    },
  ) {
    const { data, error } = await supabase
      .from('feedback_types')
      .insert({
        name: input.name,
        color: input.color || 'gray',
        icon: input.icon || 'MessageSquare',
        restricted_to_admin: input.restricted_to_admin ?? false,
        position: input.position ?? 99,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao criar tipo: ${error.message}`);
    return data;
  },

  async updateType(
    supabase: SupabaseClient,
    id: string,
    input: Partial<{
      name: string;
      color: string;
      icon: string;
      restricted_to_admin: boolean;
      active: boolean;
      position: number;
    }>,
  ) {
    const { data, error } = await supabase
      .from('feedback_types')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao atualizar tipo: ${error.message}`);
    return data;
  },

  // ===== FEEDBACKS =====

  async createFeedback(
    supabase: SupabaseClient,
    input: CreateFeedbackInput,
    isPrivileged: boolean,
  ) {
    if (input.authorId === input.recipientId) {
      throw AppError.badRequest('Você não pode enviar feedback para si mesmo');
    }

    // Destinatário precisa existir e estar ativo
    const { data: recipient } = await supabase
      .from('users')
      .select('id, active')
      .eq('id', input.recipientId)
      .single();
    if (!recipient || recipient.active === false) {
      throw AppError.badRequest('Destinatário inválido ou inativo');
    }

    // Tipo precisa existir, estar ativo e respeitar a restrição
    const { data: type } = await supabase
      .from('feedback_types')
      .select('id, name, active, restricted_to_admin')
      .eq('id', input.typeId)
      .single();
    if (!type || !type.active) {
      throw AppError.badRequest('Tipo de feedback inválido ou inativo');
    }
    if (type.restricted_to_admin && !isPrivileged) {
      throw AppError.forbidden(`O tipo "${type.name}" é restrito ao RH/diretoria`);
    }

    // Se responde a uma solicitação, ela precisa ser do autor e estar pendente
    if (input.requestId) {
      const { data: request } = await supabase
        .from('feedback_requests')
        .select('id, requester_id, requested_id, status')
        .eq('id', input.requestId)
        .single();
      if (!request || request.requested_id !== input.authorId || request.status !== 'pending') {
        throw AppError.badRequest('Solicitação de feedback inválida');
      }
      if (request.requester_id !== input.recipientId) {
        throw AppError.badRequest('O destinatário não corresponde à solicitação');
      }
    }

    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert({
        author_id: input.authorId,
        recipient_id: input.recipientId,
        type_id: input.typeId,
        message: input.message,
        competencies: input.competencies || [],
        internal_note: isPrivileged ? input.internalNote || null : null,
        request_id: input.requestId || null,
      })
      .select(FEEDBACK_SELECT)
      .single();
    if (error) throw AppError.internal(`Erro ao criar feedback: ${error.message}`);

    if (input.requestId) {
      await supabase
        .from('feedback_requests')
        .update({
          status: 'fulfilled',
          feedback_id: feedback.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.requestId);
    }

    return feedback;
  },

  async listForUser(
    supabase: SupabaseClient,
    userId: string,
    box: 'received' | 'sent',
    options: { page?: number; limit?: number; typeId?: string } = {},
    isPrivileged = false,
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const from = (page - 1) * limit;

    const column = box === 'received' ? 'recipient_id' : 'author_id';
    let query = supabase
      .from('feedbacks')
      .select(FEEDBACK_SELECT, { count: 'exact' })
      .eq(column, userId);
    if (options.typeId) query = query.eq('type_id', options.typeId);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw AppError.internal(`Erro ao listar feedbacks: ${error.message}`);

    // Observação interna nunca aparece nas caixas pessoais (mesmo para o autor
    // privilegiado, a fonte de consulta dela é a visão administrativa)
    const rows = (data || []).map((r: any) => stripInternalNote(r, false));
    const total = count || 0;
    void isPrivileged;
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /** Contagem de feedbacks por tipo (cards da caixa recebidos/enviados). */
  async summaryForUser(supabase: SupabaseClient, userId: string, box: 'received' | 'sent') {
    const column = box === 'received' ? 'recipient_id' : 'author_id';
    const { data, error } = await supabase.from('feedbacks').select('type_id').eq(column, userId);
    if (error) throw AppError.internal(`Erro no resumo de feedbacks: ${error.message}`);

    const counts = new Map<string, number>();
    (data || []).forEach((row: any) => {
      counts.set(row.type_id, (counts.get(row.type_id) || 0) + 1);
    });

    return {
      total: (data || []).length,
      by_type: Object.fromEntries(counts),
    };
  },

  async adminList(
    supabase: SupabaseClient,
    filters: {
      page?: number;
      limit?: number;
      typeId?: string;
      userId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 25, 100);
    const rangeFrom = (page - 1) * limit;

    let query = supabase.from('feedbacks').select(FEEDBACK_SELECT, { count: 'exact' });
    if (filters.typeId) query = query.eq('type_id', filters.typeId);
    if (filters.userId) {
      query = query.or(`author_id.eq.${filters.userId},recipient_id.eq.${filters.userId}`);
    }
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(rangeFrom, rangeFrom + limit - 1);
    if (error) throw AppError.internal(`Erro ao listar feedbacks: ${error.message}`);

    const total = count || 0;
    return { data: data || [], total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async markRead(supabase: SupabaseClient, feedbackId: string, userId: string) {
    await supabase
      .from('feedbacks')
      .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', feedbackId)
      .eq('recipient_id', userId)
      .is('read_at', null);
  },

  async acknowledge(
    supabase: SupabaseClient,
    feedbackId: string,
    userId: string,
    comment?: string,
  ) {
    const { data, error } = await supabase
      .from('feedbacks')
      .update({
        acknowledged_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
        recipient_comment: comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)
      .eq('recipient_id', userId)
      .is('acknowledged_at', null)
      .select(FEEDBACK_SELECT)
      .single();
    if (error || !data) {
      throw AppError.badRequest('Feedback não encontrado ou já confirmado');
    }
    return stripInternalNote(data, false);
  },

  async deleteFeedback(
    supabase: SupabaseClient,
    feedbackId: string,
    userId: string,
    isPrivileged: boolean,
  ) {
    const { data: feedback } = await supabase
      .from('feedbacks')
      .select('id, author_id, read_at')
      .eq('id', feedbackId)
      .single();
    if (!feedback) throw AppError.notFound('Feedback não encontrado');

    const isAuthorUnread = feedback.author_id === userId && !feedback.read_at;
    if (!isAuthorUnread && !isPrivileged) {
      throw AppError.forbidden('Só é possível excluir feedbacks próprios ainda não lidos');
    }

    const { error } = await supabase.from('feedbacks').delete().eq('id', feedbackId);
    if (error) throw AppError.internal(`Erro ao excluir feedback: ${error.message}`);
    return feedback;
  },

  // ===== SOLICITAÇÕES =====

  async createRequest(
    supabase: SupabaseClient,
    requesterId: string,
    requestedId: string,
    message?: string,
  ) {
    if (requesterId === requestedId) {
      throw AppError.badRequest('Você não pode solicitar feedback a si mesmo');
    }

    // Evita fila de solicitações duplicadas pendentes para a mesma pessoa
    const { data: existing } = await supabase
      .from('feedback_requests')
      .select('id')
      .eq('requester_id', requesterId)
      .eq('requested_id', requestedId)
      .eq('status', 'pending')
      .limit(1);
    if (existing && existing.length > 0) {
      throw AppError.badRequest('Você já tem uma solicitação pendente para esta pessoa');
    }

    const { data, error } = await supabase
      .from('feedback_requests')
      .insert({ requester_id: requesterId, requested_id: requestedId, message: message || null })
      .select(
        `*,
        requester:users!feedback_requests_requester_id_fkey(id, name, position),
        requested:users!feedback_requests_requested_id_fkey(id, name, position)`,
      )
      .single();
    if (error) throw AppError.internal(`Erro ao criar solicitação: ${error.message}`);
    return data;
  },

  async listRequests(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('feedback_requests')
      .select(
        `*,
        requester:users!feedback_requests_requester_id_fkey(id, name, position),
        requested:users!feedback_requests_requested_id_fkey(id, name, position)`,
      )
      .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw AppError.internal(`Erro ao listar solicitações: ${error.message}`);

    const rows = data || [];
    return {
      received: rows.filter((r: any) => r.requested_id === userId),
      sent: rows.filter((r: any) => r.requester_id === userId),
    };
  },

  async declineRequest(supabase: SupabaseClient, requestId: string, userId: string) {
    const { data, error } = await supabase
      .from('feedback_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('requested_id', userId)
      .eq('status', 'pending')
      .select()
      .single();
    if (error || !data) {
      throw AppError.badRequest('Solicitação não encontrada ou já respondida');
    }
    return data;
  },
};
