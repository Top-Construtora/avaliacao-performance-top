export interface EvaluationCycle {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'open' | 'closed';
    is_editable: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
  }
  
  export interface EvaluationCompetency {
    id: string;
    evaluation_id: string;
    criterion_name: string;
    criterion_description: string;
    category: 'technical' | 'behavioral' | 'deliveries';
    score?: number;
    written_response?: string;
    weight?: number;
    created_at: string;
  }
  
  export interface EvaluationExtended {
    id: string;
    cycle_id: string;
    employee_id: string;
    evaluator_id: string;
    evaluation_type: 'self' | 'leader' | 'consensus';
    type?: 'self' | 'leader' | 'potential'; // Legacy field
    status: 'pending' | 'in-progress' | 'completed';
    technical_score?: number;
    behavioral_score?: number;
    deliveries_score?: number;
    final_score?: number;
    potential_score?: number;
    consensus_performance_score?: number;
    consensus_potential_score?: number;
    written_feedback?: WrittenFeedback;
    strengths?: string;
    improvements?: string;
    observations?: string;
    evaluation_date: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface WrittenFeedback {
    achievements?: string;
    challenges?: string;
    goals?: string;
    development_areas?: string;
    additional_comments?: string;
  }
  
  export interface ConsensusMeeting {
    id: string;
    cycle_id: string;
    employee_id: string;
    self_evaluation_id: string;
    leader_evaluation_id: string;
    meeting_date?: string;
    consensus_performance_score: number;
    consensus_potential_score: number;
    meeting_notes?: string;
    participants?: string[];
    status: 'scheduled' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    created_by: string;
  }
  
  export interface CycleDashboard {
    cycle_id: string;
    cycle_title: string;
    cycle_status: 'draft' | 'open' | 'closed';
    employee_id: string;
    employee_name: string;
    position: string;
    reports_to?: string;
    self_evaluation_id?: string;
    self_evaluation_status?: string;
    self_score?: number;
    leader_evaluation_id?: string;
    leader_evaluation_status?: string;
    leader_score?: number;
    potential_score?: number;
    consensus_id?: string;
    consensus_performance_score?: number;
    consensus_potential_score?: number;
    consensus_status?: string;
    ninebox_position?: number;
  }
  
  export interface NineBoxData {
    employee_id: string;
    employee_name: string;
    performance_score: number;
    potential_score: number;
    box_position: number;
    box_description: string;
  }
  
  // Competency templates for evaluations
  export const EVALUATION_COMPETENCIES = {
    technical: [
      {
        name: 'Gestão do Conhecimento',
        description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes',
        category: 'technical' as const
      },
      {
        name: 'Orientação a Resultados com Segurança',
        description: 'Foco em resultados mantendo padrões de segurança e qualidade',
        category: 'technical' as const
      },
      {
        name: 'Pensamento Crítico',
        description: 'Capacidade de analisar criticamente situações e propor soluções eficazes',
        category: 'technical' as const
      },
      {
        name: 'Assertividade e Proatividade',
        description: 'Comunicação assertiva e capacidade de prover soluções de forma proativa',
        category: 'technical' as const
      }
    ],
    behavioral: [
      {
        name: 'Comunicação',
        description: 'Capacidade de se comunicar de forma clara, eficaz e respeitosa',
        category: 'behavioral' as const
      },
      {
        name: 'Inteligência Emocional',
        description: 'Habilidade de reconhecer e gerenciar emoções próprias e dos outros',
        category: 'behavioral' as const
      },
      {
        name: 'Delegação',
        description: 'Capacidade de distribuir tarefas adequadamente e empoderar a equipe',
        category: 'behavioral' as const
      },
      {
        name: 'Patrimonialismo',
        description: 'Cuidado e responsabilidade com os recursos e patrimônio da empresa',
        category: 'behavioral' as const
      }
    ],
    deliveries: [
      {
        name: 'Meritocracia e Missão Compartilhada',
        description: 'Reconhecimento por mérito e alinhamento com os valores da empresa',
        category: 'deliveries' as const
      },
      {
        name: 'Espiral de Passos',
        description: 'Desenvolvimento contínuo e progressão estruturada na carreira',
        category: 'deliveries' as const
      },
      {
        name: 'Cooperação',
        description: 'Trabalho colaborativo e contribuição para o sucesso coletivo',
        category: 'deliveries' as const
      },
      {
        name: 'Cliente em 1° Lugar',
        description: 'Foco na satisfação e necessidades do cliente interno e externo',
        category: 'deliveries' as const
      }
    ]
  };
  
  // Helper functions
  export const calculateAverageScore = (competencies: EvaluationCompetency[]): number => {
    if (!competencies.length) return 0;
    const sum = competencies.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / competencies.length).toFixed(2));
  };
  
  export const getCategoryScore = (competencies: EvaluationCompetency[], category: string): number => {
    const categoryComps = competencies.filter(c => c.category === category);
    return calculateAverageScore(categoryComps);
  };
  
  export const getNineBoxDescription = (position: number): string => {
    const descriptions: Record<number, string> = {
      1: 'Insuficiente - Risco com desempenho',
      2: 'Questionável - Potencial para melhorar',
      3: 'Dilema - Potencial não demonstrado',
      4: 'Eficaz - Especialista de alto valor',
      5: 'Mantenedor - Boa performance, espaço para crescer',
      6: 'Forte Desempenho - Potencial para mudanças',
      7: 'Comprometimento - Especialista difícil de substituir',
      8: 'Alto Impacto - Contribuição de valor',
      9: 'Futuro Líder - Potencial além da função atual'
    };
    return descriptions[position] || 'Posição não definida';
  };

  export interface Evaluation {
    id: string;
    cycle_id: string;
    employee_id: string;
    evaluator_id?: string;
    evaluation_type: 'self' | 'leader' | 'consensus';
    type?: 'self' | 'leader' | 'consensus'; // Legacy support
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
    updated_at?: string;
    evaluation_date?: string;
    evaluation_competencies?: EvaluationCompetency[];
  }
  
  export interface ConsensusParticipant {
    id: string;
    meeting_id: string;
    user_id: string;
    role: 'facilitator' | 'participant';
    attended: boolean;
    created_at: string;
  }