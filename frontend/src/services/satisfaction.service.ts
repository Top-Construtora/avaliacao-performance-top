import { api } from '../config/api';

export interface SatisfactionSurvey {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'closed';
  start_date: string | null;
  end_date: string | null;
  is_anonymous: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  response_count?: number;
  question_count?: number;
  questions?: SatisfactionQuestion[];
}

export interface SatisfactionQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'rating' | 'text' | 'yes_no';
  order_index: number;
  required: boolean;
}

export interface SurveyResults {
  survey: SatisfactionSurvey;
  total_responses: number;
  overall_average: number;
  results: QuestionResult[];
}

export interface QuestionResult {
  id: string;
  question_text: string;
  question_type: string;
  total_answers: number;
  average?: number;
  distribution?: number[];
  yes_count?: number;
  no_count?: number;
  text_answers?: string[];
}

export const satisfactionService = {
  async getSurveys(status?: string): Promise<SatisfactionSurvey[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/satisfaction${params}`);
    return response.data || response || [];
  },

  async getSurveyById(id: string): Promise<SatisfactionSurvey> {
    const response = await api.get(`/satisfaction/${id}`);
    return response.data || response;
  },

  async createSurvey(data: {
    title: string;
    description?: string;
    is_anonymous?: boolean;
    start_date?: string;
    end_date?: string;
    questions?: { question_text: string; question_type: string; required?: boolean }[];
  }): Promise<SatisfactionSurvey> {
    const response = await api.post('/satisfaction', data);
    return response.data || response;
  },

  async updateSurvey(id: string, data: Partial<SatisfactionSurvey> & { questions?: any[] }): Promise<SatisfactionSurvey> {
    const response = await api.put(`/satisfaction/${id}`, data);
    return response.data || response;
  },

  async submitResponse(surveyId: string, answers: {
    question_id: string;
    rating_value?: number;
    text_value?: string;
    boolean_value?: boolean;
  }[]): Promise<any> {
    const response = await api.post(`/satisfaction/${surveyId}/respond`, { answers });
    return response.data || response;
  },

  async getResults(surveyId: string): Promise<SurveyResults> {
    const response = await api.get(`/satisfaction/${surveyId}/results`);
    return response.data || response;
  },

  async checkUserResponse(surveyId: string): Promise<boolean> {
    const response = await api.get(`/satisfaction/${surveyId}/check`);
    return (response.data || response)?.has_responded || false;
  },

  async deleteSurvey(id: string): Promise<void> {
    await api.delete(`/satisfaction/${id}`);
  },
};
