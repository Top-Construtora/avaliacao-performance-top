import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notificationService';

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  onboarding: 'Integração',
  sixty_days: '60 dias',
  ninety_days: '90 dias',
  exit: 'Desligamento',
};

export const interviewController = {
  // ===== MODELOS (perguntas personalizáveis por tipo) =====

  async getTemplates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [templatesRes, questionsRes] = await Promise.all([
        supabaseAdmin.from('interview_templates').select('*').order('type'),
        supabaseAdmin.from('interview_template_questions').select('*').order('order_index'),
      ]);
      if (templatesRes.error) throw templatesRes.error;

      const questionsByTemplate = new Map<string, any[]>();
      for (const q of questionsRes.data || []) {
        const list = questionsByTemplate.get(q.template_id) || [];
        list.push(q);
        questionsByTemplate.set(q.template_id, list);
      }

      const data = (templatesRes.data || []).map((t: any) => ({
        ...t,
        questions: questionsByTemplate.get(t.id) || [],
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { name, description, questions } = req.body;

      const { data: template, error } = await supabaseAdmin
        .from('interview_templates')
        .select('id')
        .eq('type', type)
        .maybeSingle();
      if (error) throw error;
      if (!template) {
        return res.status(404).json({ success: false, error: 'Modelo não encontrado' });
      }

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      await supabaseAdmin.from('interview_templates').update(updates).eq('id', template.id);

      // Substituir perguntas é seguro: cada entrevista criada carrega um
      // SNAPSHOT das perguntas, então editar o modelo não afeta as antigas.
      if (Array.isArray(questions)) {
        await supabaseAdmin
          .from('interview_template_questions')
          .delete()
          .eq('template_id', template.id);

        if (questions.length > 0) {
          const rows = questions.map((q: any, index: number) => ({
            template_id: template.id,
            question_text: q.question_text,
            question_type: q.question_type || 'rating',
            rating_scale: Number(q.rating_scale) === 10 ? 10 : 5,
            order_index: index,
            required: q.required !== false,
          }));
          const { error: qError } = await supabaseAdmin
            .from('interview_template_questions')
            .insert(rows);
          if (qError) throw qError;
        }
      }

      res.json({ success: true, message: 'Modelo atualizado' });
    } catch (error) {
      next(error);
    }
  },

  // ===== PÚBLICO (link externo do colaborador, sem login) =====

  async getPublicInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const { data: interview } = await supabaseAdmin
        .from('interviews')
        .select(
          'id, type, status, scheduled_date, meeting_url, employee:users!interviews_employee_id_fkey(name)',
        )
        .eq('public_token', token)
        .maybeSingle();

      if (!interview || interview.status === 'cancelled') {
        return res.status(404).json({ success: false, error: 'Entrevista não disponível' });
      }

      const [questionsRes, answeredRes] = await Promise.all([
        supabaseAdmin
          .from('interview_questions')
          .select('id, question_text, question_type, rating_scale, order_index, required')
          .eq('interview_id', interview.id)
          .order('order_index'),
        supabaseAdmin
          .from('interview_answers')
          .select('id')
          .eq('interview_id', interview.id)
          .limit(1),
      ]);

      res.json({
        success: true,
        data: {
          type: interview.type,
          type_label: INTERVIEW_TYPE_LABELS[interview.type] || interview.type,
          scheduled_date: interview.scheduled_date,
          meeting_url: interview.meeting_url,
          employee_name: (interview as any).employee?.name || null,
          questions: questionsRes.data || [],
          has_responded: (answeredRes.data || []).length > 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async submitPublicInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { answers } = req.body;

      const { data: interview } = await supabaseAdmin
        .from('interviews')
        .select('id, status')
        .eq('public_token', token)
        .maybeSingle();

      if (!interview || interview.status === 'cancelled') {
        return res.status(400).json({ success: false, error: 'Entrevista não disponível' });
      }

      const { data: existing } = await supabaseAdmin
        .from('interview_answers')
        .select('id')
        .eq('interview_id', interview.id)
        .limit(1);
      if ((existing || []).length > 0) {
        return res.status(400).json({ success: false, error: 'Esta entrevista já foi respondida' });
      }

      // Só aceita respostas de perguntas desta entrevista
      const { data: qs } = await supabaseAdmin
        .from('interview_questions')
        .select('id')
        .eq('interview_id', interview.id);
      const validIds = new Set((qs || []).map((q: any) => q.id));

      if (Array.isArray(answers)) {
        const rows = answers
          .filter((a: any) => validIds.has(a.question_id))
          .map((a: any) => ({
            interview_id: interview.id,
            question_id: a.question_id,
            rating_value: a.rating_value ?? null,
            text_value: a.text_value ?? null,
            boolean_value: a.boolean_value !== undefined ? a.boolean_value : null,
          }));
        if (rows.length > 0) {
          const { error: aError } = await supabaseAdmin.from('interview_answers').insert(rows);
          if (aError) throw aError;
        }
      }

      // Respondida pelo colaborador → entra em andamento (RH conclui depois)
      await supabaseAdmin
        .from('interviews')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', interview.id)
        .eq('status', 'scheduled');

      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // Listar entrevistas com filtros
  async getInterviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, status, employee_id } = req.query;

      let query = supabaseAdmin
        .from('interviews')
        .select(
          `
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position, join_date, profile_image, department_id),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `,
        )
        .order('scheduled_date', { ascending: false });

      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (employee_id) query = query.eq('employee_id', employee_id);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Buscar entrevista por ID com respostas
  async getInterviewById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: interview, error } = await supabaseAdmin
        .from('interviews')
        .select(
          `
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position, join_date, profile_image, department_id),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!interview) {
        return res.status(404).json({ success: false, error: 'Entrevista não encontrada' });
      }

      // Perguntas/respostas genéricas (entrevistas novas, via snapshot) e
      // respostas legadas (formulários fixos antigos de 90 dias/desligamento)
      const [questionsRes, genericAnswersRes, legacyNinetyRes, legacyExitRes] = await Promise.all([
        supabaseAdmin
          .from('interview_questions')
          .select('*')
          .eq('interview_id', id)
          .order('order_index'),
        supabaseAdmin.from('interview_answers').select('*').eq('interview_id', id),
        interview.type === 'ninety_days'
          ? supabaseAdmin
              .from('interview_ninety_days_answers')
              .select('*')
              .eq('interview_id', id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        interview.type === 'exit'
          ? supabaseAdmin
              .from('interview_exit_answers')
              .select('*')
              .eq('interview_id', id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const answers = legacyNinetyRes.data || legacyExitRes.data || null;

      res.json({
        success: true,
        data: {
          ...interview,
          answers,
          questions: questionsRes.data || [],
          question_answers: genericAnswersRes.data || [],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Criar entrevista
  async createInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, employee_id, interviewer_id, scheduled_date, meeting_url } = req.body;

      if (!type || !employee_id || !interviewer_id) {
        return res.status(400).json({
          success: false,
          error: 'Tipo, colaborador e entrevistador são obrigatórios',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('interviews')
        .insert([
          {
            type,
            employee_id,
            interviewer_id,
            scheduled_date,
            meeting_url: meeting_url || null,
            created_by: req.user?.id,
            status: 'scheduled',
          },
        ])
        .select(
          `
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `,
        )
        .single();

      if (error) throw error;

      // SNAPSHOT das perguntas do modelo para esta entrevista: editar o modelo
      // depois não muda entrevistas já agendadas/respondidas.
      const { data: template } = await supabaseAdmin
        .from('interview_templates')
        .select('id')
        .eq('type', type)
        .maybeSingle();
      if (template) {
        const { data: templateQuestions } = await supabaseAdmin
          .from('interview_template_questions')
          .select('question_text, question_type, rating_scale, order_index, required')
          .eq('template_id', template.id)
          .order('order_index');
        if (templateQuestions && templateQuestions.length > 0) {
          const { error: snapError } = await supabaseAdmin
            .from('interview_questions')
            .insert(templateQuestions.map((q: any) => ({ ...q, interview_id: data.id })));
          if (snapError) console.error('Snapshot de perguntas falhou:', snapError.message);
        }
      }

      // Notifica os envolvidos na entrevista: entrevistador, colaborador
      // entrevistado e quem criou/agendou. O notificationService remove o
      // actor (quem disparou a ação) da lista de destinatários, então quem
      // agenda não é notificado da própria entrevista que criou.
      const notifType = type === 'exit' ? 'interview_exit_scheduled' : 'interview_90day_scheduled';
      const notifTitle = `Entrevista de ${INTERVIEW_TYPE_LABELS[type] || type} agendada`;
      const dateStr = scheduled_date ? new Date(scheduled_date).toLocaleDateString('pt-BR') : '';

      notificationService
        .send(supabaseAdmin, {
          type: notifType,
          title: notifTitle,
          message: `Uma entrevista foi agendada${dateStr ? ` para ${dateStr}` : ''}.`,
          targets: [
            { type: 'user', user_id: interviewer_id },
            { type: 'user', user_id: employee_id },
            { type: 'user', user_id: data?.created_by || undefined },
          ],
          actor_id: req.user?.id,
          priority: type === 'exit' ? 'high' : 'medium',
          action_url: `/interviews/${data?.id}`,
          entity_type: 'interview',
          entity_id: data?.id,
        })
        .catch((err) => console.error('Notification error:', err));

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar entrevista (status, data, observações)
  async updateInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, scheduled_date, observations, interviewer_id, meeting_url } = req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (scheduled_date) updates.scheduled_date = scheduled_date;
      if (observations !== undefined) updates.observations = observations;
      if (interviewer_id) updates.interviewer_id = interviewer_id;
      if (meeting_url !== undefined) updates.meeting_url = meeting_url || null;

      if (status === 'completed') {
        updates.completed_date = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, error: 'Entrevista não encontrada' });
      }

      // Notificar apenas o entrevistador quando a entrevista é concluída
      if (status === 'completed' && data.interviewer_id) {
        notificationService
          .send(supabaseAdmin, {
            type: 'interview_completed',
            title: 'Entrevista concluída',
            message: `A entrevista de ${INTERVIEW_TYPE_LABELS[data.type] || data.type} foi concluída.`,
            targets: [{ type: 'user', user_id: data.interviewer_id }],
            actor_id: req.user?.id,
            action_url: `/interviews/${data.id}`,
            entity_type: 'interview',
            entity_id: data.id,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Salvar respostas da entrevista de 90 dias
  async saveNinetyDaysAnswers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const answers = req.body;

      // Verificar se a entrevista existe e é do tipo correto
      const { data: interview, error: interviewError } = await supabaseAdmin
        .from('interviews')
        .select('id, type')
        .eq('id', id)
        .single();

      if (interviewError || !interview) {
        return res.status(404).json({ success: false, error: 'Entrevista não encontrada' });
      }

      if (interview.type !== 'ninety_days') {
        return res.status(400).json({ success: false, error: 'Entrevista não é do tipo 90 dias' });
      }

      // Verificar se já existem respostas
      const { data: existing } = await supabaseAdmin
        .from('interview_ninety_days_answers')
        .select('id')
        .eq('interview_id', id)
        .single();

      let data;
      if (existing) {
        // Atualizar respostas existentes
        const { data: updated, error } = await supabaseAdmin
          .from('interview_ninety_days_answers')
          .update({ ...answers, updated_at: new Date().toISOString() })
          .eq('interview_id', id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        // Criar novas respostas
        const { data: created, error } = await supabaseAdmin
          .from('interview_ninety_days_answers')
          .insert([{ ...answers, interview_id: id }])
          .select()
          .single();
        if (error) throw error;
        data = created;
      }

      // Atualizar status da entrevista para in_progress
      await supabaseAdmin
        .from('interviews')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'scheduled');

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Salvar respostas da entrevista de desligamento
  async saveExitAnswers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const answers = req.body;

      // Verificar se a entrevista existe e é do tipo correto
      const { data: interview, error: interviewError } = await supabaseAdmin
        .from('interviews')
        .select('id, type')
        .eq('id', id)
        .single();

      if (interviewError || !interview) {
        return res.status(404).json({ success: false, error: 'Entrevista não encontrada' });
      }

      if (interview.type !== 'exit') {
        return res
          .status(400)
          .json({ success: false, error: 'Entrevista não é do tipo desligamento' });
      }

      // Verificar se já existem respostas
      const { data: existing } = await supabaseAdmin
        .from('interview_exit_answers')
        .select('id')
        .eq('interview_id', id)
        .single();

      let data;
      if (existing) {
        const { data: updated, error } = await supabaseAdmin
          .from('interview_exit_answers')
          .update({ ...answers, updated_at: new Date().toISOString() })
          .eq('interview_id', id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        const { data: created, error } = await supabaseAdmin
          .from('interview_exit_answers')
          .insert([{ ...answers, interview_id: id }])
          .select()
          .single();
        if (error) throw error;
        data = created;
      }

      // Atualizar status da entrevista para in_progress
      await supabaseAdmin
        .from('interviews')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'scheduled');

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Deletar entrevista
  async deleteInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin.from('interviews').delete().eq('id', id);

      if (error) throw error;

      // entity_id não é FK no banco, então não há cascade: removemos aqui as
      // notificações dessa entrevista para não deixar registros órfãos
      // (notificação apontando para uma entrevista que não existe mais).
      const { error: notifCleanupError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('entity_type', 'interview')
        .eq('entity_id', id);
      if (notifCleanupError) {
        console.error('Falha ao limpar notificações da entrevista:', notifCleanupError.message);
      }

      res.json({ success: true, message: 'Entrevista excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  // Estatísticas de entrevistas
  async getInterviewStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data: interviews, error } = await supabaseAdmin
        .from('interviews')
        .select('id, type, status, scheduled_date');

      if (error) throw error;

      const byType = (type: string) => ({
        total: interviews?.filter((i) => i.type === type).length || 0,
        scheduled:
          interviews?.filter((i) => i.type === type && i.status === 'scheduled').length || 0,
        completed:
          interviews?.filter((i) => i.type === type && i.status === 'completed').length || 0,
      });

      const stats = {
        total: interviews?.length || 0,
        onboarding: byType('onboarding'),
        sixty_days: byType('sixty_days'),
        ninety_days: byType('ninety_days'),
        exit: byType('exit'),
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
