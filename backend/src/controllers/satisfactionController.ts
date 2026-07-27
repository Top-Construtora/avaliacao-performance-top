import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notificationService';

export const satisfactionController = {
  // Listar pesquisas
  async getSurveys(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      let query = supabaseAdmin
        .from('satisfaction_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;

      const surveys = data || [];
      if (surveys.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Contagens em lote (evita N+1: antes eram 2 queries POR pesquisa)
      const surveyIds = surveys.map((s: any) => s.id);
      const [respRes, questRes] = await Promise.all([
        supabaseAdmin.from('satisfaction_responses').select('survey_id').in('survey_id', surveyIds),
        supabaseAdmin.from('satisfaction_questions').select('survey_id').in('survey_id', surveyIds),
      ]);

      const countBySurvey = (rows: { survey_id: string }[] | null) => {
        const map = new Map<string, number>();
        for (const r of rows || []) map.set(r.survey_id, (map.get(r.survey_id) || 0) + 1);
        return map;
      };
      const responseCounts = countBySurvey(respRes.data);
      const questionCounts = countBySurvey(questRes.data);

      const surveysWithCounts = surveys.map((survey: any) => ({
        ...survey,
        response_count: responseCounts.get(survey.id) || 0,
        question_count: questionCounts.get(survey.id) || 0,
      }));

      res.json({ success: true, data: surveysWithCounts });
    } catch (error) {
      next(error);
    }
  },

  // Buscar pesquisa por ID com perguntas
  async getSurveyById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Queries independentes em paralelo (antes eram 3 sequenciais)
      const [surveyRes, questionsRes, countRes] = await Promise.all([
        supabaseAdmin.from('satisfaction_surveys').select('*').eq('id', id).single(),
        supabaseAdmin
          .from('satisfaction_questions')
          .select('*')
          .eq('survey_id', id)
          .order('order_index'),
        supabaseAdmin
          .from('satisfaction_responses')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', id),
      ]);

      if (surveyRes.error) throw surveyRes.error;
      if (!surveyRes.data) {
        return res.status(404).json({ success: false, error: 'Pesquisa não encontrada' });
      }

      res.json({
        success: true,
        data: {
          ...surveyRes.data,
          questions: questionsRes.data || [],
          response_count: countRes.count || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Criar pesquisa com perguntas
  async createSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, is_anonymous, start_date, end_date, questions } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Título é obrigatório' });
      }

      const { data: survey, error } = await supabaseAdmin
        .from('satisfaction_surveys')
        .insert([
          {
            title,
            description,
            is_anonymous: is_anonymous !== false,
            start_date,
            end_date,
            status: 'draft',
            created_by: req.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Inserir perguntas se existirem
      if (questions && Array.isArray(questions) && questions.length > 0) {
        const questionsData = questions.map((q: any, index: number) => ({
          survey_id: survey.id,
          question_text: q.question_text,
          question_type: q.question_type || 'rating',
          order_index: index,
          required: q.required !== false,
          rating_scale: Number(q.rating_scale) === 10 ? 10 : 5,
        }));

        const { error: qError } = await supabaseAdmin
          .from('satisfaction_questions')
          .insert(questionsData);

        if (qError) throw qError;
      }

      res.status(201).json({ success: true, data: survey });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar pesquisa
  async updateSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, status, is_anonymous, start_date, end_date, questions } =
        req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (is_anonymous !== undefined) updates.is_anonymous = is_anonymous;
      if (start_date !== undefined) updates.start_date = start_date;
      if (end_date !== undefined) updates.end_date = end_date;

      const { data, error } = await supabaseAdmin
        .from('satisfaction_surveys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar perguntas se fornecidas
      if (questions && Array.isArray(questions)) {
        // Deletar perguntas antigas
        await supabaseAdmin.from('satisfaction_questions').delete().eq('survey_id', id);

        // Inserir novas
        if (questions.length > 0) {
          const questionsData = questions.map((q: any, index: number) => ({
            survey_id: id,
            question_text: q.question_text,
            question_type: q.question_type || 'rating',
            order_index: index,
            required: q.required !== false,
            rating_scale: Number(q.rating_scale) === 10 ? 10 : 5,
          }));

          await supabaseAdmin.from('satisfaction_questions').insert(questionsData);
        }
      }

      // Notificar quando pesquisa é ativada
      if (status === 'active') {
        notificationService
          .send(supabaseAdmin, {
            type: 'survey_available',
            title: 'Nova pesquisa disponível',
            message: `A pesquisa "${data?.title}" está disponível para resposta.`,
            targets: [{ type: 'all' }],
            actor_id: req.user?.id,
            action_url: `/satisfaction/${id}/respond`,
            entity_type: 'satisfaction_survey',
            entity_id: id,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      // Notificar quando pesquisa é encerrada
      if (status === 'closed') {
        notificationService
          .send(supabaseAdmin, {
            type: 'survey_closed',
            title: 'Pesquisa encerrada',
            message: `A pesquisa "${data?.title}" foi encerrada.`,
            targets: [{ type: 'role', role: 'director' }],
            actor_id: req.user?.id,
            action_url: `/satisfaction/${id}/results`,
            entity_type: 'satisfaction_survey',
            entity_id: id,
          })
          .catch((err) => console.error('Notification error:', err));
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Enviar resposta a uma pesquisa
  async submitResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // survey_id
      const { answers } = req.body;

      // Verificações independentes em paralelo: pesquisa ativa + já respondeu.
      // A participação é rastreada em tabela própria, o que também funciona em
      // pesquisas anônimas (onde respondent_id fica nulo).
      const [surveyRes, participatedRes] = await Promise.all([
        supabaseAdmin
          .from('satisfaction_surveys')
          .select('id, status, is_anonymous')
          .eq('id', id)
          .single(),
        supabaseAdmin
          .from('satisfaction_participants')
          .select('id')
          .eq('survey_id', id)
          .eq('user_id', req.user?.id)
          .maybeSingle(),
      ]);

      const survey = surveyRes.data;
      if (!survey || survey.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Pesquisa não está ativa' });
      }

      if (participatedRes.data) {
        return res.status(400).json({ success: false, error: 'Você já respondeu esta pesquisa' });
      }

      // Criar response
      const { data: response, error } = await supabaseAdmin
        .from('satisfaction_responses')
        .insert([
          {
            survey_id: id,
            respondent_id: survey.is_anonymous ? null : req.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Inserir answers
      if (answers && Array.isArray(answers)) {
        const answersData = answers.map((a: any) => ({
          response_id: response.id,
          question_id: a.question_id,
          rating_value: a.rating_value || null,
          text_value: a.text_value || null,
          boolean_value: a.boolean_value !== undefined ? a.boolean_value : null,
        }));

        const { error: aError } = await supabaseAdmin
          .from('satisfaction_answers')
          .insert(answersData);

        if (aError) throw aError;
      }

      // Registrar participação (impede responder novamente, inclusive anônimo).
      // As respostas seguem anônimas; aqui só marcamos que este usuário já respondeu.
      await supabaseAdmin
        .from('satisfaction_participants')
        .upsert({ survey_id: id, user_id: req.user?.id }, { onConflict: 'survey_id,user_id' });

      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // ===== PÚBLICO (link aberto, sem login) =====

  // Carregar pesquisa pública — só se estiver ativa. Retorna apenas o necessário
  // para responder (sem contagem de respostas nem dados internos).
  async getPublicSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: survey } = await supabaseAdmin
        .from('satisfaction_surveys')
        .select('id, title, description, is_anonymous, status')
        .eq('id', id)
        .single();

      if (!survey || survey.status !== 'active') {
        return res.status(404).json({ success: false, error: 'Pesquisa não disponível' });
      }

      const { data: questions } = await supabaseAdmin
        .from('satisfaction_questions')
        .select('id, question_text, question_type, order_index, required, rating_scale')
        .eq('survey_id', id)
        .order('order_index');

      res.json({ success: true, data: { ...survey, questions: questions || [] } });
    } catch (error) {
      next(error);
    }
  },

  // Enviar resposta pública — sempre anônima (respondent_id nulo). Sem login,
  // não há como rastrear participação com segurança; a dedup fica no cliente.
  async submitPublicResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { answers } = req.body;

      const { data: survey } = await supabaseAdmin
        .from('satisfaction_surveys')
        .select('id, status')
        .eq('id', id)
        .single();

      if (!survey || survey.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Pesquisa não está ativa' });
      }

      // Só aceita respostas para perguntas que pertencem a esta pesquisa.
      const { data: qs } = await supabaseAdmin
        .from('satisfaction_questions')
        .select('id')
        .eq('survey_id', id);
      const validIds = new Set((qs || []).map((q: any) => q.id));

      const { data: response, error } = await supabaseAdmin
        .from('satisfaction_responses')
        .insert([{ survey_id: id, respondent_id: null }])
        .select()
        .single();

      if (error) throw error;

      if (answers && Array.isArray(answers)) {
        const answersData = answers
          .filter((a: any) => validIds.has(a.question_id))
          .map((a: any) => ({
            response_id: response.id,
            question_id: a.question_id,
            rating_value: a.rating_value ?? null,
            text_value: a.text_value ?? null,
            boolean_value: a.boolean_value !== undefined ? a.boolean_value : null,
          }));

        if (answersData.length > 0) {
          const { error: aError } = await supabaseAdmin
            .from('satisfaction_answers')
            .insert(answersData);
          if (aError) throw aError;
        }
      }

      res.status(201).json({ success: true, data: { id: response.id } });
    } catch (error) {
      next(error);
    }
  },

  // Resultados de uma pesquisa
  async getSurveyResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Pesquisa, perguntas e respostas em paralelo (independentes entre si);
      // só as answers dependem dos IDs das respostas.
      const [surveyRes, questionsRes, responsesRes] = await Promise.all([
        supabaseAdmin.from('satisfaction_surveys').select('*').eq('id', id).single(),
        supabaseAdmin
          .from('satisfaction_questions')
          .select('*')
          .eq('survey_id', id)
          .order('order_index'),
        supabaseAdmin.from('satisfaction_responses').select('id').eq('survey_id', id),
      ]);

      const survey = surveyRes.data;
      if (!survey) {
        return res.status(404).json({ success: false, error: 'Pesquisa não encontrada' });
      }

      const questions = questionsRes.data;
      const responseIds = (responsesRes.data || []).map((r: any) => r.id);

      let answers: any[] = [];
      if (responseIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('satisfaction_answers')
          .select('*')
          .in('response_id', responseIds);
        answers = data || [];
      }

      // Calcular resultados por pergunta
      const results = (questions || []).map((question) => {
        const questionAnswers = answers.filter((a) => a.question_id === question.id);

        if (question.question_type === 'rating') {
          const scale = Number(question.rating_scale) === 10 ? 10 : 5;
          const ratings = questionAnswers
            .filter((a) => a.rating_value != null)
            .map((a) => a.rating_value);
          const average =
            ratings.length > 0
              ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
              : 0;
          const distribution = Array.from({ length: scale }, (_, i) => i + 1).map(
            (r) => ratings.filter((v: number) => v === r).length,
          );

          return {
            ...question,
            rating_scale: scale,
            total_answers: ratings.length,
            average: Math.round(average * 100) / 100,
            distribution,
          };
        } else if (question.question_type === 'yes_no') {
          const boolAnswers = questionAnswers.filter((a) => a.boolean_value !== null);
          const yesCount = boolAnswers.filter((a) => a.boolean_value === true).length;
          return {
            ...question,
            total_answers: boolAnswers.length,
            yes_count: yesCount,
            no_count: boolAnswers.length - yesCount,
          };
        } else {
          return {
            ...question,
            total_answers: questionAnswers.length,
            text_answers: questionAnswers.filter((a) => a.text_value).map((a) => a.text_value),
          };
        }
      });

      // Média geral (apenas perguntas de rating)
      const ratingResults = results.filter((r) => r.average !== undefined);
      const overallAverage =
        ratingResults.length > 0
          ? ratingResults.reduce((sum, r) => sum + (r.average || 0), 0) / ratingResults.length
          : 0;

      res.json({
        success: true,
        data: {
          survey,
          total_responses: responseIds.length,
          overall_average: Math.round(overallAverage * 100) / 100,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Verificar se o usuário já respondeu
  async checkUserResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data } = await supabaseAdmin
        .from('satisfaction_participants')
        .select('id')
        .eq('survey_id', id)
        .eq('user_id', req.user?.id)
        .maybeSingle();

      res.json({ success: true, data: { has_responded: !!data } });
    } catch (error) {
      next(error);
    }
  },

  // Deletar pesquisa
  async deleteSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin.from('satisfaction_surveys').delete().eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'Pesquisa excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};
