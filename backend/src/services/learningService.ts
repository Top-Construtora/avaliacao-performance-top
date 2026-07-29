import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/**
 * Módulo de Learning (fase 5A do roadmap). Client sempre admin
 * (authReq.supabase = service_role); permissões aplicadas nos controllers.
 *
 * Progresso = conteúdos OBRIGATÓRIOS concluídos / total de obrigatórios.
 * 100% marca a inscrição como concluída (respeitando o prazo da turma).
 */

const CLASS_SELECT = `
  *,
  course:courses!course_classes_course_id_fkey(id, title, description, category, workload_hours, cover_url, active)
`;

export const learningService = {
  // ===== CURSOS (admin) =====

  /**
   * Lista enxuta para preencher seletor (id + título dos cursos ativos).
   * Existe separada de listCourses porque aquela é adminOnly e devolve contagens
   * e metadados de gestão — o líder que vai indicar um curso no PDI do liderado
   * não precisa (nem deve ter) esse acesso.
   */
  async courseOptions(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .eq('active', true)
      .order('title');
    if (error) throw AppError.internal(`Erro ao listar cursos: ${error.message}`);
    return data || [];
  },

  async listCourses(supabase: SupabaseClient, includeInactive = false) {
    let query = supabase
      .from('courses')
      .select('*, contents:course_contents(id), classes:course_classes(id)')
      .order('created_at', { ascending: false });
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw AppError.internal(`Erro ao listar cursos: ${error.message}`);
    return (data || []).map((c: any) => ({
      ...c,
      contents_count: (c.contents || []).length,
      classes_count: (c.classes || []).length,
      contents: undefined,
      classes: undefined,
    }));
  },

  async createCourse(
    supabase: SupabaseClient,
    input: {
      title: string;
      description?: string | null;
      category?: string | null;
      workloadHours?: number | null;
      coverUrl?: string | null;
      createdBy: string;
    },
  ) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        workload_hours: input.workloadHours ?? null,
        cover_url: input.coverUrl || null,
        created_by: input.createdBy,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao criar curso: ${error.message}`);
    return data;
  },

  async updateCourse(supabase: SupabaseClient, id: string, input: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('courses')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao atualizar curso: ${error.message}`);
    return data;
  },

  async getCourseDetail(supabase: SupabaseClient, courseId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(
        `*,
        contents:course_contents(id, section, title, type, url, mandatory, position),
        classes:course_classes(id, name, start_date, end_date, allow_late_completion, self_enrollment, active,
          enrollments:class_enrollments(id))`,
      )
      .eq('id', courseId)
      .single();
    if (error || !data) throw AppError.notFound('Curso não encontrado');
    data.contents = (data.contents || []).sort((a: any, b: any) => a.position - b.position);
    data.classes = (data.classes || []).map((cl: any) => ({
      ...cl,
      enrollments_count: (cl.enrollments || []).length,
      enrollments: undefined,
    }));
    return data;
  },

  // ===== CONTEÚDOS (admin) =====

  async addContent(
    supabase: SupabaseClient,
    courseId: string,
    input: {
      section?: string | null;
      title: string;
      type: 'video' | 'link' | 'file';
      url: string;
      mandatory?: boolean;
      position?: number;
    },
  ) {
    const { data, error } = await supabase
      .from('course_contents')
      .insert({
        course_id: courseId,
        section: input.section || null,
        title: input.title,
        type: input.type,
        url: input.url,
        mandatory: input.mandatory ?? true,
        position: input.position ?? 99,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao adicionar conteúdo: ${error.message}`);
    return data;
  },

  async deleteContent(supabase: SupabaseClient, courseId: string, contentId: string) {
    const { error } = await supabase
      .from('course_contents')
      .delete()
      .eq('id', contentId)
      .eq('course_id', courseId);
    if (error) throw AppError.internal(`Erro ao excluir conteúdo: ${error.message}`);
  },

  // ===== TURMAS (admin) =====

  async createClass(
    supabase: SupabaseClient,
    courseId: string,
    input: {
      name: string;
      startDate?: string | null;
      endDate?: string | null;
      allowLateCompletion?: boolean;
      selfEnrollment?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from('course_classes')
      .insert({
        course_id: courseId,
        name: input.name,
        start_date: input.startDate || null,
        end_date: input.endDate || null,
        allow_late_completion: input.allowLateCompletion ?? true,
        self_enrollment: input.selfEnrollment ?? false,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao criar turma: ${error.message}`);
    return data;
  },

  async updateClass(supabase: SupabaseClient, classId: string, input: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('course_classes')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', classId)
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao atualizar turma: ${error.message}`);
    return data;
  },

  /** Inscreve usuários numa turma (ignora quem já está inscrito). */
  async enroll(
    supabase: SupabaseClient,
    classId: string,
    userIds: string[],
    mandatory: boolean,
    enrolledBy: string,
  ): Promise<{ enrolled: string[] }> {
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('user_id')
      .eq('class_id', classId);
    const existingIds = new Set((existing || []).map((e: any) => e.user_id));
    const newIds = Array.from(new Set(userIds)).filter((id) => !existingIds.has(id));
    if (newIds.length === 0) return { enrolled: [] };

    const { error } = await supabase.from('class_enrollments').insert(
      newIds.map((user_id) => ({
        class_id: classId,
        user_id,
        mandatory,
        enrolled_by: enrolledBy,
      })),
    );
    if (error) throw AppError.internal(`Erro ao inscrever: ${error.message}`);
    return { enrolled: newIds };
  },

  /** Acompanhamento da turma: inscritos com progresso. */
  async classOverview(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*, user:users!class_enrollments_user_id_fkey(id, name, position)')
      .eq('class_id', classId)
      .order('progress', { ascending: false });
    if (error) throw AppError.internal(`Erro no acompanhamento: ${error.message}`);
    return data || [];
  },

  // ===== ALUNO =====

  async myEnrollments(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`*, class:course_classes!class_enrollments_class_id_fkey(${CLASS_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw AppError.internal(`Erro ao listar inscrições: ${error.message}`);
    return data || [];
  },

  /** Curso na visão do aluno: conteúdos + o que já concluiu. */
  async enrollmentDetail(supabase: SupabaseClient, enrollmentId: string, userId: string) {
    const { data: enrollment, error } = await supabase
      .from('class_enrollments')
      .select(`*, class:course_classes!class_enrollments_class_id_fkey(${CLASS_SELECT})`)
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .single();
    if (error || !enrollment) throw AppError.notFound('Inscrição não encontrada');

    const courseId = enrollment.class?.course?.id;
    const [{ data: contents }, { data: done }] = await Promise.all([
      supabase
        .from('course_contents')
        .select('id, section, title, type, url, mandatory, position')
        .eq('course_id', courseId)
        .order('position'),
      supabase.from('content_progress').select('content_id').eq('enrollment_id', enrollmentId),
    ]);

    const doneIds = new Set((done || []).map((d: any) => d.content_id));
    return {
      ...enrollment,
      contents: (contents || []).map((c: any) => ({ ...c, done: doneIds.has(c.id) })),
    };
  },

  /** Marca/desmarca conteúdo concluído e recalcula o progresso. */
  async setContentDone(
    supabase: SupabaseClient,
    enrollmentId: string,
    contentId: string,
    userId: string,
    done: boolean,
  ) {
    const { data: enrollment } = await supabase
      .from('class_enrollments')
      .select(
        '*, class:course_classes!class_enrollments_class_id_fkey(id, course_id, end_date, allow_late_completion)',
      )
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .single();
    if (!enrollment) throw AppError.notFound('Inscrição não encontrada');

    // Prazo vencido sem permissão de conclusão tardia → trava o progresso
    const endDate = enrollment.class?.end_date;
    if (
      done &&
      endDate &&
      !enrollment.class?.allow_late_completion &&
      new Date(`${endDate}T23:59:59`) < new Date()
    ) {
      throw AppError.badRequest('O prazo desta turma terminou e ela não aceita conclusão tardia');
    }

    if (done) {
      await supabase
        .from('content_progress')
        .upsert(
          { enrollment_id: enrollmentId, content_id: contentId },
          { onConflict: 'enrollment_id,content_id' },
        );
    } else {
      await supabase
        .from('content_progress')
        .delete()
        .eq('enrollment_id', enrollmentId)
        .eq('content_id', contentId);
    }

    // Recalcula progresso pelos conteúdos obrigatórios
    const courseId = enrollment.class?.course_id;
    const [{ data: mandatoryContents }, { data: doneRows }] = await Promise.all([
      supabase.from('course_contents').select('id').eq('course_id', courseId).eq('mandatory', true),
      supabase.from('content_progress').select('content_id').eq('enrollment_id', enrollmentId),
    ]);

    const mandatoryIds = new Set((mandatoryContents || []).map((c: any) => c.id));
    const doneMandatory = (doneRows || []).filter((d: any) =>
      mandatoryIds.has(d.content_id),
    ).length;
    const total = mandatoryIds.size;
    const progress = total === 0 ? 0 : Math.round((doneMandatory / total) * 100);
    const completed = total > 0 && doneMandatory >= total;

    const wasCompleted = !!enrollment.completed_at;
    await supabase
      .from('class_enrollments')
      .update({
        progress,
        completed_at: completed ? enrollment.completed_at || new Date().toISOString() : null,
      })
      .eq('id', enrollmentId);

    // Conclusão nova: avança trilhas e devolve os ganchos (pesquisa da turma)
    let justCompleted = false;
    let surveyId: string | null = null;
    let unlockedCourse: { id: string; title: string } | null = null;
    if (completed && !wasCompleted) {
      justCompleted = true;
      const { data: cls } = await supabase
        .from('course_classes')
        .select('survey_id')
        .eq('id', enrollment.class?.id ?? enrollment.class_id)
        .single();
      surveyId = cls?.survey_id || null;
      unlockedCourse = await this.advanceTracks(supabase, userId, courseId);
    }

    return { progress, completed, justCompleted, surveyId, unlockedCourse, courseId };
  },

  // ===== TRILHAS =====

  /**
   * Liberação progressiva: ao concluir um curso, inscreve o usuário no
   * próximo curso de cada trilha em que ele participa. Retorna o primeiro
   * curso liberado (para a notificação). Marca a trilha como concluída
   * quando não há próximo curso.
   */
  async advanceTracks(
    supabase: SupabaseClient,
    userId: string,
    completedCourseId: string,
  ): Promise<{ id: string; title: string } | null> {
    const { data: trackEnrollments } = await supabase
      .from('learning_track_enrollments')
      .select('id, track_id')
      .eq('user_id', userId)
      .is('completed_at', null);
    if (!trackEnrollments?.length) return null;

    let unlocked: { id: string; title: string } | null = null;

    for (const te of trackEnrollments) {
      const { data: trackCourses } = await supabase
        .from('learning_track_courses')
        .select(
          'course_id, position, course:courses!learning_track_courses_course_id_fkey(id, title, active)',
        )
        .eq('track_id', te.track_id)
        .order('position');
      const ordered = trackCourses || [];
      const idx = ordered.findIndex((tc: any) => tc.course_id === completedCourseId);
      if (idx === -1) continue;

      // Próximo curso ativo da trilha ainda não concluído pelo usuário
      const remaining = ordered.slice(idx + 1).filter((tc: any) => tc.course?.active);
      if (remaining.length === 0) {
        // Verifica se TODOS os cursos da trilha foram concluídos
        const done = await this.userCompletedCourseIds(supabase, userId);
        const allDone = ordered.every((tc: any) => done.has(tc.course_id));
        if (allDone) {
          await supabase
            .from('learning_track_enrollments')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', te.id);
        }
        continue;
      }

      const next = remaining[0] as any;
      const classId = await this.resolveDefaultClass(supabase, next.course_id);
      if (!classId) continue;

      const { error } = await supabase
        .from('class_enrollments')
        .insert({ class_id: classId, user_id: userId, mandatory: false, enrolled_by: null });
      // 23505 = já inscrito (curso compartilhado entre trilhas) — segue o jogo
      if (!error && !unlocked) {
        unlocked = { id: next.course_id, title: next.course?.title || 'Próximo curso' };
      }
    }
    return unlocked;
  },

  /** Cursos que o usuário já concluiu (qualquer turma). */
  async userCompletedCourseIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
    const { data } = await supabase
      .from('class_enrollments')
      .select('completed_at, class:course_classes!class_enrollments_class_id_fkey(course_id)')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);
    return new Set((data || []).map((e: any) => e.class?.course_id).filter(Boolean));
  },

  /** Turma padrão de um curso; cria "Trilha" se o curso não tiver turma ativa. */
  async resolveDefaultClass(supabase: SupabaseClient, courseId: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from('course_classes')
      .select('id')
      .eq('course_id', courseId)
      .eq('active', true)
      .order('created_at')
      .limit(1);
    if (existing?.length) return existing[0].id;

    const { data: created } = await supabase
      .from('course_classes')
      .insert({ course_id: courseId, name: 'Trilha', allow_late_completion: true })
      .select('id')
      .single();
    return created?.id || null;
  },

  async listTracks(supabase: SupabaseClient, includeInactive = false) {
    let query = supabase
      .from('learning_tracks')
      .select(
        `*,
        courses:learning_track_courses(position, course:courses!learning_track_courses_course_id_fkey(id, title, active)),
        enrollments:learning_track_enrollments(id)`,
      )
      .order('created_at', { ascending: false });
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw AppError.internal(`Erro ao listar trilhas: ${error.message}`);
    return (data || []).map((t: any) => ({
      ...t,
      courses: (t.courses || []).sort((a: any, b: any) => a.position - b.position),
      enrollments_count: (t.enrollments || []).length,
      enrollments: undefined,
    }));
  },

  async createTrack(
    supabase: SupabaseClient,
    input: { name: string; description?: string | null; createdBy: string },
  ) {
    const { data, error } = await supabase
      .from('learning_tracks')
      .insert({
        name: input.name,
        description: input.description || null,
        created_by: input.createdBy,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao criar trilha: ${error.message}`);
    return data;
  },

  async setTrackCourses(
    supabase: SupabaseClient,
    trackId: string,
    courseIds: string[],
  ): Promise<void> {
    await supabase.from('learning_track_courses').delete().eq('track_id', trackId);
    if (courseIds.length > 0) {
      const { error } = await supabase
        .from('learning_track_courses')
        .insert(
          courseIds.map((course_id, position) => ({ track_id: trackId, course_id, position })),
        );
      if (error) throw AppError.internal(`Erro ao montar trilha: ${error.message}`);
    }
  },

  /** Inscreve usuários na trilha e no PRIMEIRO curso dela. */
  async enrollInTrack(
    supabase: SupabaseClient,
    trackId: string,
    userIds: string[],
    enrolledBy: string,
  ): Promise<{ enrolled: string[] }> {
    const { data: trackCourses } = await supabase
      .from('learning_track_courses')
      .select('course_id, position, course:courses!learning_track_courses_course_id_fkey(active)')
      .eq('track_id', trackId)
      .order('position');
    const first = (trackCourses || []).find((tc: any) => tc.course?.active);
    if (!first) throw AppError.badRequest('A trilha precisa de ao menos um curso ativo');

    const { data: existing } = await supabase
      .from('learning_track_enrollments')
      .select('user_id')
      .eq('track_id', trackId);
    const existingIds = new Set((existing || []).map((e: any) => e.user_id));
    const newIds = Array.from(new Set(userIds)).filter((id) => !existingIds.has(id));
    if (newIds.length === 0) return { enrolled: [] };

    const { error } = await supabase
      .from('learning_track_enrollments')
      .insert(newIds.map((user_id) => ({ track_id: trackId, user_id, enrolled_by: enrolledBy })));
    if (error) throw AppError.internal(`Erro ao inscrever na trilha: ${error.message}`);

    const classId = await this.resolveDefaultClass(supabase, first.course_id);
    if (classId) {
      // Ignora conflito para quem já estava no primeiro curso
      for (const user_id of newIds) {
        await supabase
          .from('class_enrollments')
          .insert({ class_id: classId, user_id, mandatory: false, enrolled_by: enrolledBy })
          .then(() => undefined);
      }
    }
    return { enrolled: newIds };
  },

  /** Trilhas do usuário com o status de cada curso (concluído/atual/bloqueado). */
  async myTracks(supabase: SupabaseClient, userId: string) {
    const { data: enrollments, error } = await supabase
      .from('learning_track_enrollments')
      .select(
        'id, track_id, completed_at, track:learning_tracks!learning_track_enrollments_track_id_fkey(id, name, description)',
      )
      .eq('user_id', userId);
    if (error) throw AppError.internal(`Erro ao listar trilhas: ${error.message}`);
    if (!enrollments?.length) return [];

    const done = await this.userCompletedCourseIds(supabase, userId);
    const result = [];
    for (const te of enrollments) {
      const { data: trackCourses } = await supabase
        .from('learning_track_courses')
        .select(
          'course_id, position, course:courses!learning_track_courses_course_id_fkey(id, title, workload_hours)',
        )
        .eq('track_id', te.track_id)
        .order('position');

      let currentFound = false;
      const courses = (trackCourses || []).map((tc: any) => {
        const isDone = done.has(tc.course_id);
        let status: 'completed' | 'current' | 'locked' = 'locked';
        if (isDone) status = 'completed';
        else if (!currentFound) {
          status = 'current';
          currentFound = true;
        }
        return { ...tc.course, status };
      });

      const completedCount = courses.filter((c: any) => c.status === 'completed').length;
      result.push({
        id: te.id,
        track: te.track,
        completed_at: te.completed_at,
        courses,
        progress: courses.length === 0 ? 0 : Math.round((completedCount / courses.length) * 100),
      });
    }
    return result;
  },

  // ===== CATÁLOGO / AUTOINSCRIÇÃO =====

  async catalog(supabase: SupabaseClient, userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: classes, error } = await supabase
      .from('course_classes')
      .select(CLASS_SELECT)
      .eq('self_enrollment', true)
      .eq('active', true)
      .or(`end_date.is.null,end_date.gte.${today}`);
    if (error) throw AppError.internal(`Erro no catálogo: ${error.message}`);

    const { data: mine } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('user_id', userId);
    const myClassIds = new Set((mine || []).map((e: any) => e.class_id));

    return (classes || []).filter((cl: any) => cl.course?.active && !myClassIds.has(cl.id));
  },

  async selfEnroll(supabase: SupabaseClient, classId: string, userId: string) {
    const { data: cls } = await supabase
      .from('course_classes')
      .select('id, self_enrollment, active, end_date')
      .eq('id', classId)
      .single();
    if (!cls || !cls.active || !cls.self_enrollment) {
      throw AppError.badRequest('Turma não disponível para autoinscrição');
    }
    if (cls.end_date && new Date(`${cls.end_date}T23:59:59`) < new Date()) {
      throw AppError.badRequest('Turma já encerrada');
    }

    const { data, error } = await supabase
      .from('class_enrollments')
      .insert({ class_id: classId, user_id: userId, mandatory: false, enrolled_by: userId })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw AppError.badRequest('Você já está inscrito nesta turma');
      throw AppError.internal(`Erro na inscrição: ${error.message}`);
    }
    return data;
  },

  // ===== CURSOS EXTERNOS =====

  async myExternalCourses(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('external_courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw AppError.internal(`Erro ao listar cursos externos: ${error.message}`);
    return data || [];
  },

  async submitExternalCourse(
    supabase: SupabaseClient,
    userId: string,
    input: {
      name: string;
      institution?: string | null;
      workloadHours?: number | null;
      completedAt?: string | null;
      certificateUrl?: string | null;
    },
  ) {
    const { data, error } = await supabase
      .from('external_courses')
      .insert({
        user_id: userId,
        name: input.name,
        institution: input.institution || null,
        workload_hours: input.workloadHours ?? null,
        completed_at: input.completedAt || null,
        certificate_url: input.certificateUrl || null,
      })
      .select()
      .single();
    if (error) throw AppError.internal(`Erro ao registrar curso externo: ${error.message}`);
    return data;
  },

  async pendingExternalCourses(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('external_courses')
      .select('*, user:users!external_courses_user_id_fkey(id, name, position)')
      .eq('status', 'pending')
      .order('created_at');
    if (error) throw AppError.internal(`Erro ao listar pendentes: ${error.message}`);
    return data || [];
  },

  async reviewExternalCourse(
    supabase: SupabaseClient,
    id: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    note?: string,
  ) {
    const { data, error } = await supabase
      .from('external_courses')
      .update({
        status,
        reviewed_by: reviewerId,
        review_note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();
    if (error || !data) throw AppError.badRequest('Curso externo não encontrado ou já revisado');
    return data;
  },
};
