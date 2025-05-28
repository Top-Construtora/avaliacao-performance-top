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