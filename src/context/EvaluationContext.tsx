import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, Evaluation, Status, EvaluationStats, Criterion } from '../types';
import { employees, evaluations as initialEvaluations, technicalCriteria, behavioralCriteria, deliveriesCriteria } from '../data/mockData';

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
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
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

  // Calculate final score based on weights
  const calculateFinalScore = (technical: number, behavioral: number, deliveries: number): number => {
    // Weights: Technical 40%, Behavioral 30%, Deliveries 30%
    const weightedScore = (technical * 0.4) + (behavioral * 0.3) + (deliveries * 0.3);
    return parseFloat(weightedScore.toFixed(2));
  };
  
  // Funções para PDI
  const savePDI = (pdi: ActionPlanData) => {
    setPdis(prev => {
      const existingIndex = prev.findIndex(p => p.id === pdi.id);
      if (existingIndex >= 0) {
        // Atualizar PDI existente
        const updated = [...prev];
        updated[existingIndex] = {
          ...pdi,
          dataAtualizacao: new Date().toISOString()
        };
        return updated;
      } else {
        // Adicionar novo PDI
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
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

// Custom hook to use the evaluation context
export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};

// Exportar tipos para uso em outros componentes
export type { ActionItem, ActionPlanData, NineBoxResult };