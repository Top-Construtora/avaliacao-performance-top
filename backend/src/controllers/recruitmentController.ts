import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

export const recruitmentController = {
  // === VAGAS ===

  async getJobOpenings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, department_id, requested_by } = req.query;

      let query = supabaseAdmin
        .from('job_openings')
        .select(`
          *,
          department:departments!job_openings_department_id_fkey(id, name),
          requester:users!job_openings_requested_by_fkey(id, name, email, position)
        `)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (department_id) query = query.eq('department_id', department_id);
      if (requested_by) query = query.eq('requested_by', requested_by);

      const { data, error } = await query;
      if (error) throw error;

      // Adicionar contagens de candidatos por vaga
      const openingsWithCounts = await Promise.all(
        (data || []).map(async (opening) => {
          const { count: candidateCount } = await supabaseAdmin
            .from('job_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('job_opening_id', opening.id);

          const { count: interviewCount } = await supabaseAdmin
            .from('recruitment_interviews')
            .select(`
              *,
              candidate:job_candidates!inner(job_opening_id)
            `, { count: 'exact', head: true })
            .eq('candidate.job_opening_id', opening.id)
            .eq('status', 'completed');

          return {
            ...opening,
            candidate_count: candidateCount || 0,
            interview_count: interviewCount || 0,
          };
        })
      );

      res.json({ success: true, data: openingsWithCounts });
    } catch (error) {
      next(error);
    }
  },

  async getJobOpeningById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: opening, error } = await supabaseAdmin
        .from('job_openings')
        .select(`
          *,
          department:departments!job_openings_department_id_fkey(id, name),
          requester:users!job_openings_requested_by_fkey(id, name, email, position)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!opening) {
        return res.status(404).json({ success: false, error: 'Vaga não encontrada' });
      }

      // Buscar candidatos
      const { data: candidates } = await supabaseAdmin
        .from('job_candidates')
        .select('*')
        .eq('job_opening_id', id)
        .order('created_at', { ascending: false });

      res.json({ success: true, data: { ...opening, candidates: candidates || [] } });
    } catch (error) {
      next(error);
    }
  },

  async createJobOpening(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        title, description, department_id, positions_count, location,
        contract_type, salary_range_min, salary_range_max, requirements,
        benefits, priority, brief_reason, brief_expected_start,
        brief_team_context, brief_key_activities, brief_required_skills,
        brief_nice_to_have, brief_observations,
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Título da vaga é obrigatório' });
      }

      const { data, error } = await supabaseAdmin
        .from('job_openings')
        .insert([{
          title,
          description,
          department_id,
          positions_count: positions_count || 1,
          location,
          contract_type,
          salary_range_min,
          salary_range_max,
          requirements,
          benefits,
          priority: priority || 'normal',
          requested_by: req.user?.id,
          brief_reason,
          brief_expected_start,
          brief_team_context,
          brief_key_activities,
          brief_required_skills,
          brief_nice_to_have,
          brief_observations,
          status: 'draft',
        }])
        .select(`
          *,
          department:departments!job_openings_department_id_fkey(id, name),
          requester:users!job_openings_requested_by_fkey(id, name, email)
        `)
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateJobOpening(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updated_at: new Date().toISOString() };

      if (updates.status === 'open' && !updates.opened_at) {
        updates.opened_at = new Date().toISOString();
      }
      if (updates.status === 'closed' && !updates.closed_at) {
        updates.closed_at = new Date().toISOString();
      }

      // Remover campos de relacionamento para não causar erro
      delete updates.department;
      delete updates.requester;
      delete updates.candidates;
      delete updates.candidate_count;
      delete updates.interview_count;

      const { data, error } = await supabaseAdmin
        .from('job_openings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteJobOpening(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('job_openings').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Vaga excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  // === CANDIDATOS ===

  async getCandidates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { job_opening_id, status } = req.query;

      let query = supabaseAdmin
        .from('job_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (job_opening_id) query = query.eq('job_opening_id', job_opening_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ success: true, data: data || [] });
    } catch (error) {
      next(error);
    }
  },

  async createCandidate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { job_opening_id, name, email, phone, resume_url, linkedin_url, source, observations } = req.body;

      if (!job_opening_id || !name) {
        return res.status(400).json({ success: false, error: 'Vaga e nome são obrigatórios' });
      }

      const { data, error } = await supabaseAdmin
        .from('job_candidates')
        .insert([{ job_opening_id, name, email, phone, resume_url, linkedin_url, source, observations, status: 'received' }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateCandidate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updated_at: new Date().toISOString() };

      const { data, error } = await supabaseAdmin
        .from('job_candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteCandidate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('job_candidates').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Candidato excluído' });
    } catch (error) {
      next(error);
    }
  },

  // === ENTREVISTAS DE RECRUTAMENTO ===

  async createRecruitmentInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { candidate_id, interviewer_id, scheduled_date, interview_type } = req.body;

      if (!candidate_id) {
        return res.status(400).json({ success: false, error: 'Candidato é obrigatório' });
      }

      const { data, error } = await supabaseAdmin
        .from('recruitment_interviews')
        .insert([{
          candidate_id,
          interviewer_id: interviewer_id || req.user?.id,
          scheduled_date,
          interview_type: interview_type || 'online',
          status: 'scheduled',
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar status do candidato
      await supabaseAdmin
        .from('job_candidates')
        .update({ status: 'interview_scheduled', updated_at: new Date().toISOString() })
        .eq('id', candidate_id);

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateRecruitmentInterview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updated_at: new Date().toISOString() };

      const { data, error } = await supabaseAdmin
        .from('recruitment_interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se concluída, atualizar candidato
      if (updates.status === 'completed' && data) {
        await supabaseAdmin
          .from('job_candidates')
          .update({ status: 'interviewed', updated_at: new Date().toISOString() })
          .eq('id', data.candidate_id);
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // === STATS ===

  async getRecruitmentStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data: openings } = await supabaseAdmin.from('job_openings').select('id, status');
      const { data: candidates } = await supabaseAdmin.from('job_candidates').select('id, status');
      const { data: interviews } = await supabaseAdmin.from('recruitment_interviews').select('id, status');

      res.json({
        success: true,
        data: {
          openings: {
            total: openings?.length || 0,
            open: openings?.filter(o => o.status === 'open').length || 0,
            in_progress: openings?.filter(o => o.status === 'in_progress').length || 0,
            closed: openings?.filter(o => o.status === 'closed').length || 0,
          },
          candidates: {
            total: candidates?.length || 0,
            received: candidates?.filter(c => c.status === 'received').length || 0,
            interviewing: candidates?.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status)).length || 0,
            hired: candidates?.filter(c => c.status === 'hired').length || 0,
          },
          interviews: {
            total: interviews?.length || 0,
            completed: interviews?.filter(i => i.status === 'completed').length || 0,
            scheduled: interviews?.filter(i => i.status === 'scheduled').length || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
