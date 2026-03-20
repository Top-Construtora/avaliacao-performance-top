import { api } from '../config/api';

export interface JobOpening {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  status: 'draft' | 'open' | 'in_progress' | 'closed' | 'cancelled';
  positions_count: number;
  location: string | null;
  contract_type: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  requirements: string | null;
  benefits: string | null;
  priority: string;
  requested_by: string;
  brief_reason: string | null;
  brief_expected_start: string | null;
  brief_team_context: string | null;
  brief_key_activities: string | null;
  brief_required_skills: string | null;
  brief_nice_to_have: string | null;
  brief_observations: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string };
  requester?: { id: string; name: string; email: string; position: string };
  candidates?: JobCandidate[];
  candidate_count?: number;
  interview_count?: number;
}

export interface JobCandidate {
  id: string;
  job_opening_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  status: string;
  source: string | null;
  observations: string | null;
  rating: number | null;
  created_at: string;
}

export interface RecruitmentStats {
  openings: { total: number; open: number; in_progress: number; closed: number };
  candidates: { total: number; received: number; interviewing: number; hired: number };
  interviews: { total: number; completed: number; scheduled: number };
}

export const recruitmentService = {
  // Vagas
  async getJobOpenings(filters?: { status?: string; department_id?: string; requested_by?: string }): Promise<JobOpening[]> {
    const params = new URLSearchParams(
      Object.entries(filters || {}).reduce((acc, [k, v]) => { if (v) acc[k] = v; return acc; }, {} as Record<string, string>)
    ).toString();
    const response = await api.get(`/recruitment/openings?${params}`);
    return response.data || response || [];
  },

  async getJobOpeningById(id: string): Promise<JobOpening> {
    const response = await api.get(`/recruitment/openings/${id}`);
    return response.data || response;
  },

  async createJobOpening(data: Partial<JobOpening>): Promise<JobOpening> {
    const response = await api.post('/recruitment/openings', data);
    return response.data || response;
  },

  async updateJobOpening(id: string, data: Partial<JobOpening>): Promise<JobOpening> {
    const response = await api.put(`/recruitment/openings/${id}`, data);
    return response.data || response;
  },

  async deleteJobOpening(id: string): Promise<void> {
    await api.delete(`/recruitment/openings/${id}`);
  },

  // Candidatos
  async getCandidates(jobOpeningId: string): Promise<JobCandidate[]> {
    const response = await api.get(`/recruitment/candidates?job_opening_id=${jobOpeningId}`);
    return response.data || response || [];
  },

  async createCandidate(data: Partial<JobCandidate>): Promise<JobCandidate> {
    const response = await api.post('/recruitment/candidates', data);
    return response.data || response;
  },

  async updateCandidate(id: string, data: Partial<JobCandidate>): Promise<JobCandidate> {
    const response = await api.put(`/recruitment/candidates/${id}`, data);
    return response.data || response;
  },

  async deleteCandidate(id: string): Promise<void> {
    await api.delete(`/recruitment/candidates/${id}`);
  },

  // Entrevistas
  async createInterview(data: { candidate_id: string; interviewer_id?: string; scheduled_date?: string; interview_type?: string }): Promise<any> {
    const response = await api.post('/recruitment/interviews', data);
    return response.data || response;
  },

  async updateInterview(id: string, data: any): Promise<any> {
    const response = await api.put(`/recruitment/interviews/${id}`, data);
    return response.data || response;
  },

  // Stats
  async getStats(): Promise<RecruitmentStats> {
    const response = await api.get('/recruitment/stats');
    return response.data || response;
  },
};
