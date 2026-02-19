import { api } from '../config/api';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  SelfEvaluation,
  LeaderEvaluation,
  EvaluationSummary,
  EvaluationHistory
} from '../types/evaluation.types';

export const evaluationService = {
  // ====================================
  // EVALUATION CYCLES
  // ====================================
  
  // Renomeie para corresponder ao que o hook espera
  async getAllCycles(): Promise<EvaluationCycle[]> {
    try {
      const response = await api.get('/evaluations/cycles');
      // O backend retorna { success: true, data: ... }
      if (response && response.success) {
        return response.data || [];
      }
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar ciclos:', error);
      return [];
    }
  },

  async getCurrentCycle(): Promise<EvaluationCycle | null> {
    try {
      const response = await api.get('/evaluations/cycles/current');
      // O backend retorna { success: true, data: ... }
      if (response && response.success) {
        return response.data || null;
      }
      return response || null;
    } catch (error) {
      console.error('Erro ao buscar ciclo atual:', error);
      return null;
    }
  },

  async createCycle(cycle: Partial<EvaluationCycle>): Promise<EvaluationCycle> {
    const response = await api.post('/evaluations/cycles', cycle);
    // O backend retorna { success: true, data: ... }
    if (response && response.success) {
      return response.data;
    }
    return response;
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
    try {
      const response = await api.get(`/evaluations/cycles/${cycleId}/dashboard`);

      // O backend retorna { success: true, data: ... }
      if (response && response.success) {
        return response.data || [];
      }
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return [];
    }
  },

  async getNineBoxData(cycleId: string): Promise<NineBoxData[]> {
    try {
      const response = await api.get(`/evaluations/cycles/${cycleId}/nine-box`);
      // O backend retorna { success: true, data: ... }
      if (response && response.success) {
        return response.data || [];
      }
      return response || [];
    } catch (error) {
      console.error('Erro ao buscar nine box:', error);
      return [];
    }
  },

  // ====================================
  // EVALUATIONS
  // ====================================
  async getEmployeeEvaluations(cycleId: string, employeeId: string): Promise<EvaluationExtended[]> {
    try {
      const response = await api.get(`/evaluations/employee/${employeeId}?cycleId=${cycleId}`);
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
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
      // O backend retorna { success: true, data: boolean }
      if (response && response.success !== undefined) {
        return response.data ?? false;
      }
      return response ?? false;
    } catch {
      return false;
    }
  },

  // ====================================
  // AUTOAVALIAÇÕES
  // ====================================
  
  async getSelfEvaluations(employeeId: string, cycleId?: string): Promise<SelfEvaluation[]> {
    try {
      const url = cycleId
        ? `/evaluations/self-evaluations/${employeeId}?cycleId=${cycleId}`
        : `/evaluations/self-evaluations/${employeeId}`;
      const response = await api.get(url);
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar autoavaliações:', error);
      return [];
    }
  },

  async saveSelfEvaluation(
    cycleId: string,
    employeeId: string,
    competencies: EvaluationCompetency[],
    toolkit?: {
      knowledge?: string[];
      tools?: string[];
      strengths_internal?: string[];
      qualities?: string[];
    }
  ): Promise<SelfEvaluation> {
    console.log('📡 [evaluationService] Salvando autoavaliação:', {
      cycleId,
      employeeId,
      competenciesCount: competencies.length,
      hasToolkit: !!toolkit
    });

    try {
      const response = await api.post('/evaluations/self', {
        cycleId,
        employeeId,
        competencies,
        toolkit
      });

      console.log('✅ [evaluationService] Autoavaliação salva com sucesso:', response);
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error: any) {
      console.error('❌ [evaluationService] Erro ao salvar autoavaliação:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ====================================
  // AVALIAÇÕES DE LÍDER
  // ====================================
  
  async getLeaderEvaluations(employeeId: string, cycleId?: string): Promise<LeaderEvaluation[]> {
    try {
      const url = cycleId
        ? `/evaluations/leader-evaluations/${employeeId}?cycleId=${cycleId}`
        : `/evaluations/leader-evaluations/${employeeId}`;
      const response = await api.get(url);
      // O backend retorna { success: true, data: [...] }
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações de líder:', error);
      return [];
    }
  },

  async saveLeaderEvaluation(
    cycleId: string,
    employeeId: string,
    evaluatorId: string,
    competencies: EvaluationCompetency[],
    potentialScore: number,
    feedback?: {
      strengths_internal?: string;
      improvements?: string;
      observations?: string;
    },
    pdi?: {
      goals: string[];
      actions: string[];
      resources?: string[];
      timeline?: string;
    },
    potentialDetails?: Record<string, { name: string; score: number }>
  ): Promise<LeaderEvaluation> {
    try {
      const response = await api.post('/evaluations/leader', {
        cycleId,
        employeeId,
        evaluatorId,
        competencies,
        potentialScore,
        potentialDetails,
        feedback,
        pdi
      });
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error: any) {
      console.error('Erro ao salvar avaliação de líder:', error);
      throw error;
    }
  },

  // ====================================
  // CONSENSUS
  // ====================================
  async createConsensusMeeting(
    meeting: Partial<ConsensusMeeting>
  ): Promise<ConsensusMeeting> {
    const response = await api.post('/evaluations/consensus', meeting);
    // O backend retorna { success: true, data: {...} }
    return response.data || response;
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
  },

  // ====================================
  // FUNÇÕES AUXILIARES
  // ====================================
  
  // Calcular score por categoria
  calculateCategoryScore(competencies: EvaluationCompetency[], category: string): number {
    const categoryComps = competencies.filter(c => c.category === category);
    if (categoryComps.length === 0) return 0;

    const sum = categoryComps.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return sum / categoryComps.length;
  },

  // Calcular score final com média ponderada
  calculateFinalScore(competencies: EvaluationCompetency[]): number {
    if (competencies.length === 0) return 0;

    // Calcular média de cada categoria
    const technicalScore = this.calculateCategoryScore(competencies, 'technical');
    const behavioralScore = this.calculateCategoryScore(competencies, 'behavioral');
    const deliveriesScore = this.calculateCategoryScore(competencies, 'deliveries');

    // Aplicar pesos: technical 50%, behavioral 30%, deliveries 20%
    const weightedScore = (technicalScore * 0.5) + (behavioralScore * 0.3) + (deliveriesScore * 0.2);

    // Arredondar para 10 casas decimais para eliminar erros de precisão de ponto flutuante
    return Math.round(weightedScore * 10000000000) / 10000000000;
  },

  // Mapear posição no Nine Box
  getNineBoxPosition(performance: number, potential: number): string {
    const perfLevel = performance <= 2 ? 'low' : performance <= 3 ? 'medium' : 'high';
    const potLevel = potential <= 2 ? 'low' : potential <= 3 ? 'medium' : 'high';
    
    const positions: { [key: string]: string } = {
      'low-low': 'Questionável',
      'low-medium': 'Novo/Desenvolvimento',
      'low-high': 'Enigma',
      'medium-low': 'Eficaz',
      'medium-medium': 'Mantenedor',
      'medium-high': 'Forte Performance',
      'high-low': 'Especialista',
      'high-medium': 'Alto Performance',
      'high-high': 'Estrela'
    };
    
    return positions[`${perfLevel}-${potLevel}`] || 'Não classificado';
  },

  // ====================================
  // PDI - PLANO DE DESENVOLVIMENTO INDIVIDUAL
  // ====================================
  
  async savePDI(pdiData: {
    employeeId: string;
    goals: string[];
    actions: string[];
    resources?: string[];
    timeline?: string;
    items?: any[]; // Adicionar suporte para items
  }): Promise<any> {
    try {
      // CORRIGIDO: Usar a rota correta /pdi que usa o pdiController
      // A rota antiga /evaluations/pdi estava marcando PDIs como 'completed' em vez de atualizar
      // Remover /api do endpoint pois o baseURL já inclui /api
      const response = await api.post('/pdi', pdiData);
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      throw error;
    }
  },

  async getPDI(employeeId: string): Promise<any> {
    try {
      // CORRIGIDO: Usar a rota correta /pdi
      // Remover /api do endpoint pois o baseURL já inclui /api
      const response = await api.get(`/pdi/${employeeId}`);
      // O backend retorna { success: true, data: pdi }
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar PDI:', error);
      return null;
    }
  },

  async updatePDI(pdiId: string, updates: {
    goals?: string[];
    actions?: string[];
    resources?: string[];
    timeline?: string;
  }): Promise<any> {
    try {
      const response = await api.put(`/evaluations/pdi/${pdiId}`, updates);
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error) {
      console.error('Erro ao atualizar PDI:', error);
      throw error;
    }
  },

  // ====================================
  // PROMOÇÃO DE QUADRANTE NINE BOX
  // ====================================

  /**
   * Promove um colaborador para um quadrante de potencial superior no Nine Box
   * @param consensusId - ID da avaliação de consenso
   * @param promotedPotentialQuadrant - Quadrante de destino (1=Baixo, 2=Médio, 3=Alto)
   */
  async promoteNineBoxQuadrant(
    consensusId: string,
    promotedPotentialQuadrant: number
  ): Promise<any> {
    try {
      const response = await api.put(`/evaluations/consensus/${consensusId}/promote`, {
        promotedPotentialQuadrant
      });
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error: any) {
      console.error('Erro ao promover quadrante:', error);
      throw error;
    }
  },

  // ====================================
  // DELIBERAÇÕES DO COMITÊ
  // ====================================

  // ====================================
  // HISTÓRICO DE AVALIAÇÕES POR CICLO
  // ====================================

  async getEmployeeEvaluationHistory(employeeId: string): Promise<EvaluationHistory[]> {
    try {
      const response = await api.get(`/evaluations/employee/${employeeId}/evaluation-history`);
      if (response && response.success) {
        return response.data || [];
      }
      return response?.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de avaliações:', error);
      return [];
    }
  },

  /**
   * Salva as deliberações do comitê para um colaborador
   * @param consensusId - ID da avaliação de consenso
   * @param deliberations - Texto das deliberações
   */
  async saveCommitteeDeliberations(
    consensusId: string,
    deliberations: string
  ): Promise<any> {
    try {
      const response = await api.put(`/evaluations/consensus/${consensusId}/deliberations`, {
        deliberations
      });
      // O backend retorna { success: true, data: {...} }
      return response.data || response;
    } catch (error: any) {
      console.error('Erro ao salvar deliberações:', error);
      throw error;
    }
  }
};