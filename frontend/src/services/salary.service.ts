import { api } from '../config/api';

// Tipos do sistema de salários
export interface SalaryClass {
  id: string;
  code: string;
  name: string;
  description?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPosition {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_multifunctional: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryLevel {
  id: string;
  name: string;
  percentage: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CareerTrack {
  id: string;
  department_id?: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface TrackPosition {
  id: string;
  track_id: string;
  position_id: string;
  class_id: string;
  base_salary: number;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  track?: CareerTrack;
  position?: JobPosition;
  class?: SalaryClass;
}

export interface ProgressionRule {
  id: string;
  from_position_id: string;
  to_position_id: string;
  progression_type: 'horizontal' | 'vertical' | 'merit';
  min_time_months?: number;
  performance_requirement?: number;
  additional_requirements?: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
  from_position?: TrackPosition;
  to_position?: TrackPosition;
}

export interface ProgressionHistory {
  id: string;
  user_id: string;
  from_track_position_id?: string;
  to_track_position_id: string;
  from_salary_level_id?: string;
  to_salary_level_id: string;
  from_salary?: number;
  to_salary: number;
  progression_type: 'horizontal' | 'vertical' | 'merit';
  progression_date: string;
  reason?: string;
  approved_by?: string;
  created_at: string;
  from_position?: any;
  to_position?: any;
  from_level?: any;
  to_level?: any;
  approver?: any;
}

export interface UserSalaryInfo {
  id: string;
  name: string;
  email: string;
  contract_type: 'CLT' | 'PJ';
  base_salary?: number;
  level_percentage?: number;
  calculated_salary?: number;
  current_salary?: number;
  department_name?: string;
  position_name?: string;
  class_code?: string;
  salary_level?: string;
  track_name?: string;
}

export interface SalaryCalculation {
  baseSalary: number;
  levelPercentage: number;
  calculatedSalary: number;
}

export interface SalaryOverview {
  total_employees: number;
  total_clt: number;
  total_pj: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
  total_tracks: number;
  total_positions: number;
}

export const salaryService = {
  // ===== CLASSES SALARIAIS =====
  async getClasses(): Promise<SalaryClass[]> {
    const response = await api.get('/salary/classes');
    return response.data;
  },

  async getClassById(id: string): Promise<SalaryClass> {
    const response = await api.get(`/salary/classes/${id}`);
    return response.data;
  },

  async createClass(data: Omit<SalaryClass, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryClass> {
    const response = await api.post('/salary/classes', data);
    return response.data;
  },

  async updateClass(id: string, data: Partial<SalaryClass>): Promise<SalaryClass> {
    const response = await api.put(`/salary/classes/${id}`, data);
    return response.data;
  },

  async deleteClass(id: string): Promise<void> {
    await api.delete(`/salary/classes/${id}`);
  },

  // ===== CARGOS =====
  async getPositions(): Promise<JobPosition[]> {
    const response = await api.get('/salary/positions');
    return response.data;
  },

  async getPositionById(id: string): Promise<JobPosition> {
    const response = await api.get(`/salary/positions/${id}`);
    return response.data;
  },

  async createPosition(data: Omit<JobPosition, 'id' | 'created_at' | 'updated_at'>): Promise<JobPosition> {
    const response = await api.post('/salary/positions', data);
    return response.data;
  },

  async updatePosition(id: string, data: Partial<JobPosition>): Promise<JobPosition> {
    const response = await api.put(`/salary/positions/${id}`, data);
    return response.data;
  },

  async deletePosition(id: string): Promise<void> {
    await api.delete(`/salary/positions/${id}`);
  },

  // ===== INTERNÍVEIS =====
  async getLevels(): Promise<SalaryLevel[]> {
    const response = await api.get('/salary/levels');
    return response.data;
  },

  async getLevelById(id: string): Promise<SalaryLevel> {
    const response = await api.get(`/salary/levels/${id}`);
    return response.data;
  },

  async createLevel(data: Omit<SalaryLevel, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryLevel> {
    const response = await api.post('/salary/levels', data);
    return response.data;
  },

  async updateLevel(id: string, data: Partial<SalaryLevel>): Promise<SalaryLevel> {
    const response = await api.put(`/salary/levels/${id}`, data);
    return response.data;
  },

  async deleteLevel(id: string): Promise<void> {
    await api.delete(`/salary/levels/${id}`);
  },

  // ===== TRILHAS =====
  async getTracks(): Promise<CareerTrack[]> {
    const response = await api.get('/salary/tracks');
    return response.data;
  },

  async getTrackById(id: string): Promise<CareerTrack> {
    const response = await api.get(`/salary/tracks/${id}`);
    return response.data;
  },

  async getTracksByDepartment(departmentId: string): Promise<CareerTrack[]> {
    const response = await api.get(`/salary/tracks/department/${departmentId}`);
    return response.data;
  },

  async createTrack(data: Omit<CareerTrack, 'id' | 'created_at' | 'updated_at'>): Promise<CareerTrack> {
    const response = await api.post('/salary/tracks', data);
    return response.data;
  },

  async updateTrack(id: string, data: Partial<CareerTrack>): Promise<CareerTrack> {
    const response = await api.put(`/salary/tracks/${id}`, data);
    return response.data;
  },

  async deleteTrack(id: string): Promise<void> {
    await api.delete(`/salary/tracks/${id}`);
  },

  // ===== POSIÇÕES NAS TRILHAS =====
  async getTrackPositions(): Promise<TrackPosition[]> {
    const response = await api.get('/salary/track-positions');
    return response.data;
  },

  async getTrackPositionById(id: string): Promise<TrackPosition> {
    const response = await api.get(`/salary/track-positions/${id}`);
    return response.data;
  },

  async getPositionsByTrack(trackId: string): Promise<TrackPosition[]> {
    const response = await api.get(`/salary/track-positions/track/${trackId}`);
    return response.data;
  },

  async createTrackPosition(data: Omit<TrackPosition, 'id' | 'created_at' | 'updated_at'>): Promise<TrackPosition> {
    const response = await api.post('/salary/track-positions', data);
    return response.data;
  },

  async updateTrackPosition(id: string, data: Partial<TrackPosition>): Promise<TrackPosition> {
    const response = await api.put(`/salary/track-positions/${id}`, data);
    return response.data;
  },

  async deleteTrackPosition(id: string): Promise<void> {
    await api.delete(`/salary/track-positions/${id}`);
  },

  // ===== REGRAS DE PROGRESSÃO =====
  async getProgressionRules(): Promise<ProgressionRule[]> {
    const response = await api.get('/salary/progression-rules');
    return response.data;
  },

  async getProgressionRuleById(id: string): Promise<ProgressionRule> {
    const response = await api.get(`/salary/progression-rules/${id}`);
    return response.data;
  },

  async getRulesByFromPosition(positionId: string): Promise<ProgressionRule[]> {
    const response = await api.get(`/salary/progression-rules/from/${positionId}`);
    return response.data;
  },

  async createProgressionRule(data: Omit<ProgressionRule, 'id' | 'created_at' | 'updated_at'>): Promise<ProgressionRule> {
    const response = await api.post('/salary/progression-rules', data);
    return response.data;
  },

  async updateProgressionRule(id: string, data: Partial<ProgressionRule>): Promise<ProgressionRule> {
    const response = await api.put(`/salary/progression-rules/${id}`, data);
    return response.data;
  },

  async deleteProgressionRule(id: string): Promise<void> {
    await api.delete(`/salary/progression-rules/${id}`);
  },

  // ===== GESTÃO DE USUÁRIOS =====
  async assignUserToTrack(userId: string, trackPositionId: string, salaryLevelId: string): Promise<any> {
    const response = await api.put(`/salary/users/${userId}/assign-track`, {
      trackPositionId,
      salaryLevelId
    });
    return response.data;
  },

  async updateUserSalaryLevel(userId: string, salaryLevelId: string): Promise<any> {
    const response = await api.put(`/salary/users/${userId}/update-level`, {
      salaryLevelId
    });
    return response.data;
  },

  async getUserSalaryInfo(userId: string): Promise<UserSalaryInfo> {
    const response = await api.get(`/salary/users/${userId}/salary-info`);
    return response.data;
  },

  async getUserPossibleProgressions(userId: string): Promise<any[]> {
    const response = await api.get(`/salary/users/${userId}/possible-progressions`);
    return response.data;
  },

  // ===== PROGRESSÃO =====
  async progressUser(userId: string, data: {
    toTrackPositionId: string;
    toSalaryLevelId: string;
    progressionType: 'horizontal' | 'vertical' | 'merit';
    reason?: string;
  }): Promise<any> {
    const response = await api.post(`/salary/users/${userId}/progress`, data);
    return response.data;
  },

  async getUserProgressionHistory(userId: string): Promise<ProgressionHistory[]> {
    const response = await api.get(`/salary/users/${userId}/progression-history`);
    return response.data;
  },

  // ===== RELATÓRIOS =====
  async getSalaryOverview(): Promise<SalaryOverview> {
    const response = await api.get('/salary/reports/overview');
    return response.data;
  },

  async getSalaryByDepartment(): Promise<any[]> {
    const response = await api.get('/salary/reports/by-department');
    return response.data;
  },

  async getSalaryByPosition(): Promise<any[]> {
    const response = await api.get('/salary/reports/by-position');
    return response.data;
  },

  // ===== CÁLCULO =====
  async calculateSalary(trackPositionId: string, salaryLevelId: string): Promise<SalaryCalculation> {
    const response = await api.post('/salary/calculate', {
      trackPositionId,
      salaryLevelId
    });
    return response.data;
  }
};