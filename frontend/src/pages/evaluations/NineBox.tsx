import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, BarChart3, Calendar, Briefcase, TrendingUp, Target, Info, Grid3x3, Mail, Cake } from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useSupabaseUsers } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

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

const NineBoxMatrix = () => {
  const {
    currentCycle,
    dashboard,
    loadDashboard
  } = useEvaluation();
  const { users } = useSupabaseUsers();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
  const [salaryLevels, setSalaryLevels] = useState<Array<{ id: string; name: string; percentage: number }>>([]);

  // Carregar níveis salariais
  useEffect(() => {
    const loadSalaryLevels = async () => {
      try {
        const { data } = await supabase
          .from('salary_levels')
          .select('id, name, percentage')
          .order('order_index');

        if (data) setSalaryLevels(data);
      } catch (error) {
        console.error('Erro ao carregar níveis salariais:', error);
      }
    };

    loadSalaryLevels();
  }, []);

  // Carregar dados do dashboard quando o ciclo atual mudar
  useEffect(() => {
    if (currentCycle) {
      loadDashboard(currentCycle.id);
    }
  }, [currentCycle, loadDashboard]);

  // Filtrar colaboradores com avaliações de consenso completas
  useEffect(() => {
    if (dashboard && users) {
      const eligible = dashboard
        .filter(d => {
          // Apenas incluir colaboradores que tenham avaliação de consenso com notas reais
          const hasValidScores = d &&
                 d.employee_id &&
                 d.consensus_performance_score !== null &&
                 d.consensus_performance_score !== undefined &&
                 d.consensus_potential_score !== null &&
                 d.consensus_potential_score !== undefined;

          return hasValidScores;
        })
        .map(d => {
          const user = users.find(u => u && u.id === d.employee_id);

          return {
            ...d,
            user: user || null,
            // Usa notas reais do banco de dados (consensus_evaluations)
            // Os dados já vêm com os nomes corretos do backend
            consensus_score: d.consensus_performance_score,
            potential_score: d.consensus_potential_score,
            // Garante que outros campos necessários existam
            employee_name: d.employee_name || user?.name || 'Sem nome',
            position: d.position || user?.position || 'Sem cargo'
          };
        })
        // Filtra apenas os que têm dados completos
        .filter(d => d.user !== null);

      setEligibleEmployees(eligible);
    }
  }, [dashboard, users]);

  const selectedEvaluation = eligibleEmployees.find(e => e.employee_id === selectedEmployee);
  const selectedEmp = selectedEvaluation?.user;

  /**
   * Calcula o salário baseado no cargo e nível salarial (intern_level)
   */
  const calculateSalary = (trackPosition: any, internLevel: string): number | null => {
    if (!trackPosition?.base_salary || !internLevel) return null;

    const salaryLevel = salaryLevels.find(l => l.name === internLevel);
    if (!salaryLevel) return null;

    const baseSalary = trackPosition.base_salary;
    const percentage = salaryLevel.percentage / 100;
    return baseSalary + (baseSalary * percentage);
  };

  /**
   * Obtém o quadrante baseado nas notas (retorna índices de 1-3)
   */
  const getQuadrant = (performance: number, potential: number): { row: number; col: number } => {
    // Determina o quadrante baseado nos intervalos:
    // 1.0-1.999 = quadrante 1
    // 2.0-2.999 = quadrante 2
    // 3.0-4.0 = quadrante 3

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
    if (potential < 2.0) {
      potQuadrant = 1;
    } else if (potential < 3.0) {
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
   * Calcula a posição do ponto dentro da matriz
   * Garante que o ponto fique sempre dentro dos limites do quadrante correto
   */
  const getPointPosition = (performance: number, potential: number) => {
    // Limita as notas entre 1 e 4
    const clampedPerf = Math.max(1, Math.min(4, performance));
    const clampedPot = Math.max(1, Math.min(4, potential));

    // Determina o quadrante
    const quadrant = getQuadrant(clampedPerf, clampedPot);

    // Padding interno para o ponto não ultrapassar as bordas (15% de cada lado do quadrante)
    const PADDING = 0.15;

    // Calcula a posição relativa dentro do quadrante (0 a 1)
    let perfRelative: number;
    let potRelative: number;

    // Performance (eixo X / coluna)
    if (quadrant.col === 1) {
      // Quadrante 1: notas 1.0-1.999
      perfRelative = (clampedPerf - 1.0) / 1.0; // 0 a 1
    } else if (quadrant.col === 2) {
      // Quadrante 2: notas 2.0-2.999
      perfRelative = (clampedPerf - 2.0) / 1.0; // 0 a 1
    } else {
      // Quadrante 3: notas 3.0-4.0
      perfRelative = (clampedPerf - 3.0) / 1.0; // 0 a 1
    }

    // Potencial (eixo Y / linha)
    if (quadrant.row === 1) {
      // Quadrante 1: notas 1.0-1.999
      potRelative = (clampedPot - 1.0) / 1.0; // 0 a 1
    } else if (quadrant.row === 2) {
      // Quadrante 2: notas 2.0-2.999
      potRelative = (clampedPot - 2.0) / 1.0; // 0 a 1
    } else {
      // Quadrante 3: notas 3.0-4.0
      potRelative = (clampedPot - 3.0) / 1.0; // 0 a 1
    }

    // Aplica padding para manter o ponto dentro do quadrante
    perfRelative = perfRelative * (1 - 2 * PADDING) + PADDING;
    potRelative = potRelative * (1 - 2 * PADDING) + PADDING;

    // Cada quadrante ocupa 33.33% da matriz
    const quadrantSize = 100 / 3;

    // Calcula a posição final em porcentagem (0-100%)
    const xPercent = (quadrant.col - 1) * quadrantSize + (perfRelative * quadrantSize);
    // Inverte o Y porque o grid visual cresce de baixo para cima (linha 3 = topo)
    const yPercent = (3 - quadrant.row) * quadrantSize + ((1 - potRelative) * quadrantSize);

    return { x: xPercent, y: yPercent };
  };

  /**
   * Verifica se um quadrante está ativo (contém o colaborador selecionado)
   */
  const isQuadrantActive = (row: number, col: number): boolean => {
    if (!selectedEvaluation) return false;
    
    const quadrant = getQuadrant(
      selectedEvaluation.consensus_score, 
      selectedEvaluation.potential_score
    );
    return quadrant.row === row && quadrant.col === col;
  };

  const getActiveQuadrantInfo = () => {
    if (!selectedEvaluation) return null;
    const quadrant = getQuadrant(
      selectedEvaluation.consensus_score, 
      selectedEvaluation.potential_score
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
            <select
              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-800 dark:focus:border-green-700 focus:ring-green-800 dark:focus:ring-green-700 text-naue-black dark:text-gray-300 font-medium text-sm sm:text-base"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Selecione um colaborador</option>
              {eligibleEmployees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.employee_name}
                </option>
              ))}
            </select>
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
                    {selectedEmp.track?.name || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Nível Salarial
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.intern_level || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <Grid3x3 className="inline h-4 w-4 mr-1" />
                    Classe Salarial
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {selectedEmp.track_position?.class?.name || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Salário
                  </label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-naue-black dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600">
                    {(() => {
                      // Calcular salário baseado no intern_level e cargo
                      const calculatedSalary = calculateSalary(selectedEmp.track_position, selectedEmp.intern_level);

                      if (calculatedSalary) {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedSalary);
                      }

                      // Fallback para current_salary se o cálculo falhar
                      if (selectedEmp.current_salary) {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedEmp.current_salary);
                      }

                      return '-';
                    })()}
                  </div>
                </div>
              </div>
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
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-700">
                      Box {getQuadrantName(selectedEvaluation.consensus_score, selectedEvaluation.potential_score)}
                    </p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {getBoxDescriptiveName(getQuadrantName(selectedEvaluation.consensus_score, selectedEvaluation.potential_score))}
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Performance: {selectedEvaluation.consensus_score < 2 ? 'Baixo' : selectedEvaluation.consensus_score < 3 ? 'Médio' : 'Alto'} | Potencial: {selectedEvaluation.potential_score < 2 ? 'Baixo' : selectedEvaluation.potential_score < 3 ? 'Médio' : 'Alto'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card de Status Atual */}
            {getActiveQuadrantInfo() && (
              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 ${getActiveQuadrantInfo()!.borderColor} bg-gradient-to-br ${getActiveQuadrantInfo()!.gradient}`}>
                <h4 className={`text-base sm:text-lg font-bold mb-3 ${getActiveQuadrantInfo()!.textColor}`}>
                  Status Atual
                </h4>
                <p className={`text-sm ${getActiveQuadrantInfo()!.textColor} opacity-90`}>
                  {getActiveQuadrantInfo()!.description}
                </p>
              </div>
            )}
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

                    {/* Ponto do Colaborador */}
                    {selectedEvaluation && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-800 to-green-900 dark:from-green-800 dark:to-green-900 rounded-full shadow-lg dark:shadow-xl z-20 ring-4 ring-white dark:ring-gray-800"
                        style={{
                          left: `${getPointPosition(selectedEvaluation.consensus_score, selectedEvaluation.potential_score).x}%`,
                          top: `${getPointPosition(selectedEvaluation.consensus_score, selectedEvaluation.potential_score).y}%`,
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

              {/* Info Box */}
              <div className="mt-6 sm:mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-700 flex items-start">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">Como interpretar a matriz:</p>
                  <p className="opacity-90">
                    A posição do colaborador é determinada pela combinação de sua performance (eixo horizontal) 
                    e potencial (eixo vertical). Cada quadrante indica uma estratégia de desenvolvimento específica.
                  </p>
                </div>
              </div>
            </div>
          </div>
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