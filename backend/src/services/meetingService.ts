import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/**
 * Módulo de reuniões 1:1 (fase 4 do roadmap). Client sempre admin
 * (authReq.supabase = service_role); permissões aplicadas aqui.
 *
 * Visibilidade: organizador e participantes veem a reunião; admin/diretoria
 * vê a agenda de todos, mas anotações privadas são SEMPRE só do autor.
 */

const MEETING_SELECT = `
  *,
  type:meeting_types!meetings_type_id_fkey(id, name),
  organizer:users!meetings_organizer_id_fkey(id, name, position, reports_to),
  participants:meeting_participants(user_id, user:users(id, name, position, reports_to))
`;

export interface CreateMeetingInput {
  organizerId: string;
  typeId: string;
  title?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string | null;
  meetingUrl?: string | null;
  participantIds: string[];
  recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly';
  topics?: string[];
}

function nextOccurrenceDate(scheduledAt: string, recurrence: string): Date | null {
  const date = new Date(scheduledAt);
  switch (recurrence) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date;
}

async function assertCanAccessMeeting(
  supabase: SupabaseClient,
  meetingId: string,
  userId: string,
  privileged: boolean,
): Promise<any> {
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*, participants:meeting_participants(user_id)')
    .eq('id', meetingId)
    .single();
  if (!meeting) throw AppError.notFound('Reunião não encontrada');

  const isParticipant =
    meeting.organizer_id === userId ||
    (meeting.participants || []).some((p: any) => p.user_id === userId);
  if (!isParticipant && !privileged) {
    throw AppError.forbidden('Você não participa desta reunião');
  }
  return meeting;
}

export const meetingService = {
  async listTypes(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('active', true)
      .order('position');
    if (error) throw AppError.internal(`Erro ao listar tipos: ${error.message}`);
    return data || [];
  },

  async create(supabase: SupabaseClient, input: CreateMeetingInput) {
    const participantIds = Array.from(new Set(input.participantIds)).filter(
      (id) => id !== input.organizerId,
    );
    if (participantIds.length === 0) {
      throw AppError.badRequest('A reunião precisa de ao menos um participante além de você');
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        type_id: input.typeId,
        organizer_id: input.organizerId,
        title: input.title || null,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes || 30,
        location: input.location || null,
        meeting_url: input.meetingUrl || null,
        recurrence: input.recurrence || 'none',
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao criar reunião: ${error.message}`);

    await supabase
      .from('meeting_participants')
      .insert(participantIds.map((user_id) => ({ meeting_id: meeting.id, user_id })));

    if (input.topics?.length) {
      await supabase.from('meeting_topics').insert(
        input.topics
          .filter((t) => t.trim())
          .map((text, position) => ({
            meeting_id: meeting.id,
            text: text.trim(),
            position,
            created_by: input.organizerId,
          })),
      );
    }

    return this.getById(supabase, meeting.id, input.organizerId, true);
  },

  async list(
    supabase: SupabaseClient,
    userId: string,
    scope: 'upcoming' | 'past',
    privileged: boolean,
    all = false,
  ) {
    // Reuniões em que participa (organizador ou participante); admin com
    // all=true enxerga a agenda geral
    const now = new Date().toISOString();

    let query = supabase.from('meetings').select(MEETING_SELECT);
    if (!(privileged && all)) {
      const { data: memberOf } = await supabase
        .from('meeting_participants')
        .select('meeting_id')
        .eq('user_id', userId);
      const ids = (memberOf || []).map((m: any) => m.meeting_id);
      const orParts = [`organizer_id.eq.${userId}`];
      if (ids.length > 0) orParts.push(`id.in.(${ids.join(',')})`);
      query = query.or(orParts.join(','));
    }

    if (scope === 'upcoming') {
      query = query
        .gte('scheduled_at', now)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });
    } else {
      query = query
        .or(`scheduled_at.lt.${now},status.neq.scheduled`)
        .order('scheduled_at', { ascending: false })
        .limit(100);
    }

    const { data, error } = await query;
    if (error) throw AppError.internal(`Erro ao listar reuniões: ${error.message}`);
    return data || [];
  },

  async getById(supabase: SupabaseClient, meetingId: string, userId: string, privileged: boolean) {
    await assertCanAccessMeeting(supabase, meetingId, userId, privileged);

    const { data, error } = await supabase
      .from('meetings')
      .select(
        `${MEETING_SELECT},
        topics:meeting_topics(id, text, position, covered),
        notes:meeting_notes(id, author_id, content, is_private, created_at, author:users(id, name)),
        tasks:meeting_tasks(id, description, assignee_id, due_date, done_at, assignee:users(id, name))`,
      )
      .eq('id', meetingId)
      .single();
    if (error || !data) throw AppError.notFound('Reunião não encontrada');

    // Anotações privadas: apenas o autor vê (nem admin)
    data.notes = (data.notes || []).filter((n: any) => !n.is_private || n.author_id === userId);
    data.topics = (data.topics || []).sort((a: any, b: any) => a.position - b.position);
    return data;
  },

  async update(
    supabase: SupabaseClient,
    meetingId: string,
    userId: string,
    input: Partial<{
      title: string | null;
      scheduledAt: string;
      durationMinutes: number;
      location: string | null;
      meetingUrl: string | null;
      typeId: string;
      recurrence: string;
    }>,
  ) {
    const meeting = await assertCanAccessMeeting(supabase, meetingId, userId, false);
    if (meeting.organizer_id !== userId) {
      throw AppError.forbidden('Só o organizador pode editar a reunião');
    }
    if (meeting.status !== 'scheduled') {
      throw AppError.badRequest('Só é possível editar reuniões agendadas');
    }

    const { error } = await supabase
      .from('meetings')
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.scheduledAt ? { scheduled_at: input.scheduledAt } : {}),
        ...(input.durationMinutes ? { duration_minutes: input.durationMinutes } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.meetingUrl !== undefined ? { meeting_url: input.meetingUrl } : {}),
        ...(input.typeId ? { type_id: input.typeId } : {}),
        ...(input.recurrence ? { recurrence: input.recurrence } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);
    if (error) throw AppError.internal(`Erro ao atualizar reunião: ${error.message}`);
    return this.getById(supabase, meetingId, userId, false);
  },

  /**
   * Conclui ou cancela. Concluir uma reunião recorrente materializa a
   * próxima ocorrência (mesmos participantes/tipo, sem pauta/notas).
   */
  async setStatus(
    supabase: SupabaseClient,
    meetingId: string,
    userId: string,
    status: 'completed' | 'cancelled',
  ) {
    const meeting = await assertCanAccessMeeting(supabase, meetingId, userId, false);
    if (meeting.status !== 'scheduled') {
      throw AppError.badRequest('Reunião já concluída ou cancelada');
    }

    const { error } = await supabase
      .from('meetings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
      .eq('status', 'scheduled');
    if (error) throw AppError.internal(`Erro ao atualizar status: ${error.message}`);

    let next = null;
    if (status === 'completed' && meeting.recurrence !== 'none') {
      next = await this.materializeNext(supabase, meeting);
    }
    return { status, next };
  },

  /** Cria a próxima ocorrência de uma reunião recorrente (idempotente). */
  async materializeNext(supabase: SupabaseClient, meeting: any) {
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('parent_meeting_id', meeting.id)
      .limit(1);
    if (existing && existing.length > 0) return null;

    const nextDate = nextOccurrenceDate(meeting.scheduled_at, meeting.recurrence);
    if (!nextDate) return null;
    // Se a próxima data já passou (reunião antiga), avança até o futuro
    while (nextDate < new Date()) {
      const advanced = nextOccurrenceDate(nextDate.toISOString(), meeting.recurrence);
      if (!advanced) return null;
      nextDate.setTime(advanced.getTime());
    }

    const { data: next, error } = await supabase
      .from('meetings')
      .insert({
        type_id: meeting.type_id,
        organizer_id: meeting.organizer_id,
        title: meeting.title,
        scheduled_at: nextDate.toISOString(),
        duration_minutes: meeting.duration_minutes,
        location: meeting.location,
        meeting_url: meeting.meeting_url,
        recurrence: meeting.recurrence,
        parent_meeting_id: meeting.id,
      })
      .select()
      .single();
    if (error || !next) return null;

    const { data: participants } = await supabase
      .from('meeting_participants')
      .select('user_id')
      .eq('meeting_id', meeting.id);
    if (participants?.length) {
      await supabase
        .from('meeting_participants')
        .insert(participants.map((p: any) => ({ meeting_id: next.id, user_id: p.user_id })));
    }
    return next;
  },

  // ===== PAUTA =====

  async addTopic(supabase: SupabaseClient, meetingId: string, userId: string, text: string) {
    await assertCanAccessMeeting(supabase, meetingId, userId, false);
    const { data, error } = await supabase
      .from('meeting_topics')
      .insert({ meeting_id: meetingId, text, created_by: userId, position: 99 })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao adicionar pauta: ${error.message}`);
    return data;
  },

  async setTopicCovered(
    supabase: SupabaseClient,
    meetingId: string,
    topicId: string,
    userId: string,
    covered: boolean,
  ) {
    await assertCanAccessMeeting(supabase, meetingId, userId, false);
    await supabase
      .from('meeting_topics')
      .update({ covered })
      .eq('id', topicId)
      .eq('meeting_id', meetingId);
  },

  // ===== ANOTAÇÕES =====

  async addNote(
    supabase: SupabaseClient,
    meetingId: string,
    userId: string,
    content: string,
    isPrivate: boolean,
  ) {
    await assertCanAccessMeeting(supabase, meetingId, userId, false);
    const { data, error } = await supabase
      .from('meeting_notes')
      .insert({ meeting_id: meetingId, author_id: userId, content, is_private: isPrivate })
      .select('*, author:users(id, name)')
      .single();
    if (error) throw AppError.internal(`Erro ao salvar anotação: ${error.message}`);
    return data;
  },

  async deleteNote(supabase: SupabaseClient, meetingId: string, noteId: string, userId: string) {
    const { error } = await supabase
      .from('meeting_notes')
      .delete()
      .eq('id', noteId)
      .eq('meeting_id', meetingId)
      .eq('author_id', userId);
    if (error) throw AppError.internal(`Erro ao excluir anotação: ${error.message}`);
  },

  // ===== TAREFAS =====

  async addTask(
    supabase: SupabaseClient,
    meetingId: string,
    userId: string,
    input: { description: string; assigneeId?: string | null; dueDate?: string | null },
  ) {
    await assertCanAccessMeeting(supabase, meetingId, userId, false);
    const { data, error } = await supabase
      .from('meeting_tasks')
      .insert({
        meeting_id: meetingId,
        description: input.description,
        assignee_id: input.assigneeId || null,
        due_date: input.dueDate || null,
        created_by: userId,
      })
      .select('*, assignee:users(id, name)')
      .single();
    if (error) throw AppError.internal(`Erro ao criar tarefa: ${error.message}`);
    return data;
  },

  async setTaskDone(
    supabase: SupabaseClient,
    meetingId: string,
    taskId: string,
    userId: string,
    done: boolean,
  ) {
    await assertCanAccessMeeting(supabase, meetingId, userId, false);
    await supabase
      .from('meeting_tasks')
      .update({ done_at: done ? new Date().toISOString() : null })
      .eq('id', taskId)
      .eq('meeting_id', meetingId);
  },

  /** Participantes (ids) de uma reunião — para notificações. */
  async getParticipantIds(supabase: SupabaseClient, meetingId: string): Promise<string[]> {
    const { data } = await supabase
      .from('meeting_participants')
      .select('user_id')
      .eq('meeting_id', meetingId);
    return (data || []).map((p: any) => p.user_id);
  },
};
