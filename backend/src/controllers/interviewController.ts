import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

export const interviewController = {
  // Listar entrevistas com filtros
  async getInterviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, status, employee_id } = req.query;

      let query = supabaseAdmin
        .from('interviews')
        .select(`
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position, join_date, profile_image, department_id),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `)
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
        .select(`
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position, join_date, profile_image, department_id),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!interview) {
        return res.status(404).json({ success: false, error: 'Entrevista não encontrada' });
      }

      // Buscar respostas conforme o tipo
      let answers = null;
      if (interview.type === 'ninety_days') {
        const { data } = await supabaseAdmin
          .from('interview_ninety_days_answers')
          .select('*')
          .eq('interview_id', id)
          .single();
        answers = data;
      } else if (interview.type === 'exit') {
        const { data } = await supabaseAdmin
          .from('interview_exit_answers')
          .select('*')
          .eq('interview_id', id)
          .single();
        answers = data;
      }

      res.json({ success: true, data: { ...interview, answers } });
    } catch (error) {
      next(error);
    }
  },

  // Criar entrevista
  async createInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, employee_id, interviewer_id, scheduled_date } = req.body;

      if (!type || !employee_id || !interviewer_id) {
        return res.status(400).json({
          success: false,
          error: 'Tipo, colaborador e entrevistador são obrigatórios',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('interviews')
        .insert([{
          type,
          employee_id,
          interviewer_id,
          scheduled_date,
          created_by: req.user?.id,
          status: 'scheduled',
        }])
        .select(`
          *,
          employee:users!interviews_employee_id_fkey(id, name, email, position),
          interviewer:users!interviews_interviewer_id_fkey(id, name, email)
        `)
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar entrevista (status, data, observações)
  async updateInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, scheduled_date, observations, interviewer_id } = req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (scheduled_date) updates.scheduled_date = scheduled_date;
      if (observations !== undefined) updates.observations = observations;
      if (interviewer_id) updates.interviewer_id = interviewer_id;

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
        return res.status(400).json({ success: false, error: 'Entrevista não é do tipo desligamento' });
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

      const { error } = await supabaseAdmin
        .from('interviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

      const stats = {
        total: interviews?.length || 0,
        ninety_days: {
          total: interviews?.filter(i => i.type === 'ninety_days').length || 0,
          scheduled: interviews?.filter(i => i.type === 'ninety_days' && i.status === 'scheduled').length || 0,
          completed: interviews?.filter(i => i.type === 'ninety_days' && i.status === 'completed').length || 0,
        },
        exit: {
          total: interviews?.filter(i => i.type === 'exit').length || 0,
          scheduled: interviews?.filter(i => i.type === 'exit' && i.status === 'scheduled').length || 0,
          completed: interviews?.filter(i => i.type === 'exit' && i.status === 'completed').length || 0,
        },
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
