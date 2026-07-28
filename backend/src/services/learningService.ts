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

    await supabase
      .from('class_enrollments')
      .update({
        progress,
        completed_at: completed ? enrollment.completed_at || new Date().toISOString() : null,
      })
      .eq('id', enrollmentId);

    return { progress, completed };
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
