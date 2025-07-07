import { api } from '../config/api';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  WrittenFeedback,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData
} from '../types/evaluation.types';

export const evaluationService = {
  // ====================================
  // EVALUATION CYCLES
  // ====================================
  
  // Renomeie para corresponder ao que o hook espera
  async getAllCycles(): Promise<EvaluationCycle[]> {
    const response = await api.get('/evaluations/cycles');
    return response.data || [];
  },

  async getCurrentCycle(): Promise<EvaluationCycle | null> {
    const response = await api.get('/evaluations/cycles/current');
    return response.data || null;
  },

  async createCycle(cycle: Partial<EvaluationCycle>): Promise<EvaluationCycle> {
    const response = await api.post('/evaluations/cycles', cycle);
    return response.data;
  },

  async openCycle(cycleId: string): Promise<void> {
    await api.put(`/evaluations/cycles/${cycleId}/open`, {});
  },

  async closeCycle(cycleId: string): Promise<void> {
    await api.put(`/evaluations/cycles/${cycleId}/close`, {});
  },

  // ====================================
  // DASHBOARD
  // ====================================
  async getCycleDashboard(cycleId: string): Promise<CycleDashboard[]> {
    const response = await api.get(`/evaluations/cycles/${cycleId}/dashboard`);
    return response.data || [];
  },

  async getNineBoxData(cycleId: string): Promise<NineBoxData[]> {
    const response = await api.get(`/evaluations/cycles/${cycleId}/nine-box`);
    return response.data || [];
  },

  // ====================================
  // EVALUATIONS
  // ====================================
  async getEmployeeEvaluations(cycleId: string, employeeId: string): Promise<EvaluationExtended[]> {
    const response = await api.get(`/evaluations/employee/${employeeId}?cycleId=${cycleId}`);
    return response.data || [];
  },

  async checkExistingEvaluation(
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ): Promise<boolean> {
    try {
      const response = await api.get(
        `/evaluations/check?cycleId=${cycleId}&employeeId=${employeeId}&type=${type}`
      );
      return response.data || false;
    } catch {
      return false;
    }
  },

  async saveSelfEvaluation(
    cycleId: string,
    employeeId: string,
    competencies: EvaluationCompetency[],
    writtenFeedback: WrittenFeedback
  ): Promise<EvaluationExtended> {
    const response = await api.post('/evaluations/self', {
      cycleId,
      employeeId,
      competencies,
      writtenFeedback
    });
    return response.data;
  },

  async saveLeaderEvaluation(
    cycleId: string,
    employeeId: string,
    evaluatorId: string,
    competencies: EvaluationCompetency[],
    potentialScore: number,
    feedback?: {
      strengths?: string;
      improvements?: string;
      observations?: string;
    }
  ): Promise<EvaluationExtended> {
    const response = await api.post('/evaluations/leader', {
      cycleId,
      employeeId,
      evaluatorId,
      competencies,
      potentialScore,
      feedback
    });
    return response.data;
  },

  // ====================================
  // CONSENSUS
  // ====================================
  async createConsensusMeeting(
    meeting: Partial<ConsensusMeeting>
  ): Promise<ConsensusMeeting> {
    const response = await api.post('/evaluations/consensus', meeting);
    return response.data;
  },

  async completeConsensusMeeting(
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ): Promise<void> {
    await api.put(`/evaluations/consensus/${meetingId}/complete`, {
      performanceScore,
      potentialScore,
      notes
    });
  }
};