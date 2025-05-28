import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, Evaluation, Status, EvaluationStats, Criterion } from '../types';
import { employees, evaluations as initialEvaluations, technicalCriteria, behavioralCriteria, deliveriesCriteria } from '../data/mockData';

interface EvaluationContextType {
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

  const value = {
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