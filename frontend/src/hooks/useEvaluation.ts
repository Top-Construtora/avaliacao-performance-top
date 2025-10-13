import { useState, useEffect, useCallback } from 'react';
import { evaluationService } from '../services/evaluation.service';
import { usersService } from '../services/supabase.service';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  SelfEvaluation,
  LeaderEvaluation
} from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Define ActionItem and PdiData interfaces here or import them
interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
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


interface UseEvaluationReturn {
  // States
  loading: boolean;
  cyclesLoading: boolean;
  currentCycle: EvaluationCycle | null;
  cycles: EvaluationCycle[];
  dashboard: CycleDashboard[];
  employees: UserWithDetails[];
  subordinates: UserWithDetails[];
  nineBoxData: NineBoxData[];
  
  // Actions
  loadCurrentCycle: () => Promise<void>;
  loadAllCycles: () => Promise<void>;
  loadDashboard: (cycleId: string) => Promise<void>;
  loadNineBoxData: (cycleId: string) => Promise<void>;
  loadSubordinates: () => Promise<void>;
  
  // Cycle management
  createCycle: (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  openCycle: (cycleId: string) => Promise<void>;
  closeCycle: (cycleId: string) => Promise<void>;
  
  // Evaluations
  saveSelfEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    toolkit?: {
      knowledge?: string[];
      tools?: string[];
      strengths_internal?: string[];
      qualities?: string[];
    };
  }) => Promise<void>;
  
  saveLeaderEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    feedback?: {
      strengths_internal?: string;
      improvements?: string;
      observations?: string;
    };
    pdi?: {
      goals: string[];
      actions: string[];
      resources?: string[];
      timeline?: string;
    };
  }) => Promise<void>;
  
  createConsensus: (data: Partial<ConsensusMeeting>) => Promise<void>;
  completeConsensus: (meetingId: string, performanceScore: number, potentialScore: number, notes: string) => Promise<void>;
  
  // Queries
  getEmployeeEvaluations: (cycleId: string, employeeId: string) => Promise<EvaluationExtended[]>;
  getSelfEvaluations: (employeeId: string, cycleId?: string) => Promise<SelfEvaluation[]>;
  getLeaderEvaluations: (employeeId: string, cycleId?: string) => Promise<LeaderEvaluation[]>;
  checkExistingEvaluation: (cycleId: string, employeeId: string, type: 'self' | 'leader') => Promise<boolean>;
  getNineBoxByEmployeeId: (employeeId: string) => NineBoxData | undefined;
  savePDI: (pdiData: any) => Promise<any>;
  loadPDI: (employeeId: string) => Promise<PdiData | null>; // Added loadPDI
}

export const useEvaluation = (): UseEvaluationReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<EvaluationCycle | null>(null);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [dashboard, setDashboard] = useState<CycleDashboard[]>([]);
  const [employees, setEmployees] = useState<UserWithDetails[]>([]);
  const [subordinates, setSubordinates] = useState<UserWithDetails[]>([]);
  const [nineBoxData, setNineBoxData] = useState<NineBoxData[]>([]);

  // Load current active cycle
  const loadCurrentCycle = useCallback(async () => {
    try {
      setLoading(true);
      const cycle = await evaluationService.getCurrentCycle();
      setCurrentCycle(cycle);
      
      // Se não houver ciclo ativo, tenta carregar todos e verificar se algum está aberto
      if (!cycle) {
        const allCycles = await evaluationService.getAllCycles();
        const activeCycle = allCycles.find(c => c.status === 'open');
        if (activeCycle) {
          setCurrentCycle(activeCycle);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ciclo atual:', error);
      toast.error('Erro ao carregar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all cycles
  const loadAllCycles = useCallback(async () => {
    console.log('loadAllCycles iniciado');
    try {
      setCyclesLoading(true);
      console.log('Chamando evaluationService.getAllCycles()');
      const data = await evaluationService.getAllCycles();
      console.log('Dados recebidos:', data);
      setCycles(data || []);
    } catch (error) {
      console.error('Erro ao carregar ciclos:', error);
      setCycles([]);
      toast.error('Erro ao carregar ciclos de avaliação');
    } finally {
      console.log('Finalizando loadAllCycles, definindo loading como false');
      setCyclesLoading(false);
    }
  }, []);

  // Load dashboard data
  const loadDashboard = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getCycleDashboard(cycleId);
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load NineBox data
  const loadNineBoxData = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getNineBoxData(cycleId);
      setNineBoxData(data);
    } catch (error) {
      console.error('Erro ao carregar dados NineBox:', error);
      toast.error('Erro ao carregar matriz 9-Box');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load subordinates
  const loadSubordinates = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const allUsers = await usersService.getAll();
      const subs = allUsers.filter(u => u.reports_to === user.id);
      setSubordinates(subs);
    } catch (error) {
      console.error('Erro ao carregar subordinados:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new cycle
  const createCycle = useCallback(async (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const newCycle = await evaluationService.createCycle({
        ...cycle,
        created_by: user?.id || ''
      });
      toast.success('Ciclo de avaliação criado com sucesso!');
      await loadAllCycles();
    } catch (error: any) {
      console.error('Erro ao criar ciclo:', error);
      toast.error(error.message || 'Erro ao criar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [user, loadAllCycles]);

  // Open cycle
  const openCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.openCycle(cycleId);
      toast.success('Ciclo de avaliação aberto!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao abrir ciclo:', error);
      toast.error('Erro ao abrir ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  // Close cycle
  const closeCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.closeCycle(cycleId);
      toast.success('Ciclo de avaliação encerrado!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao fechar ciclo:', error);
      toast.error('Erro ao fechar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  // Save self evaluation
  const saveSelfEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    toolkit?: {
      knowledge?: string[];
      tools?: string[];
      strengths_internal?: string[];
      qualities?: string[];
    };
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveSelfEvaluation(
        data.cycleId,
        data.employeeId,
        data.competencies,
        data.toolkit
      );
      toast.success('Autoavaliação salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar autoavaliação:', error);
      toast.error(error.message || 'Erro ao salvar autoavaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save leader evaluation
  const saveLeaderEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    feedback?: {
      strengths_internal?: string;
      improvements?: string;
      observations?: string;
    };
    pdi?: {
      goals: string[];
      actions: string[];
      resources?: string[];
      timeline?: string;
    };
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveLeaderEvaluation(
        data.cycleId,
        data.employeeId,
        data.evaluatorId,
        data.competencies,
        data.potentialScore,
        data.feedback,
        data.pdi
      );
      toast.success('Avaliação do líder salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação do líder');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create consensus meeting
  const createConsensus = useCallback(async (data: Partial<ConsensusMeeting>) => {
    try {
      setLoading(true);
      await evaluationService.createConsensusMeeting(data);
      toast.success('Reunião de consenso criada!');
    } catch (error: any) {
      console.error('Erro ao criar consenso:', error);
      toast.error(error.message || 'Erro ao criar reunião de consenso');
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete consensus
  const completeConsensus = useCallback(async (
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ) => {
    try {
      setLoading(true);
      await evaluationService.completeConsensusMeeting(
        meetingId,
        performanceScore,
        potentialScore,
        notes
      );
      toast.success('Consenso finalizado com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar consenso:', error);
      toast.error('Erro ao finalizar consenso');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employee evaluations (unified)
  const getEmployeeEvaluations = useCallback(async (cycleId: string, employeeId: string): Promise<EvaluationExtended[]> => {
    try {
      return await evaluationService.getEmployeeEvaluations(cycleId, employeeId);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }, []);

  // Get self evaluations
  const getSelfEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<SelfEvaluation[]> => {
    try {
      return await evaluationService.getSelfEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar autoavaliações:', error);
      return [];
    }
  }, []);

  // Get leader evaluations
  const getLeaderEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<LeaderEvaluation[]> => {
    try {
      return await evaluationService.getLeaderEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar avaliações de líder:', error);
      return [];
    }
  }, []);

  // Check existing evaluation
  const checkExistingEvaluation = useCallback(async (
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ): Promise<boolean> => {
    try {
      return await evaluationService.checkExistingEvaluation(cycleId, employeeId, type);
    } catch (error) {
      console.error('Erro ao verificar avaliação existente:', error);
      return false;
    }
  }, []);

  // Add getNineBoxByEmployeeId
  const getNineBoxByEmployeeId = (employeeId: string) => {
    return nineBoxData.find((item) => item.employee_id === employeeId);
  };

  // Add savePDI
  const savePDI = async (pdiData: any) => {
    try {
      setLoading(true);
      const result = await evaluationService.savePDI(pdiData);
      toast.success('PDI salvo com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao salvar PDI:', error);
      toast.error(error.message || 'Erro ao salvar PDI');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add loadPDI
  const loadPDI = useCallback(async (employeeId: string): Promise<PdiData | null> => {
    try {
      setLoading(true);
      const pdiDataFromApi = await evaluationService.getPDI(employeeId);
      
      console.log('PDI recebido da API:', pdiDataFromApi);

      if (pdiDataFromApi) {
        const curtosPrazos: ActionItem[] = [];
        const mediosPrazos: ActionItem[] = [];
        const longosPrazos: ActionItem[] = [];

        // Primeiro verificar se temos o campo items (novo formato)
        if (pdiDataFromApi.items && Array.isArray(pdiDataFromApi.items)) {
          console.log('Processando items do PDI:', pdiDataFromApi.items);
          
          pdiDataFromApi.items.forEach((item: any) => {
            const actionItem: ActionItem = {
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              competencia: item.competencia || '',
              calendarizacao: item.calendarizacao || '',
              comoDesenvolver: item.comoDesenvolver || '',
              resultadosEsperados: item.resultadosEsperados || '',
              status: item.status || '1',
              observacao: item.observacao || ''
            };

            // Distribuir nos prazos corretos
            switch (item.prazo) {
              case 'curto':
                curtosPrazos.push(actionItem);
                break;
              case 'medio':
                mediosPrazos.push(actionItem);
                break;
              case 'longo':
                longosPrazos.push(actionItem);
                break;
              default:
                console.warn(`Prazo desconhecido: ${item.prazo}`);
                curtosPrazos.push(actionItem); // Default para curto prazo
            }
          });
        }
        // Se não tem items, tentar processar goals e actions (formato antigo)
        else if (pdiDataFromApi.goals && Array.isArray(pdiDataFromApi.goals)) {
          console.log('Processando formato antigo - goals:', pdiDataFromApi.goals);
          console.log('Processando formato antigo - actions:', pdiDataFromApi.actions);
          
          pdiDataFromApi.goals.forEach((goal: string, index: number) => {
            const action = pdiDataFromApi.actions?.[index] || '';
            
            console.log(`Processando item ${index}:`, { goal, action });
            
            // Extrair competência e resultados esperados do goal
            const competenciaMatch = goal.match(/Competência: (.+?)\. Resultados Esperados: (.+)/);
            const competencia = competenciaMatch?.[1] || goal.split('.')[0] || 'N/A';
            const resultadosEsperados = competenciaMatch?.[2] || goal.split('.')[1] || 'N/A';
            
            // Extrair como desenvolver, prazo, status e observação do action
            // Tentar diferentes formatos de regex
            let actionMatch = action.match(/Como desenvolver: (.+?) \(Prazo: (.+?), Status: (.+?), Observação: (.+?)\)\./);
            if (!actionMatch) {
              // Tentar sem o ponto final
              actionMatch = action.match(/Como desenvolver: (.+?) \(Prazo: (.+?), Status: (.+?), Observação: (.+?)\)/);
            }
            
            const comoDesenvolver = actionMatch?.[1] || action.replace(/Como desenvolver: /, '').split('(')[0].trim() || 'N/A';
            const calendarizacao = actionMatch?.[2] || 'N/A';
            const status = (actionMatch?.[3] || '1') as '1' | '2' | '3' | '4' | '5';
            const observacao = actionMatch?.[4] || 'N/A';
            
            const actionItem: ActionItem = {
              id: `item-${index}-${Date.now()}`,
              competencia,
              calendarizacao,
              comoDesenvolver,
              resultadosEsperados,
              status,
              observacao,
            };

            // Distribuir nos prazos baseado no índice ou em alguma lógica
            // Por padrão, vamos colocar todos em curto prazo
            // Você pode ajustar essa lógica conforme necessário
            if (index < pdiDataFromApi.goals.length / 3) {
              curtosPrazos.push(actionItem);
            } else if (index < (pdiDataFromApi.goals.length * 2) / 3) {
              mediosPrazos.push(actionItem);
            } else {
              longosPrazos.push(actionItem);
            }
          });
        }

        return {
          id: pdiDataFromApi.id,
          colaboradorId: pdiDataFromApi.employee_id,
          colaborador: '', // Será preenchido no componente
          cargo: '', // Será preenchido no componente
          departamento: '', // Será preenchido no componente
          periodo: pdiDataFromApi.timeline || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos,
          mediosPrazos,
          longosPrazos,
          dataCriacao: pdiDataFromApi.created_at,
          dataAtualizacao: pdiDataFromApi.updated_at,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Erro ao carregar PDI:', error);
      toast.error(error.message || 'Erro ao carregar PDI');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadCurrentCycle();

    const loadEmployees = async () => {
      try {
        const data = await usersService.getAll();
        setEmployees(data);
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
      }
    };

    loadEmployees();
  }, [loadCurrentCycle]);

  return {
    loading,
    cyclesLoading,
    currentCycle,
    cycles,
    dashboard,
    employees,
    subordinates,
    nineBoxData,
    loadCurrentCycle,
    loadAllCycles,
    loadDashboard,
    loadNineBoxData,
    loadSubordinates,
    createCycle,
    openCycle,
    closeCycle,
    saveSelfEvaluation,
    saveLeaderEvaluation,
    createConsensus,
    completeConsensus,
    getEmployeeEvaluations,
    getSelfEvaluations,
    getLeaderEvaluations,
    checkExistingEvaluation,
    getNineBoxByEmployeeId,
    savePDI,
    loadPDI, // Added
  };
};
