import { api } from '../config/api';

export interface Interview {
  id: string;
  type: 'ninety_days' | 'exit';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  employee_id: string;
  interviewer_id: string;
  scheduled_date: string | null;
  completed_date: string | null;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    position: string;
    admission_date?: string;
    join_date?: string;
    profile_image?: string;
    department_id?: string;
  };
  interviewer?: {
    id: string;
    name: string;
    email: string;
  };
  answers?: NinetyDaysAnswers | ExitAnswers;
}

export interface NinetyDaysAnswers {
  id?: string;
  interview_id?: string;
  adaptation_rating: number | null;
  adaptation_comments: string;
  team_integration_rating: number | null;
  team_integration_comments: string;
  role_clarity_rating: number | null;
  role_clarity_comments: string;
  leadership_support_rating: number | null;
  leadership_support_comments: string;
  tools_and_resources_rating: number | null;
  tools_and_resources_comments: string;
  expectations_met: boolean | null;
  expectations_comments: string;
  challenges: string;
  suggestions: string;
  overall_satisfaction_rating: number | null;
  recommend_company: boolean | null;
  additional_comments: string;
}

export interface ExitAnswers {
  id?: string;
  interview_id?: string;
  departure_reason: string;
  departure_reason_details: string;
  work_environment_rating: number | null;
  work_environment_comments: string;
  leadership_rating: number | null;
  leadership_comments: string;
  growth_opportunities_rating: number | null;
  growth_opportunities_comments: string;
  compensation_rating: number | null;
  compensation_comments: string;
  workload_rating: number | null;
  workload_comments: string;
  what_liked_most: string;
  what_could_improve: string;
  would_return: boolean | null;
  would_recommend: boolean | null;
  destination: string;
  additional_comments: string;
}

export interface InterviewStats {
  total: number;
  ninety_days: { total: number; scheduled: number; completed: number };
  exit: { total: number; scheduled: number; completed: number };
}

export const interviewService = {
  async getInterviews(filters?: {
    type?: 'ninety_days' | 'exit';
    status?: string;
    employee_id?: string;
  }): Promise<Interview[]> {
    const params = new URLSearchParams(
      Object.entries(filters || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const response = await api.get(`/interviews?${params}`);
    return response.data || response || [];
  },

  async getInterviewById(id: string): Promise<Interview> {
    const response = await api.get(`/interviews/${id}`);
    return response.data || response;
  },

  async createInterview(data: {
    type: 'ninety_days' | 'exit';
    employee_id: string;
    interviewer_id: string;
    scheduled_date?: string;
  }): Promise<Interview> {
    const response = await api.post('/interviews', data);
    return response.data || response;
  },

  async updateInterview(id: string, data: Partial<Interview>): Promise<Interview> {
    const response = await api.put(`/interviews/${id}`, data);
    return response.data || response;
  },

  async saveNinetyDaysAnswers(interviewId: string, answers: NinetyDaysAnswers): Promise<any> {
    const response = await api.post(`/interviews/${interviewId}/ninety-days-answers`, answers);
    return response.data || response;
  },

  async saveExitAnswers(interviewId: string, answers: ExitAnswers): Promise<any> {
    const response = await api.post(`/interviews/${interviewId}/exit-answers`, answers);
    return response.data || response;
  },

  async deleteInterview(id: string): Promise<void> {
    await api.delete(`/interviews/${id}`);
  },

  async getStats(): Promise<InterviewStats> {
    const response = await api.get('/interviews/stats');
    return response.data || response;
  },
};
