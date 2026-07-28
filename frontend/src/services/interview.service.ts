import { api } from '../config/api';

export type InterviewType = 'onboarding' | 'sixty_days' | 'ninety_days' | 'exit';

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  onboarding: 'Integração',
  sixty_days: '60 dias',
  ninety_days: '90 dias',
  exit: 'Desligamento',
};

export interface InterviewQuestion {
  id: string;
  question_text: string;
  question_type: 'rating' | 'text' | 'yes_no';
  rating_scale: number;
  order_index: number;
  required: boolean;
}

export interface InterviewAnswer {
  id?: string;
  question_id: string;
  rating_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
}

export interface InterviewTemplate {
  id: string;
  type: InterviewType;
  name: string;
  description: string | null;
  questions: InterviewQuestion[];
}

export interface Interview {
  id: string;
  type: InterviewType;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  employee_id: string;
  interviewer_id: string;
  scheduled_date: string | null;
  completed_date: string | null;
  observations: string | null;
  meeting_url: string | null;
  public_token: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  questions?: InterviewQuestion[];
  question_answers?: InterviewAnswer[];
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
  onboarding?: { total: number; scheduled: number; completed: number };
  sixty_days?: { total: number; scheduled: number; completed: number };
  ninety_days: { total: number; scheduled: number; completed: number };
  exit: { total: number; scheduled: number; completed: number };
}

export interface PublicInterview {
  type: InterviewType;
  type_label: string;
  scheduled_date: string | null;
  meeting_url: string | null;
  employee_name: string | null;
  questions: InterviewQuestion[];
  has_responded: boolean;
}

export const interviewService = {
  async getInterviews(filters?: {
    type?: InterviewType;
    status?: string;
    employee_id?: string;
  }): Promise<Interview[]> {
    const params = new URLSearchParams(
      Object.entries(filters || {}).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    const response = await api.get(`/interviews?${params}`);
    return response.data || response || [];
  },

  async getInterviewById(id: string): Promise<Interview> {
    const response = await api.get(`/interviews/${id}`);
    return response.data || response;
  },

  async createInterview(data: {
    type: InterviewType;
    employee_id: string;
    interviewer_id: string;
    scheduled_date?: string;
    meeting_url?: string;
  }): Promise<Interview> {
    const response = await api.post('/interviews', data);
    return response.data || response;
  },

  // ===== Modelos (perguntas personalizáveis) =====
  async getTemplates(): Promise<InterviewTemplate[]> {
    const response = await api.get('/interviews/templates');
    return response.data || response || [];
  },

  async updateTemplate(
    type: InterviewType,
    data: {
      name?: string;
      description?: string;
      questions: {
        question_text: string;
        question_type: string;
        rating_scale?: number;
        required?: boolean;
      }[];
    },
  ): Promise<void> {
    await api.put(`/interviews/templates/${type}`, data);
  },

  // ===== Público (link externo, sem login) =====
  async getPublicInterview(token: string): Promise<PublicInterview> {
    const response = await api.get(`/public/interviews/${token}`);
    return response.data || response;
  },

  async submitPublicInterview(token: string, answers: InterviewAnswer[]): Promise<void> {
    await api.post(`/public/interviews/${token}/respond`, { answers });
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
