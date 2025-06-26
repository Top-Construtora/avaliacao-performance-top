import { supabase } from '../lib/supabase';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  WrittenFeedback
} from '../types/evaluation.types';

export const evaluationService = {
  // ====================================
  // CYCLES
  // ====================================
  async getCurrentCycle(): Promise<EvaluationCycle | null> {
    try {
      console.log('Buscando ciclo ativo no Supabase...');
      
      // Busca ciclos com status 'open' E que estejam dentro do período válido
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .eq('status', 'open')
        .lte('start_date', today) // start_date <= hoje
        .gte('end_date', today)   // end_date >= hoje
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar ciclo:', error);
        throw error;
      }

      console.log('Resultado da busca:', data);
      
      if (!data || data.length === 0) {
        console.log('Nenhum ciclo ativo no período atual');
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Erro ao buscar ciclo atual:', error);
      return null;
    }
  },

  async getAllCycles(): Promise<EvaluationCycle[]> {
    const { data, error } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Adiciona informação se o ciclo está no período válido
    const today = new Date();
    const cyclesWithStatus = (data || []).map(cycle => {
      const startDate = new Date(cycle.start_date);
      const endDate = new Date(cycle.end_date);
      const isInPeriod = today >= startDate && today <= endDate;
      
      return {
        ...cycle,
        isInPeriod,
        isActive: cycle.status === 'open' && isInPeriod
      };
    });
    
    return cyclesWithStatus;
  },

  async createCycle(cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>): Promise<EvaluationCycle> {
    try {
      console.log('Criando ciclo:', cycle);
      
      // Primeiro, cria o ciclo diretamente na tabela
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .insert({
          title: cycle.title,
          description: cycle.description,
          start_date: cycle.start_date,
          end_date: cycle.end_date,
          status: cycle.status || 'draft',
          is_editable: cycle.is_editable !== undefined ? cycle.is_editable : true,
          created_by: cycle.created_by
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ciclo:', error);
        throw error;
      }

      console.log('Ciclo criado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao criar ciclo:', error);
      throw error;
    }
  },

  async openCycle(cycleId: string): Promise<void> {
    try {
      console.log('Abrindo ciclo:', cycleId);
      
      const { error } = await supabase
        .from('evaluation_cycles')
        .update({ 
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', cycleId);

      if (error) {
        console.error('Erro ao abrir ciclo:', error);
        throw error;
      }

      console.log('Ciclo aberto com sucesso');
    } catch (error) {
      console.error('Erro ao abrir ciclo:', error);
      throw error;
    }
  },

  async closeCycle(cycleId: string): Promise<void> {
    const { error } = await supabase
      .from('evaluation_cycles')
      .update({ status: 'closed', is_editable: false })
      .eq('id', cycleId);

    if (error) throw error;
  },

  // ====================================
  // SELF EVALUATION
  // ====================================
  // Validação de período antes de salvar avaliações
  validateEvaluationPeriod(cycle: EvaluationCycle): { isValid: boolean; message?: string } {
    const today = new Date();
    const startDate = new Date(cycle.start_date);
    const endDate = new Date(cycle.end_date);
    
    if (today < startDate) {
      return {
        isValid: false,
        message: `O período de avaliação ainda não iniciou. Início em ${startDate.toLocaleDateString('pt-BR')}.`
      };
    }
    
    if (today > endDate) {
      return {
        isValid: false,
        message: `O período de avaliação já encerrou em ${endDate.toLocaleDateString('pt-BR')}.`
      };
    }
    
    return { isValid: true };
  },

  async saveSelfEvaluation(
    cycleId: string,
    employeeId: string,
    competencies: Array<{
      name: string;
      description: string;
      category: string;
      score: number;
      written_response?: string;
    }>,
    writtenFeedback: WrittenFeedback
  ): Promise<EvaluationExtended> {
    // Primeiro, busca o ciclo para validar o período
    const { data: cycle } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    
    if (!cycle) {
      throw new Error('Ciclo não encontrado');
    }
    
    // Valida o período
    const validation = this.validateEvaluationPeriod(cycle);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    const { data, error } = await supabase
      .rpc('save_self_evaluation', {
        p_cycle_id: cycleId,
        p_employee_id: employeeId,
        p_competencies: competencies,
        p_written_feedback: writtenFeedback
      });

    if (error) throw error;
    return data;
  },

  async completeSelfEvaluation(evaluationId: string): Promise<void> {
    const { error } = await supabase
      .from('evaluations')
      .update({ 
        status: 'completed',
        evaluation_date: new Date().toISOString()
      })
      .eq('id', evaluationId);

    if (error) throw error;
  },

  // ====================================
  // LEADER EVALUATION
  // ====================================
  async saveLeaderEvaluation(
    cycleId: string,
    employeeId: string,
    evaluatorId: string,
    competencies: Array<{
      name: string;
      description: string;
      category: string;
      score: number;
    }>,
    potentialScore: number,
    feedback?: {
      strengths?: string;
      improvements?: string;
      observations?: string;
    }
  ): Promise<EvaluationExtended> {
    // Busca o ciclo para validar o período
    const { data: cycle } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    
    if (!cycle) {
      throw new Error('Ciclo não encontrado');
    }
    
    // Valida o período
    const validation = this.validateEvaluationPeriod(cycle);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    // First, create the evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        cycle_id: cycleId,
        employee_id: employeeId,
        evaluator_id: evaluatorId,
        evaluation_type: 'leader',
        type: 'leader', // Legacy support
        status: 'in-progress',
        potential_score: potentialScore,
        strengths: feedback?.strengths,
        improvements: feedback?.improvements,
        observations: feedback?.observations
      })
      .select()
      .single();

    if (evalError) throw evalError;

    // Then, insert competencies
    const competencyInserts = competencies.map(comp => ({
      evaluation_id: evaluation.id,
      criterion_name: comp.name,
      criterion_description: comp.description,
      category: comp.category,
      score: comp.score
    }));

    const { error: compError } = await supabase
      .from('evaluation_competencies')
      .insert(competencyInserts);

    if (compError) throw compError;

    // Update scores
    await this.updateEvaluationScores(evaluation.id);

    return evaluation;
  },

  // ====================================
  // CONSENSUS
  // ====================================
  async createConsensusMeeting(
    meeting: Omit<ConsensusMeeting, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ConsensusMeeting> {
    const { data, error } = await supabase
      .from('consensus_meetings')
      .insert(meeting)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConsensusMeeting(
    meetingId: string,
    updates: Partial<ConsensusMeeting>
  ): Promise<ConsensusMeeting> {
    const { data, error } = await supabase
      .from('consensus_meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeConsensusMeeting(
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ): Promise<void> {
    const { error } = await supabase
      .from('consensus_meetings')
      .update({
        consensus_performance_score: performanceScore,
        consensus_potential_score: potentialScore,
        meeting_notes: notes,
        status: 'completed',
        meeting_date: new Date().toISOString()
      })
      .eq('id', meetingId);

    if (error) throw error;
  },

  // ====================================
  // QUERIES
  // ====================================
  async getCycleDashboard(cycleId: string): Promise<CycleDashboard[]> {
    const { data, error } = await supabase
      .from('cycle_dashboard')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('employee_name');

    if (error) throw error;
    return data || [];
  },

  async getEmployeeEvaluations(
    cycleId: string,
    employeeId: string
  ): Promise<{
    self?: EvaluationExtended;
    leader?: EvaluationExtended;
    consensus?: ConsensusMeeting;
  }> {
    // Get self evaluation
    const { data: selfEval } = await supabase
      .from('evaluations')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('employee_id', employeeId)
      .eq('evaluation_type', 'self')
      .single();

    // Get leader evaluation
    const { data: leaderEval } = await supabase
      .from('evaluations')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('employee_id', employeeId)
      .eq('evaluation_type', 'leader')
      .single();

    // Get consensus
    const { data: consensus } = await supabase
      .from('consensus_meetings')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('employee_id', employeeId)
      .single();

    return {
      self: selfEval || undefined,
      leader: leaderEval || undefined,
      consensus: consensus || undefined
    };
  },

  async getEvaluationCompetencies(evaluationId: string): Promise<EvaluationCompetency[]> {
    const { data, error } = await supabase
      .from('evaluation_competencies')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getNineBoxData(cycleId: string): Promise<NineBoxData[]> {
    const { data, error } = await supabase
      .rpc('get_ninebox_data', { p_cycle_id: cycleId });

    if (error) throw error;
    return data || [];
  },

  // ====================================
  // HELPERS
  // ====================================
  async updateEvaluationScores(evaluationId: string): Promise<void> {
    const competencies = await this.getEvaluationCompetencies(evaluationId);
    
    const technical = competencies.filter(c => c.category === 'technical');
    const behavioral = competencies.filter(c => c.category === 'behavioral');
    const deliveries = competencies.filter(c => c.category === 'deliveries');

    const technicalScore = technical.reduce((sum, c) => sum + (c.score || 0), 0) / technical.length || 0;
    const behavioralScore = behavioral.reduce((sum, c) => sum + (c.score || 0), 0) / behavioral.length || 0;
    const deliveriesScore = deliveries.reduce((sum, c) => sum + (c.score || 0), 0) / deliveries.length || 0;
    const finalScore = (technicalScore + behavioralScore + deliveriesScore) / 3;

    const { error } = await supabase
      .from('evaluations')
      .update({
        technical_score: Number(technicalScore.toFixed(2)),
        behavioral_score: Number(behavioralScore.toFixed(2)),
        deliveries_score: Number(deliveriesScore.toFixed(2)),
        final_score: Number(finalScore.toFixed(2))
      })
      .eq('id', evaluationId);

    if (error) throw error;
  },

  async checkExistingEvaluation(
    cycleId: string,
    employeeId: string,
    evaluationType: 'self' | 'leader'
  ): Promise<boolean> {
    const { count } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('cycle_id', cycleId)
      .eq('employee_id', employeeId)
      .eq('evaluation_type', evaluationType);

    return (count || 0) > 0;
  }
};