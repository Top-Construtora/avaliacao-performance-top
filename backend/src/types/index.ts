export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  active: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EvaluationCycle {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
}

export interface Evaluation {
  id: string;
  cycle_id: string;
  employee_id: string;
  evaluator_id: string;
  evaluation_type: 'self' | 'leader' | 'consensus';
  status: 'draft' | 'in-progress' | 'completed';
  performance_score?: number;
  potential_score?: number;
  final_score?: number;
  strengths?: string;
  improvements?: string;
  observations?: string;
  career_interests?: string;
  mobility?: string;
  created_at: string;
  updated_at: string;
}

export * from './supabase';
export * from './salary';