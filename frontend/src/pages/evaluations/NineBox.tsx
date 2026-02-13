import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BarChart3, Calendar, Briefcase, TrendingUp, Target, Info, Grid3x3, Mail, Cake, MessageSquare, ArrowUp, CheckCircle, AlertCircle, Lock, Loader2, FileText, Save } from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';
import { usePeopleCommitteePermission } from '../../hooks/usePeopleCommittee';
import { supabase } from '../../lib/supabase';
import { evaluationService } from '../../services/evaluation.service';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';

interface MatrixConfig {
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  activeBorderColor: string;
  gradient: string;
}

// Configuração da matriz com cores do sistema
const matrixConfig: Record<string, MatrixConfig> = {
  '1,1': { 
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    textColor: 'text-red-700 dark:text-red-300',
    description: 'Avaliar possibilidade de movimentação para função menor ou demissão',
    activeBorderColor: 'border-red-500 dark:border-red-400',
    gradient: 'from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/20',
  },
  '1,2': { 
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-700',
    textColor: 'text-amber-700 dark:text-amber-300',
    description: 'Avaliar possibilidade de movimentação horizontal',
    activeBorderColor: 'border-amber-500 dark:border-amber-400',
    gradient: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/20',
  },
  '1,3': { 
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    description: 'Está no lugar certo. Manter na posição e rever remuneração',
    activeBorderColor: 'border-emerald-500 dark:border-emerald-400',
    gradient: 'from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/20',
  },
  '2,1': { 
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    textColor: 'text-orange-700 dark:text-orange-300',
    description: 'Avaliar se está na área certa. Rever atribuições. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-orange-500 dark:border-orange-400',
    gradient: 'from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/20',
  },
  '2,2': { 
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700',
    textColor: 'text-green-700 dark:text-green-300',
    description: 'Verificar a causa. Local ou Chefe inadequado? Não há desenvolvimento',
    activeBorderColor: 'border-green-500 dark:border-green-400',
    gradient: 'from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/20',
  },
  '2,3': { 
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    textColor: 'text-blue-700 dark:text-blue-300',
    description: 'Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-blue-500 dark:border-blue-400',
    gradient: 'from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/20',
  },
  '3,1': { 
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-700',
    textColor: 'text-rose-700 dark:text-rose-300',
    description: 'Avaliar as coisas na área certa. Rever atribuições. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-rose-500 dark:border-rose-400',
    gradient: 'from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-900/20',
  },
  '3,2': { 
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-700',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    description: 'Investir no potencial e desenvolvimento para manter na atual função. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-indigo-500 dark:border-indigo-400',
    gradient: 'from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/20',
  },
  '3,3': { 
    bgColor: 'bg-gradient-to-br from-green-800 to-green-900 dark:from-green-800 dark:to-green-900',
    borderColor: 'border-green-800 dark:border-green-700',
    textColor: 'text-white',
    description: 'Dar mais atribuições. Preparar para função maior. Líder do futuro!',
    activeBorderColor: 'border-green-900 dark:border-green-800',
    gradient: 'from-green-800 to-green-900 dark:from-green-800 dark:to-green-900',
  }
};

const CYCLE_CACHE_KEY = 'ninebox_last_cycle_id';

const NineBoxMatrix = () => {
  const {
    currentCycle,
    dashboard,
    loadDashboard,
    employees,
    loading // Adicionar loading para feedback visual
  } = useEvaluation();

  const { profile } = useAuth();
  const { canViewPeopleCommittee, isRestrictedView, loading: permissionLoading } = usePeopleCommitteePermission();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [subordinateIds, setSubordinateIds] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);
  const [selectedQuadrantToMove, setSelectedQuadrantToMove] = useState<number | null>(null);
  const [deliberations, setDeliberations] = useState('');
  const [isSavingDeliberations, setIsSavingDeliberations] = useState(false);
  const [deliberationsLoaded, setDeliberationsLoaded] = useState(false);
  const [potentialDetails, setPotentialDetails] = useState<Record<string, { name: string; score: number }> | null>(null);
  const [isLoadingPotentialDetails, setIsLoadingPotentialDetails] = useState(false);
  const dashboardLoadedRef = useRef(false);

  // Verificar se o usuário pode definir posição (admin ou diretor)
  const canPromote = profile?.role === 'admin' || profile?.is_admin === true || profile?.is_director === true;


  // Carregar todos os subordinados (diretos e indiretos) para líderes com visualização restrita
  useEffect(() => {
    const loadAllSubordinates = async () => {
      if (!isRestrictedView || !profile?.id) {
        setSubordinateIds(new Set());
        return;
      }

      try {
        // Buscar todos os usuários para construir a hierarquia
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, reports_to')
          .eq('active', true);

        if (!allUsers) return;

        // Função recursiva para encontrar todos os subordinados
        const findAllSubordinates = (leaderId: string, visited = new Set<string>()): Set<string> => {
          const directSubordinates = allUsers.filter(u => u.reports_to === leaderId);
          const result = new Set<string>();

          for (const sub of directSubordinates) {
            if (!visited.has(sub.id)) {
              visited.add(sub.id);
              result.add(sub.id);
              // Buscar subordinados dos subordinados (para líderes que lideram outros líderes)
              const indirectSubs = findAllSubordinates(sub.id, visited);
              indirectSubs.forEach(id => result.add(id));
            }
          }

          return result;
        };

        const subs = findAllSubordinates(profile.id);
        setSubordinateIds(subs);
      } catch (error) {
        console.error('Erro ao carregar subordinados:', error);
      }
    };

    loadAllSubordinates();
  }, [isRestrictedView, profile?.id]);

  // OTIMIZAÇÃO: Carregar dashboard imediatamente usando ciclo em cache
  useEffect(() => {
    const cachedCycleId = localStorage.getItem(CYCLE_CACHE_KEY);

    // Se temos ciclo em cache e ainda não carregamos, começar a carregar imediatamente
    if (cachedCycleId && !dashboardLoadedRef.current) {
      dashboardLoadedRef.current = true;
      setIsLoadingDashboard(true);
      loadDashboard(cachedCycleId).finally(() => setIsLoadingDashboard(false));
    } else if (!cachedCycleId) {
      // Se não há cache, aguardar o ciclo carregar (mas não mostrar loading infinito)
      // O loading será controlado pelo useEffect abaixo quando currentCycle carregar
    }
  }, [loadDashboard]);

  // Quando o ciclo atual carregar, atualizar cache e recarregar se necessário
  useEffect(() => {
    if (currentCycle) {
      const cachedCycleId = localStorage.getItem(CYCLE_CACHE_KEY);

      // Salvar ciclo atual no cache
      localStorage.setItem(CYCLE_CACHE_KEY, currentCycle.id);

      // Se o ciclo mudou ou ainda não carregamos, carregar dashboard
      if (cachedCycleId !== currentCycle.id || !dashboardLoadedRef.current) {
        dashboardLoadedRef.current = true;
        setIsLoadingDashboard(true);
        loadDashboard(currentCycle.id).finally(() => setIsLoadingDashboard(false));
      } else {
        // Ciclo é o mesmo do cache e já carregamos - não está mais loading
        setIsLoadingDashboard(false);
      }
    }
  }, [currentCycle, loadDashboard]);

  // Filtrar colaboradores com avaliações de consenso completas
  // Usando useMemo + Map para lookup O(1) em vez de O(n²)
  const eligibleEmployees = useMemo(() => {
    if (!dashboard || !employees || employees.length === 0) return [];

    // Criar Map para lookup O(1) em vez de .find() O(n)
    const usersMap = new Map(employees.map(u => [u.id, u]));

    return dashboard
      .filter(d => {
        // Apenas incluir colaboradores que tenham avaliação de consenso com notas reais
        const hasConsensus = d &&
          d.employee_id &&
          d.consensus_performance_score !== null &&
          d.consensus_performance_score !== undefined &&
          d.consensus_potential_score !== null &&
          d.consensus_potential_score !== undefined;

        if (!hasConsensus) return false;

        // Se for visualização restrita (líder), filtrar apenas subordinados
        if (isRestrictedView && subordinateIds.size > 0) {
          return subordinateIds.has(d.employee_id);
        }

        return true;
      })
      .map(d => {
        const user = usersMap.get(d.employee_id) || null; // O(1) lookup

        return {
          ...d,
          user,
          // Usa notas reais do banco de dados (consensus_evaluations)
          consensus_score: d.consensus_performance_score,
          potential_score: d.consensus_potential_score,
          // Garante que outros campos necessários existam
          employee_name: d.employee_name || user?.name || 'Sem nome',
          position: d.position || user?.position || 'Sem cargo'
        };
      })
      // Filtra apenas os que têm dados completos
      .filter(d => d.user !== null)
      // Ordena alfabeticamente pelo nome
      .sort((a, b) => a.employee_name.localeCompare(b.employee_name, 'pt-BR'));
  }, [dashboard, employees, isRestrictedView, subordinateIds]);

  const selectedEvaluation = eligibleEmployees.find(e => e.employee_id === selectedEmployee);
  const selectedEmp = selectedEvaluation?.user;

  /**
   * Retorna o potencial efetivo do colaborador
   * Se foi movimentado para cima, posiciona logo acima do limite original
   * Ex: nota 3 movida para Alto -> 3.01 (logo acima do limite)
   * Ex: nota 2 movida para Médio -> 2.01 (logo acima do limite)
   */
  const getEffectivePotential = (evaluation: any): number => {
    if (!evaluation) return 0;

    const originalScore = evaluation.potential_score;

    // Se foi movimentado, posicionar logo acima do limite
    if (evaluation.promoted_potential_quadrant !== null && evaluation.promoted_potential_quadrant !== undefined) {
      // Se nota é 2 e foi movido para Médio (quadrante 2), posicionar em 2.01
      if (originalScore === 2 && evaluation.promoted_potential_quadrant === 2) {
        return 2.01;
      }
      // Se nota é 3 e foi movido para Alto (quadrante 3), posicionar em 3.01
      if (originalScore === 3 && evaluation.promoted_potential_quadrant === 3) {
        return 3.01;
      }
      // Se manteve no quadrante inferior, manter a nota original
      return originalScore;
    }

    return originalScore;
  };

  /**
   * Verifica se o colaborador pode ser promovido (nota de potencial exatamente 2.0 ou 3.0)
   */
  const canBePromoted = (evaluation: any): boolean => {
    if (!evaluation) return false;
    const potentialScore = evaluation.potential_score;
    // Só pode promover se a nota for exatamente 2 ou 3 (limites entre quadrantes)
    return potentialScore === 2 || potentialScore === 3;
  };

  /**
   * Verifica se o colaborador já foi promovido
   */
  const isAlreadyPromoted = (evaluation: any): boolean => {
    return evaluation?.promoted_potential_quadrant !== null && evaluation?.promoted_potential_quadrant !== undefined;
  };

  /**
   * Retorna os quadrantes disponíveis para movimentação (atual e superior)
   */
  const getAvailableQuadrantOptions = (evaluation: any): { quadrant: number; label: string; isCurrent: boolean }[] => {
    if (!evaluation) return [];
    const potentialScore = evaluation.potential_score;

    if (potentialScore === 2) {
      // Nota 2.0 está no limite Baixo/Médio
      // Pode manter em Baixo (1) ou mover para Médio (2)
      return [
        { quadrant: 1, label: 'Baixo (manter posição atual)', isCurrent: true },
        { quadrant: 2, label: 'Médio (mover para cima)', isCurrent: false }
      ];
    } else if (potentialScore === 3) {
      // Nota 3.0 está no limite Médio/Alto
      // Pode manter em Médio (2) ou mover para Alto (3)
      return [
        { quadrant: 2, label: 'Médio (manter posição atual)', isCurrent: true },
        { quadrant: 3, label: 'Alto (mover para cima)', isCurrent: false }
      ];
    }

    return [];
  };

  /**
   * Retorna o label do quadrante de potencial
   */
  const getPotentialQuadrantLabel = (quadrant: number): string => {
    switch (quadrant) {
      case 1: return 'Baixo';
      case 2: return 'Médio';
      case 3: return 'Alto';
      default: return 'Desconhecido';
    }
  };

  /**
   * Salva a posição do colaborador no quadrante
   */
  const handlePromote = async (quadrant: number) => {
    if (!selectedEvaluation?.consensus_id || !canPromote) return;

    setIsPromoting(true);
    try {
      await evaluationService.promoteNineBoxQuadrant(selectedEvaluation.consensus_id, quadrant);
      toast.success(`Posição definida como ${getPotentialQuadrantLabel(quadrant)} com sucesso!`);
      // Limpar seleção
      setSelectedQuadrantToMove(null);
      // Recarregar dashboard para atualizar os dados
      if (currentCycle?.id) {
        await loadDashboard(currentCycle.id);
      }
    } catch (error: any) {
      console.error('Erro ao salvar posição:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar posição');
    } finally {
      setIsPromoting(false);
    }
  };

  // Limpar seleção de quadrante e carregar deliberações ao mudar de colaborador
  useEffect(() => {
    setSelectedQuadrantToMove(null);
    setDeliberationsLoaded(false);
    setPotentialDetails(null);

    // Carregar deliberações do colaborador selecionado
    if (selectedEvaluation?.committee_deliberations !== undefined) {
      setDeliberations(selectedEvaluation.committee_deliberations || '');
      setDeliberationsLoaded(true);
    } else {
      setDeliberations('');
    }

    // Carregar detalhes de potencial da avaliação do líder
    const loadPotentialDetails = async () => {
      if (!selectedEvaluation?.leader_evaluation_id || !currentCycle?.id) return;

      setIsLoadingPotentialDetails(true);
      try {
        const { data, error } = await supabase
          .from('leader_evaluations')
          .select('potential_details')
          .eq('id', selectedEvaluation.leader_evaluation_id)
          .single();

        if (!error && data?.potential_details) {
          setPotentialDetails(data.potential_details as Record<string, { name: string; score: number }>);
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes de potencial:', error);
      } finally {
        setIsLoadingPotentialDetails(false);
      }
    };

    if (selectedEmployee) {
      loadPotentialDetails();
    }
  }, [selectedEmployee, selectedEvaluation?.committee_deliberations, selectedEvaluation?.leader_evaluation_id, currentCycle?.id]);

  /**
   * Salva as deliberações do comitê
   */
  const handleSaveDeliberations = async () => {
    if (!selectedEvaluation?.consensus_id) return;

    setIsSavingDeliberations(true);
    try {
      await evaluationService.saveCommitteeDeliberations(selectedEvaluation.consensus_id, deliberations);
      toast.success('Deliberações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar deliberações:', error);
      toast.error('Erro ao salvar deliberações');
    } finally {
      setIsSavingDeliberations(false);
    }
  };

  /**
   * Obtém o quadrante baseado nas notas (retorna índices de 1-3)
   */
  const getQuadrant = (performance: number, potential: number): { row: number; col: number } => {
    // Determina o quadrante baseado nos intervalos:
    // Performance: < 2.0 = quadrante 1, 2.0-2.99 = quadrante 2, >= 3.0 = quadrante 3
    // Potencial: <= 2.0 = quadrante 1 (inclui 2.0), 2.01-3.0 = quadrante 2, > 3.0 = quadrante 3

    let perfQuadrant: number;
    let potQuadrant: number;

    // Performance (coluna)
    if (performance < 2.0) {
      perfQuadrant = 1;
    } else if (performance < 3.0) {
      perfQuadrant = 2;
    } else {
      perfQuadrant = 3;
    }

    // Potencial (linha)
    if (potential <= 2.0) {
      potQuadrant = 1;
    } else if (potential <= 3.0) {
      potQuadrant = 2;
    } else {
      potQuadrant = 3;
    }

    return {
      row: potQuadrant,
      col: perfQuadrant
    };
  };

  /**
   * Retorna o número do quadrante (1-9) conforme a metodologia Nine Box
   * Box 1: Baixo Perf + Baixo Pot
   * Box 2: Baixo Perf + Médio Pot
   * Box 3: Baixo Perf + Alto Pot
   * Box 4: Médio Perf + Baixo Pot
   * Box 5: Médio Perf + Médio Pot
   * Box 6: Médio Perf + Alto Pot
   * Box 7: Alto Perf + Baixo Pot
   * Box 8: Alto Perf + Médio Pot
   * Box 9: Alto Perf + Alto Pot
   */
  const getQuadrantName = (performance: number, potential: number): string => {
    const quadrant = getQuadrant(performance, potential);
    // Calcula o número do box baseado na posição
    // row e col vão de 1 a 3
    // Fórmula: (col - 1) * 3 + row
    // Exemplo: col=2, row=3 => (2-1)*3 + 3 = 6 (Box 6)
    const boxNumber = (quadrant.col - 1) * 3 + quadrant.row;
    return boxNumber.toString();
  };

  /**
   * Retorna o nome descritivo do box conforme o guia Nine Box
   */
  const getBoxDescriptiveName = (boxNumber: string): string => {
    const boxNames: Record<string, string> = {
      '1': 'Insuficiente',
      '2': 'Questionável',
      '3': 'Enigma',
      '4': 'Eficaz',
      '5': 'Mantenedor',
      '6': 'Crescimento',
      '7': 'Comprometimento',
      '8': 'Alto Impacto',
      '9': 'Futuro Líder'
    };
    return boxNames[boxNumber] || '';
  };

  /**
   * Calcula a posição EXATA do ponto dentro da matriz
   *
   * A matriz 9-Box visual tem:
   * - Eixo X (Performance): Baixo (<2) | Médio (2-3) | Alto (≥3)
   * - Eixo Y (Potencial): Alto (>3) | Médio (2-3) | Baixo (≤2) - de cima para baixo
   *
   * Mapeamento das notas para posições no grid (0-100%):
   *
   * Performance (X):
   * - Nota 1 -> 0% (início do Baixo)
   * - Nota 2 -> 33.33% (linha entre Baixo e Médio)
   * - Nota 3 -> 66.66% (linha entre Médio e Alto)
   * - Nota 4 -> 100% (fim do Alto)
   *
   * Potencial (Y) - invertido pois Alto fica no topo:
   * - Nota 4 -> 0% (topo, Alto)
   * - Nota 3 -> 33.33% (linha entre Alto e Médio)
   * - Nota 2 -> 66.66% (linha entre Médio e Baixo)
   * - Nota 1 -> 100% (fundo, Baixo)
   */
  const getPointPosition = (performance: number, potential: number) => {
    // Limita as notas entre 1 e 4
    const clampedPerf = Math.max(1, Math.min(4, performance));
    const clampedPot = Math.max(1, Math.min(4, potential));

    // Cada quadrante ocupa 33.33% do grid
    const quadrantSize = 100 / 3;

    // Performance (X): mapeia nota para posição
    // Quadrante Baixo: 1-2 ocupa 0-33.33%
    // Quadrante Médio: 2-3 ocupa 33.33-66.66%
    // Quadrante Alto: 3-4 ocupa 66.66-100%
    let xPercent: number;
    if (clampedPerf < 2) {
      // Dentro do quadrante Baixo: 1-2 -> 0-33.33%
      xPercent = (clampedPerf - 1) * quadrantSize;
    } else if (clampedPerf < 3) {
      // Dentro do quadrante Médio: 2-3 -> 33.33-66.66%
      xPercent = quadrantSize + (clampedPerf - 2) * quadrantSize;
    } else {
      // Dentro do quadrante Alto: 3-4 -> 66.66-100%
      xPercent = 2 * quadrantSize + (clampedPerf - 3) * quadrantSize;
    }

    // Potencial (Y): mapeia nota para posição (invertido)
    // Quadrante Alto: 3-4 ocupa 0-33.33% (topo)
    // Quadrante Médio: 2-3 ocupa 33.33-66.66%
    // Quadrante Baixo: 1-2 ocupa 66.66-100% (fundo)
    let yPercent: number;
    if (clampedPot > 3) {
      // Dentro do quadrante Alto: 3-4 -> 33.33-0% (invertido)
      yPercent = quadrantSize - (clampedPot - 3) * quadrantSize;
    } else if (clampedPot > 2) {
      // Dentro do quadrante Médio: 2-3 -> 66.66-33.33% (invertido)
      yPercent = 2 * quadrantSize - (clampedPot - 2) * quadrantSize;
    } else {
      // Dentro do quadrante Baixo: 1-2 -> 100-66.66% (invertido)
      yPercent = 100 - (clampedPot - 1) * quadrantSize;
    }

    return { x: xPercent, y: yPercent };
  };

  /**
   * Verifica se um quadrante está ativo (contém o colaborador selecionado)
   * Usa o potencial efetivo (considera movimentação de quadrante)
   */
  const isQuadrantActive = (row: number, col: number): boolean => {
    if (!selectedEvaluation) return false;

    const quadrant = getQuadrant(
      selectedEvaluation.consensus_score,
      getEffectivePotential(selectedEvaluation)
    );
    return quadrant.row === row && quadrant.col === col;
  };

  /**
   * Retorna informações do quadrante ativo
   * Usa o potencial efetivo (considera movimentação de quadrante)
   */
  const getActiveQuadrantInfo = () => {
    if (!selectedEvaluation) return null;
    const quadrant = getQuadrant(
      selectedEvaluation.consensus_score,
      getEffectivePotential(selectedEvaluation)
    );
    const key = `${quadrant.row},${quadrant.col}`;
    return matrixConfig[key];
  };

  // Formatar data de admissão
  const formatJoinDate = (date: string | null | undefined) => {
    if (!date) return '-';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return `${age} anos`;
  };

  // Verificar permissão para líderes
  if (permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando permissões...</p>
        </motion.div>
      </div>
    );
  }

  // Bloquear acesso se líder não tiver permissão no cargo
  if (!canViewPeopleCommittee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Seu cargo não possui permissão para acessar o Comitê de Gente. Entre em contato com o RH caso precise de acesso.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8"
      >
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <Grid3x3 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-600 dark:text-gray-400 mr-2 sm:mr-3" />
            <span className="break-words">Comitê de Gente</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            Análise de Performance vs Potencial
          </p>
        </div>

        {/* Seleção de Colaborador */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600 dark:text-gray-400" />
            Selecionar Colaborador
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
              Colaborador
            </label>
            <div className="relative">
              <select
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-800 dark:focus:border-green-700 focus:ring-green-800 dark:focus:ring-green-700 text-naue-black dark:text-gray-300 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-wait"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={isLoadingDashboard || loading}
              >
                <option value="">
                  {isLoadingDashboard || loading ? 'Carregando colaboradores...' : 'Selecione um colaborador'}
                </option>
                {eligibleEmployees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.employee_name}
                  </option>
                ))}
              </select>
              {(isLoadingDashboard || loading) && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-800 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do colaborador com foto à esquerda e dados à direita */}
          {selectedEmp && (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Foto do colaborador */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-600 shadow-md">
                  {selectedEmp.profile_image ? (
                    <img
                      src={selectedEmp.profile_image}
                      alt={selectedEmp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 2x4 com informações */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Cargo
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Data de Admissão
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {formatJoinDate(selectedEmp.join_date)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600 truncate">
                    {selectedEmp.email || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Cake className="inline h-4 w-4 mr-1" />
                    Idade
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {calculateAge(selectedEmp.birth_date)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Trilha
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.track_position?.track?.name || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Nível Salarial
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.salary_level?.name || selectedEmp.intern_level || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Grid3x3 className="inline h-4 w-4 mr-1" />
                    Classe Salarial
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.track_position?.class?.name || selectedEmp.track_position?.class?.code || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Salário
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.current_salary
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedEmp.current_salary)
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações do colaborador */}
          {selectedEmp && selectedEmp.observations && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <label className="block text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                <MessageSquare className="inline h-4 w-4 mr-2" />
                Observações / Anotações
              </label>
              <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                {selectedEmp.observations}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Visualização da Matriz */}
      {selectedEvaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Coluna Esquerda - Cards de Informação */}
          <div className="space-y-4">
            {/* Card de Avaliação */}
            <div className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600 dark:text-gray-400" />
                Avaliação de {selectedEmp.name}
              </h3>
              
              <div className="space-y-4">
                {/* Card de Performance */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg sm:rounded-xl p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Performance</p>
                    <TrendingUp className="h-4 w-4 text-green-800 dark:text-green-700" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-700">
                    {selectedEvaluation.consensus_score}
                  </p>
                  <div className="mt-2 bg-green-200 dark:bg-green-900/50 rounded-full h-2">
                    <div
                      className="bg-green-800 dark:bg-green-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedEvaluation.consensus_score / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card de Potencial */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/20 rounded-lg sm:rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Potencial</p>
                    <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {selectedEvaluation.potential_score}
                  </p>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-900/50 rounded-full h-2">
                    <div
                      className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedEvaluation.potential_score / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card de Quadrante */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg sm:rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium">Quadrante</p>
                    <Grid3x3 className="h-4 w-4 text-blue-800 dark:text-blue-700" />
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-700">
                      Box {getQuadrantName(selectedEvaluation.consensus_score, getEffectivePotential(selectedEvaluation))}
                    </p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {getBoxDescriptiveName(getQuadrantName(selectedEvaluation.consensus_score, getEffectivePotential(selectedEvaluation)))}
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Performance: {selectedEvaluation.consensus_score < 2 ? 'Baixo' : selectedEvaluation.consensus_score < 3 ? 'Médio' : 'Alto'} | Potencial: {getEffectivePotential(selectedEvaluation) <= 2 ? 'Baixo' : getEffectivePotential(selectedEvaluation) <= 3 ? 'Médio' : 'Alto'}
                  </p>
                  {isAlreadyPromoted(selectedEvaluation) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                      <ArrowUp className="h-3 w-3" />
                      <span>
                        Movimentado do Box {getQuadrantName(selectedEvaluation.consensus_score, selectedEvaluation.potential_score)} para Box {getQuadrantName(selectedEvaluation.consensus_score, getEffectivePotential(selectedEvaluation))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card de Movimentação de Quadrante - Aparece quando nota de potencial é 2.0 ou 3.0 */}
                {canBePromoted(selectedEvaluation) && (
                  <div className={`rounded-lg sm:rounded-xl p-4 border-2 ${
                    isAlreadyPromoted(selectedEvaluation)
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 border-purple-300 dark:border-purple-700'
                  }`}>
                    {isAlreadyPromoted(selectedEvaluation) ? (
                      // Colaborador já foi movimentado
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            Posição Definida
                          </p>
                          <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 ml-auto" />
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Quadrante de potencial definido como: <span className="font-bold">{getPotentialQuadrantLabel(selectedEvaluation.promoted_potential_quadrant!)}</span>
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 opacity-75">
                          Esta decisão não pode mais ser alterada.
                        </p>
                      </div>
                    ) : (
                      // Opção de movimentar
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                            Movimentação de Posição
                          </p>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-400 mb-4">
                          A nota de potencial <span className="font-bold">({selectedEvaluation.potential_score})</span> está exatamente no limite entre dois quadrantes.
                          {canPromote
                            ? ' Selecione em qual quadrante de potencial este colaborador deve ser posicionado.'
                            : ''
                          }
                        </p>
                        {canPromote ? (
                          <div className="space-y-3">
                            {/* Select de posição */}
                            <div>
                              <label className="block text-xs font-medium text-purple-800 dark:text-purple-300 mb-1.5">
                                Selecione a posição de potencial:
                              </label>
                              <select
                                value={selectedQuadrantToMove ?? ''}
                                onChange={(e) => setSelectedQuadrantToMove(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              >
                                <option value="">-- Selecione uma opção --</option>
                                {getAvailableQuadrantOptions(selectedEvaluation).map((option) => (
                                  <option key={option.quadrant} value={option.quadrant}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Botão Salvar */}
                            <Button
                              onClick={() => selectedQuadrantToMove && handlePromote(selectedQuadrantToMove)}
                              disabled={isPromoting || !selectedQuadrantToMove}
                              variant="primary"
                              size="sm"
                              className="w-full"
                            >
                              {isPromoting ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Salvando...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Salvar Posição
                                </span>
                              )}
                            </Button>

                            <p className="text-[10px] text-purple-600 dark:text-purple-500 text-center">
                              Atenção: após salvar, esta decisão não poderá ser alterada.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-purple-600 dark:text-purple-500 italic">
                            Apenas administradores ou diretores podem definir a posição.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Coluna Central e Direita - Matriz */}
          <div className="lg:col-span-2">
            <div className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600 dark:text-gray-400" />
                Posicionamento na Matriz
              </h2>

              {/* Grid da Matriz 9-Box */}
              <div className="flex justify-center">
                <div className="relative">
                  
                  {/* Título do eixo Y (Potencial) */}
                  <div className="absolute -left-12 sm:-left-40 top-1/2 transform -translate-y-1/2 -rotate-90">
                    <span className="text-sm sm:text-base font-bold text-naue-black dark:text-gray-300 font-medium uppercase tracking-widest">
                      POTENCIAL
                    </span>
                  </div>
                  
                  {/* Labels do eixo Y */}
                  <div className="absolute -left-10 sm:-left-12 flex flex-col justify-between h-72 sm:h-[420px]">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Alto</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Médio</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Baixo</span>
                  </div>

                  {/* Container da Matriz */}
                  <div className="relative w-72 h-72 sm:w-[420px] sm:h-[420px]">
                    {/* Grid 3x3 */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[3, 2, 1].map((row) => (
                        [1, 2, 3].map((col) => {
                          const key = `${row},${col}`;
                          const config = matrixConfig[key];
                          const isActive = isQuadrantActive(row, col);
                          const isHovered = hoveredQuadrant === key;
                          
                          return (
                            <motion.div
                              key={key}
                              whileHover={{ scale: 1.02 }}
                              onMouseEnter={() => setHoveredQuadrant(key)}
                              onMouseLeave={() => setHoveredQuadrant(null)}
                              className={`
                                relative flex flex-col items-center justify-center p-3 sm:p-5
                                ${config.bgColor} ${config.textColor}
                                border-2 ${isActive ? `${config.activeBorderColor} shadow-xl dark:shadow-2xl z-10` : config.borderColor}
                                transition-all duration-300 cursor-pointer
                                ${isHovered && !isActive ? 'shadow-lg dark:shadow-xl z-5' : ''}
                              `}
                            >
                              <div className="text-center">
                                <div className="text-[10px] sm:text-xs opacity-80 dark:opacity-90 leading-tight">
                                  {config.description}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ))}
                    </div>

                    {/* Ponto do Colaborador - usa potencial efetivo (considera movimentação) */}
                    {selectedEvaluation && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-primary-500 dark:bg-primary-600 rounded-full shadow-lg dark:shadow-xl z-20 ring-4 ring-white dark:ring-gray-800"
                        style={{
                          left: `${getPointPosition(selectedEvaluation.consensus_score, getEffectivePotential(selectedEvaluation)).x}%`,
                          top: `${getPointPosition(selectedEvaluation.consensus_score, getEffectivePotential(selectedEvaluation)).y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )}
                  </div>

                  {/* Labels do eixo X */}
                  <div className="flex justify-between w-72 sm:w-[420px] mt-4 sm:mt-6">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Baixo</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Médio</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Alto</span>
                  </div>

                  {/* Título do eixo X */}
                  <div className="flex justify-center w-72 sm:w-[420px] mt-3">
                    <span className="text-sm sm:text-base font-bold text-naue-black dark:text-gray-300 font-medium uppercase tracking-widest">
                      performance
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* Notas de Potencial - Só exibe se potentialDetails tiver dados */}
      {selectedEvaluation && potentialDetails && Object.keys(potentialDetails).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-6 sm:p-8"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center mb-6">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600 dark:text-gray-400" />
            Avaliação de Potencial
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nota do Líder */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Nota do Líder
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedEvaluation.leader_potential_score !== null && selectedEvaluation.leader_potential_score !== undefined
                      ? selectedEvaluation.leader_potential_score.toFixed(2)
                      : '-'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Média das 4 competências de potencial
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  !selectedEvaluation.leader_potential_score ? 'bg-gray-200 dark:bg-gray-600' :
                  selectedEvaluation.leader_potential_score >= 3 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                  selectedEvaluation.leader_potential_score >= 2 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                }`}>
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Nota do Consenso */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Nota Final (Consenso)
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedEvaluation.consensus_potential_score !== null && selectedEvaluation.consensus_potential_score !== undefined
                      ? selectedEvaluation.consensus_potential_score.toFixed(2)
                      : selectedEvaluation.potential_score !== null && selectedEvaluation.potential_score !== undefined
                      ? selectedEvaluation.potential_score.toFixed(2)
                      : '-'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Nota validada no consenso
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  !selectedEvaluation.consensus_potential_score && !selectedEvaluation.potential_score ? 'bg-gray-200 dark:bg-gray-600' :
                  (selectedEvaluation.consensus_potential_score || selectedEvaluation.potential_score || 0) >= 3 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                  (selectedEvaluation.consensus_potential_score || selectedEvaluation.potential_score || 0) >= 2 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                }`}>
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Notas por Competência */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Notas por Competência de Potencial
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(potentialDetails).map(([id, detail]) => (
                <div
                  key={id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate" title={detail.name}>
                    {detail.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`text-xl font-bold ${
                      detail.score >= 3 ? 'text-green-600 dark:text-green-400' :
                      detail.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {detail.score.toFixed(1)}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          detail.score >= 3 ? 'bg-green-500 dark:bg-green-400' :
                          detail.score >= 2 ? 'bg-yellow-500 dark:bg-yellow-400' :
                          'bg-red-500 dark:bg-red-400'
                        }`}
                        style={{ width: `${(detail.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      )}

      {/* Deliberações do Comitê */}
      {selectedEvaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600 dark:text-gray-400" />
              Deliberações do Comitê
            </h3>
            <Button
              onClick={handleSaveDeliberations}
              disabled={isSavingDeliberations}
              variant="primary"
              size="sm"
            >
              {isSavingDeliberations ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar
                </span>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Registre as decisões e anotações do Comitê de Gente sobre {selectedEmp?.name}.
          </p>
          <textarea
            value={deliberations}
            onChange={(e) => setDeliberations(e.target.value)}
            placeholder="Digite as deliberações, decisões e observações do comitê sobre este colaborador..."
            className="w-full h-40 px-4 py-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </motion.div>
      )}

      {/* Empty State - Nenhum colaborador selecionado */}
      {!selectedEmployee && eligibleEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-50 to-gray-50 dark:from-green-900/30 dark:to-gray-900/30 mb-4 sm:mb-6">
              <Grid3x3 className="h-8 w-8 sm:h-10 sm:w-10 text-green-800 dark:text-green-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Selecione um colaborador acima para visualizar sua posição na Matriz 9-Box
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty State - Nenhum colaborador com avaliação de consenso */}
      {eligibleEmployees.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 mb-4 sm:mb-6">
              <Info className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma avaliação de consenso encontrada
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
              Para visualizar o Comitê de Gente, é necessário que haja avaliações de consenso completas com notas de performance e potencial.
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              Complete as avaliações de consenso na página de <strong>Consenso</strong> para que os colaboradores apareçam aqui.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NineBoxMatrix;