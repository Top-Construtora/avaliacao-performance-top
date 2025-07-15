// User types
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
  contract_type?: 'CLT' | 'PJ' | 'INTERN';
  department_id?: string;
  admission_date?: string;
  position_start_date?: string;
  intern_level?: string;
  
  // Campos de trilha/salário
  current_track_position_id?: string;
  current_salary_level_id?: string;
  current_salary?: number;
  track_id?: string;
  position_id?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any; // Supabase User
  session: any; // Supabase Session
  profile: User; // Nossa tabela users
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  is_director: boolean;
  is_leader: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Department & Team types
export interface Department {
  id: string;
  name: string;
  description?: string;
  responsible_id?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  department_id?: string;
  responsible_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  created_at?: string;
}

// Evaluation types
export interface EvaluationCycle {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'open' | 'closed';
  is_editable?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Evaluation {
  id: string;
  cycle_id?: string;
  employee_id: string;
  evaluator_id: string;
  type: 'self' | 'leader' | 'potential';
  evaluation_type?: 'self' | 'leader' | 'consensus';
  status: 'pending' | 'in-progress' | 'completed';
  technical_score?: number;
  behavioral_score?: number;
  deliveries_score?: number;
  final_score?: number;
  potential_score?: number;
  consensus_performance_score?: number;
  consensus_potential_score?: number;
  strengths?: string;
  improvements?: string;
  observations?: string;
  evaluation_date?: string;
  written_feedback?: any;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCompetency {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  criterion_description?: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  score?: number;
  written_response?: string;
  weight?: number;
  created_at?: string;
}

export interface ConsensusEvaluation {
  id: string;
  employee_id: string;
  self_evaluation_id?: string;
  leader_evaluation_id?: string;
  consensus_score?: number;
  potential_score?: number;
  nine_box_position?: string;
  notes?: string;
  evaluation_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsensusMeeting {
  id: string;
  cycle_id?: string;
  employee_id: string;
  self_evaluation_id?: string;
  leader_evaluation_id?: string;
  meeting_date?: string;
  consensus_performance_score: number;
  consensus_potential_score: number;
  meeting_notes?: string;
  participants?: any;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// PDI (Development Plan) types
export interface DevelopmentPlan {
  id: string;
  employee_id: string;
  consensus_evaluation_id?: string;
  goals: string[];
  actions: string[];
  resources: string[];
  timeline?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Competency types
export interface Competency {
  id: string;
  name: string;
  description?: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  created_at?: string;
}

// Audit types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

// Database row types (for Supabase operations)
export interface UsersRow {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  phone: string | null;
  birth_date: string | null;
  join_date: string | null;
  active: boolean;
  reports_to: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
  contract_type: 'CLT' | 'PJ' | 'INTERN' | null;
  current_track_position_id: string | null;
  current_salary_level_id: string | null;
  current_salary: number | null;
  admission_date: string | null;
  position_start_date: string | null;
  department_id: string | null;
  track_id: string | null;
  position_id: string | null;
  intern_level: string | null;
}

export interface UsersInsert {
  id?: string;
  email: string;
  name: string;
  position: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string | null;
  active?: boolean;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN' | null;
  department_id?: string | null;
  admission_date?: string | null;
  position_start_date?: string | null;
  intern_level?: string | null;
}

export interface UsersUpdate {
  email?: string;
  name?: string;
  position?: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string | null;
  active?: boolean;
  reports_to?: string | null;
  profile_image?: string | null;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN' | null;
  department_id?: string | null;
  admission_date?: string | null;
  position_start_date?: string | null;
  intern_level?: string | null;
}

// Import and re-export other type files if they exist
export * from './supabase';
export * from './salary';