import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, Evaluation, Status, EvaluationStats, Criterion } from '../types';
import { mapCycleFromDB } from '../utils/fieldMapping';
import { api } from '../config/api'; 
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase'; // Adicionar import do supabase

// Interfaces para PDI
interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface ActionPlanData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}

// Interface para Nine Box
interface NineBoxResult {
  employeeId: string;
  quadrant: string;
  performance: number;
  potential: number;
  date: string;
}

interface EvaluationContextType {
  // Existentes
  employees: Employee[];
  evaluations: Evaluation[];
  stats: EvaluationStats;
  getEmployeeById: (id: string) => Employee | undefined;
  getEvaluationById: (id: string) => Evaluation | undefined;
  getEvaluationsByEmployeeId: (employeeId: string) => Evaluation[];
  getEvaluationsByStatus: (status: Status) => Evaluation[];
  saveEvaluation: (evaluation: Evaluation) => void;
  calculateFinalScore: (technical: number, behavioral: number, deliveries: number) => number;
  technicalCriteria: Criterion[];
  behavioralCriteria: Criterion[];
  deliveriesCriteria: Criterion[];

  // Novos para PDI
  pdis: ActionPlanData[];
  savePDI: (pdi: ActionPlanData) => void;
  updatePDI: (pdiId: string, pdi: ActionPlanData) => void;
  deletePDI: (pdiId: string) => void;
  getPDIById: (pdiId: string) => ActionPlanData | undefined;

  // Novos para Nine Box
  nineBoxResults: NineBoxResult[];
  saveNineBoxResult: (result: NineBoxResult) => void;
  getNineBoxByEmployeeId: (employeeId: string) => NineBoxResult | undefined;

  // 🔥 Adicionados 
  fetchCycles: () => Promise<void>;
  fetchEvaluations: (filters?: any) => Promise<void>;
  fetchStats: () => Promise<void>;
  loading: boolean;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);



export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  // Estados principais
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [technicalCriteria, setTechnicalCriteria] = useState<Criterion[]>([]);
  const [behavioralCriteria, setBehavioralCriteria] = useState<Criterion[]>([]);
  const [deliveriesCriteria, setDeliveriesCriteria] = useState<Criterion[]>([]);
  const [stats, setStats] = useState<EvaluationStats>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  // Estado para PDIs
  const [pdis, setPdis] = useState<ActionPlanData[]>(() => {
    const saved = localStorage.getItem('pdis');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado para Nine Box
  const [nineBoxResults, setNineBoxResults] = useState<NineBoxResult[]>(() => {
    const saved = localStorage.getItem('nineBoxResults');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔥 Estado para API
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Carregar dados do Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar competências do Supabase
        const { data: competenciesData } = await supabase
          .from('competencies')
          .select('*')
          .order('created_at');
        
        if (competenciesData) {
          // Separar competências por categoria
          const technical = competenciesData.filter((c: any) => c.category === 'technical');
          const behavioral = competenciesData.filter((c: any) => c.category === 'behavioral');
          const deliveries = competenciesData.filter((c: any) => c.category === 'deliveries');
          
          setTechnicalCriteria(technical);
          setBehavioralCriteria(behavioral);
          setDeliveriesCriteria(deliveries);
        }

        // Carregar employees do Supabase
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .eq('active', true);
        
        if (usersData) {
          // Mapear para o formato Employee com tipagem correta
          const mappedEmployees = usersData.map((user: any) => ({
            id: user.id,
            name: user.name,
            position: user.position,
            department: user.department || '',
            joinDate: user.join_date,
            reportsTo: user.reports_to
          }));
          setEmployees(mappedEmployees);
        }

        // Carregar evaluations do Supabase
        const { data: evalData } = await supabase
          .from('evaluations')
          .select(`
            *,
            evaluation_competencies (
              id,
              competency_id,
              score,
              competencies (
                id,
                name,
                description,
                category
              )
            )
          `);
        
        if (evalData) {
          // Mapear os dados de avaliação com as competências avaliadas
          const mappedEvaluations = evalData.map((evaluation: any) => ({
            id: evaluation.id,
            employeeId: evaluation.employee_id,
            evaluatorId: evaluation.evaluator_id,
            date: evaluation.created_at,
            status: evaluation.status || 'pending',
            criteria: evaluation.evaluation_competencies?.map((ec: any) => ({
              id: ec.competencies.id,
              name: ec.competencies.name,
              description: ec.competencies.description,
              category: ec.competencies.category,
              score: ec.score
            })) || [],
            feedback: {
              strengths: evaluation.strengths || '',
              improvements: evaluation.improvements || '',
              observations: evaluation.observations || ''
            },
            technicalScore: evaluation.technical_score || 0,
            behavioralScore: evaluation.behavioral_score || 0,
            deliveriesScore: evaluation.deliveries_score || 0,
            finalScore: evaluation.final_score || 0,
            lastUpdated: evaluation.updated_at,
            isDraft: evaluation.status === 'draft'
          }));
          setEvaluations(mappedEvaluations);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  // Update stats whenever evaluations change
  useEffect(() => {
    const pending = evaluations.filter(evaluation => evaluation.status === 'pending').length;
    const inProgress = evaluations.filter(evaluation => evaluation.status === 'in-progress').length;
    const completed = evaluations.filter(evaluation => evaluation.status === 'completed').length;

    setStats({
      pending,
      inProgress,
      completed,
      total: evaluations.length,
    });
  }, [evaluations]);

  // Salvar PDIs no localStorage
  useEffect(() => {
    localStorage.setItem('pdis', JSON.stringify(pdis));
  }, [pdis]);

  // Salvar Nine Box no localStorage
  useEffect(() => {
    localStorage.setItem('nineBoxResults', JSON.stringify(nineBoxResults));
  }, [nineBoxResults]);

  // Get employee by ID
  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  // Get evaluation by ID
  const getEvaluationById = (id: string) => {
    return evaluations.find(evaluation => evaluation.id === id);
  };

  // Get evaluations by employee ID
  const getEvaluationsByEmployeeId = (employeeId: string) => {
    return evaluations.filter(evaluation => evaluation.employeeId === employeeId);
  };

  // Get evaluations by status
  const getEvaluationsByStatus = (status: Status) => {
    return evaluations.filter(evaluation => evaluation.status === status);
  };

  // Save or update an evaluation
  const saveEvaluation = (evaluation: Evaluation) => {
    const index = evaluations.findIndex(e => e.id === evaluation.id);

    if (index !== -1) {
      // Update existing evaluation
      const updatedEvaluations = [...evaluations];
      updatedEvaluations[index] = {
        ...evaluation,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setEvaluations(updatedEvaluations);
    } else {
      // Add new evaluation
      setEvaluations([
        ...evaluations,
        {
          ...evaluation,
          id: `eval${evaluations.length + 1}`,
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      ]);
    }
  };

  // Calculate final score
  const calculateFinalScore = (technical: number, behavioral: number, deliveries: number): number => {
    const weightedScore = (technical * 0.4) + (behavioral * 0.3) + (deliveries * 0.3);
    return parseFloat(weightedScore.toFixed(2));
  };

  // Funções para PDI
  const savePDI = (pdi: ActionPlanData) => {
    setPdis(prev => {
      const existingIndex = prev.findIndex(p => p.id === pdi.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...pdi,
          dataAtualizacao: new Date().toISOString()
        };
        return updated;
      } else {
        return [...prev, {
          ...pdi,
          id: pdi.id || Date.now().toString(),
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        }];
      }
    });
  };

  const updatePDI = (pdiId: string, pdi: ActionPlanData) => {
    setPdis(prev => prev.map(p =>
      p.id === pdiId
        ? { ...pdi, id: pdiId, dataAtualizacao: new Date().toISOString() }
        : p
    ));
  };

  const deletePDI = (pdiId: string) => {
    setPdis(prev => prev.filter(p => p.id !== pdiId));
  };

  const getPDIById = (pdiId: string) => {
    return pdis.find(p => p.id === pdiId);
  };

  // Funções para Nine Box
  const saveNineBoxResult = (result: NineBoxResult) => {
    setNineBoxResults(prev => {
      const existingIndex = prev.findIndex(r => r.employeeId === result.employeeId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...result,
          date: new Date().toISOString()
        };
        return updated;
      } else {
        return [...prev, {
          ...result,
          date: new Date().toISOString()
        }];
      }
    });
  };

  const getNineBoxByEmployeeId = (employeeId: string) => {
    return nineBoxResults.find(r => r.employeeId === employeeId);
  };

  // 🔥 Funções API
  const fetchCycles = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await api.get('/evaluations/cycles');
      if (response.data.success) {
        console.log('Ciclos carregados:', response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar ciclos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async (filters?: any) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters || {}).toString();
      const response = await api.get(`/evaluations${queryParams ? '?' + queryParams : ''}`);
      if (response.data.success) {
        console.log('Avaliações carregadas:', response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/evaluations/stats');
      if (response.data.success) {
        console.log('Stats carregadas:', response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  };

  const value = {
    // Existentes
    employees,
    evaluations,
    stats,
    getEmployeeById,
    getEvaluationById,
    getEvaluationsByEmployeeId,
    getEvaluationsByStatus,
    saveEvaluation,
    calculateFinalScore,
    technicalCriteria,
    behavioralCriteria,
    deliveriesCriteria,

    // Novos para PDI
    pdis,
    savePDI,
    updatePDI,
    deletePDI,
    getPDIById,

    // Novos para Nine Box
    nineBoxResults,
    saveNineBoxResult,
    getNineBoxByEmployeeId,

    // 🔥 API Functions
    fetchCycles,
    fetchEvaluations,
    fetchStats,
    loading,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};

export type { ActionItem, ActionPlanData, NineBoxResult };