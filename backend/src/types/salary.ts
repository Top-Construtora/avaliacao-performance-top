// Tipos para o sistema de cargos e salários

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
    can_view_people_committee: boolean;
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
  
  export interface ProgressionHistory {
    id: string;
    user_id: string;
    from_track_position_id?: string;
    to_track_position_id: string;
    from_salary_level_id?: string;
    to_salary_level_id: string;
    from_salary?: number;
    to_salary: number;
    progression_type: 'horizontal' | 'vertical';
    progression_date: string;
    reason?: string;
    approved_by?: string;
    created_at: string;
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
  
  export interface DepartmentSalaryReport {
    department: string;
    count: number;
    totalSalary: number;
    avgSalary: number;
    minSalary: number;
    maxSalary: number;
  }
  
  export interface PositionSalaryReport {
    position: string;
    class: string;
    count: number;
    totalSalary: number;
    avgSalary: number;
    minSalary: number;
    maxSalary: number;
  }