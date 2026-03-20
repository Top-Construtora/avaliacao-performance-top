import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

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

      // Adicionar contagem de respostas para cada pesquisa
      const surveysWithCounts = await Promise.all(
        (data || []).map(async (survey) => {
          const { count } = await supabaseAdmin
            .from('satisfaction_responses')
            .select('*', { count: 'exact', head: true })
            .eq('survey_id', survey.id);

          const { count: questionCount } = await supabaseAdmin
            .from('satisfaction_questions')
            .select('*', { count: 'exact', head: true })
            .eq('survey_id', survey.id);

          return { ...survey, response_count: count || 0, question_count: questionCount || 0 };
        })
      );

      res.json({ success: true, data: surveysWithCounts });
    } catch (error) {
      next(error);
    }
  },

  // Buscar pesquisa por ID com perguntas
  async getSurveyById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: survey, error } = await supabaseAdmin
        .from('satisfaction_surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!survey) {
        return res.status(404).json({ success: false, error: 'Pesquisa não encontrada' });
      }

      const { data: questions } = await supabaseAdmin
        .from('satisfaction_questions')
        .select('*')
        .eq('survey_id', id)
        .order('order_index');

      const { count: responseCount } = await supabaseAdmin
        .from('satisfaction_responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', id);

      res.json({
        success: true,
        data: { ...survey, questions: questions || [], response_count: responseCount || 0 },
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
        .insert([{
          title,
          description,
          is_anonymous: is_anonymous !== false,
          start_date,
          end_date,
          status: 'draft',
          created_by: req.user?.id,
        }])
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
      const { title, description, status, is_anonymous, start_date, end_date, questions } = req.body;

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
          }));

          await supabaseAdmin.from('satisfaction_questions').insert(questionsData);
        }
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

      // Verificar se a pesquisa está ativa
      const { data: survey } = await supabaseAdmin
        .from('satisfaction_surveys')
        .select('id, status, is_anonymous')
        .eq('id', id)
        .single();

      if (!survey || survey.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Pesquisa não está ativa' });
      }

      // Verificar se já respondeu
      const { data: existing } = await supabaseAdmin
        .from('satisfaction_responses')
        .select('id')
        .eq('survey_id', id)
        .eq('respondent_id', req.user?.id)
        .single();

      if (existing) {
        return res.status(400).json({ success: false, error: 'Você já respondeu esta pesquisa' });
      }

      // Criar response
      const { data: response, error } = await supabaseAdmin
        .from('satisfaction_responses')
        .insert([{
          survey_id: id,
          respondent_id: survey.is_anonymous ? null : req.user?.id,
        }])
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

      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  },

  // Resultados de uma pesquisa
  async getSurveyResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Pesquisa + perguntas
      const { data: survey } = await supabaseAdmin
        .from('satisfaction_surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (!survey) {
        return res.status(404).json({ success: false, error: 'Pesquisa não encontrada' });
      }

      const { data: questions } = await supabaseAdmin
        .from('satisfaction_questions')
        .select('*')
        .eq('survey_id', id)
        .order('order_index');

      // Respostas
      const { data: responses } = await supabaseAdmin
        .from('satisfaction_responses')
        .select('id')
        .eq('survey_id', id);

      const responseIds = (responses || []).map(r => r.id);

      let answers: any[] = [];
      if (responseIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('satisfaction_answers')
          .select('*')
          .in('response_id', responseIds);
        answers = data || [];
      }

      // Calcular resultados por pergunta
      const results = (questions || []).map(question => {
        const questionAnswers = answers.filter(a => a.question_id === question.id);

        if (question.question_type === 'rating') {
          const ratings = questionAnswers.filter(a => a.rating_value != null).map(a => a.rating_value);
          const average = ratings.length > 0
            ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
            : 0;
          const distribution = [1, 2, 3, 4, 5].map(r => ratings.filter((v: number) => v === r).length);

          return {
            ...question,
            total_answers: ratings.length,
            average: Math.round(average * 100) / 100,
            distribution,
          };
        } else if (question.question_type === 'yes_no') {
          const boolAnswers = questionAnswers.filter(a => a.boolean_value !== null);
          const yesCount = boolAnswers.filter(a => a.boolean_value === true).length;
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
            text_answers: questionAnswers.filter(a => a.text_value).map(a => a.text_value),
          };
        }
      });

      // Média geral (apenas perguntas de rating)
      const ratingResults = results.filter(r => r.average !== undefined);
      const overallAverage = ratingResults.length > 0
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
        .from('satisfaction_responses')
        .select('id')
        .eq('survey_id', id)
        .eq('respondent_id', req.user?.id)
        .single();

      res.json({ success: true, data: { has_responded: !!data } });
    } catch (error) {
      next(error);
    }
  },

  // Deletar pesquisa
  async deleteSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('satisfaction_surveys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'Pesquisa excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};
