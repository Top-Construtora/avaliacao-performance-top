// Evaluation status
export type Status = 'pending' | 'in-progress' | 'completed';

// Employee information
export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  joinDate: string;
}

// Evaluation criteria
export interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  score?: number;
}

// Feedback sections
export interface Feedback {
  strengths: string;
  improvements: string;
  observations: string;
}

// Complete evaluation
export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  date: string;
  status: Status;
  criteria: Criterion[];
  feedback: Feedback;
  technicalScore: number;
  behavioralScore: number;
  deliveriesScore: number;
  finalScore: number;
  lastUpdated: string;
  isDraft: boolean;
}

// Summary statistics for dashboard
export interface EvaluationStats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

// Filter options for history
export interface HistoryFilters {
  employee: string;
  startDate: string;
  endDate: string;
  status: Status | 'all';
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  isLeader: boolean;
  isDirector: boolean; 
  teamIds: string[]; 
  leaderOfTeamIds: string[]; 
  departmentIds: string[]; 
  joinDate: string;
  avatar?: string;
  active: boolean;
  phone?: string;
  birthDate?: string;
  age?: number;
  directReports?: string[]; 
  reportsTo?: string; 
  profileImage?: string; 
}

export interface HierarchicalRelation {
  leaderId: string;
  subordinateId: string;
  teamId: string;
  createdAt: string;
}