import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, BarChart3, Download, Calendar, Briefcase, TrendingUp, Target, Award, Info, Grid3x3 } from 'lucide-react';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';

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
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    description: 'Avaliar possibilidade de movimentação para função menor ou demissão',
    activeBorderColor: 'border-red-500',
    gradient: 'from-red-100 to-red-50',
  },
  '1,2': { 
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'Avaliar possibilidade de movimentação horizontal',
    activeBorderColor: 'border-amber-500',
    gradient: 'from-amber-100 to-amber-50',
  },
  '1,3': { 
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Está no lugar certo. Manter na posição e rever remuneração',
    activeBorderColor: 'border-emerald-500',
    gradient: 'from-emerald-100 to-emerald-50',
  },
  '2,1': { 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Avaliar se está na área certa. Rever atribuições',
    activeBorderColor: 'border-orange-500',
    gradient: 'from-orange-100 to-orange-50',
  },
  '2,2': { 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Investir no potencial e desempenho para manter na atual função',
    activeBorderColor: 'border-blue-500',
    gradient: 'from-blue-100 to-blue-50',
  },
  '2,3': { 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    description: 'Avaliar a possibilidade de promoção na própria área',
    activeBorderColor: 'border-green-500',
    gradient: 'from-green-100 to-green-50',
  },
  '3,1': { 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Verificar a causa: Local ou Chefe errado? Investir no desenvolvimento',
    activeBorderColor: 'border-purple-500',
    gradient: 'from-purple-100 to-purple-50',
  },
  '3,2': { 
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    description: 'Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-indigo-500',
    gradient: 'from-indigo-100 to-indigo-50',
  },
  '3,3': { 
    bgColor: 'bg-gradient-to-br from-primary-500 to-secondary-600',
    borderColor: 'border-primary-500',
    textColor: 'text-white',
    description: 'Dar mais atribuições. Preparar para função maior. Líder do futuro!',
    activeBorderColor: 'border-primary-700',
    gradient: 'from-primary-500 to-secondary-600',
  }
};

// Mock evaluations for Nine Box (apenas para demonstração)
const mockNineBoxEvaluations = [
  { employeeId: '1', consensusScore: 3.2, potentialScore: 2.5 },
  { employeeId: '2', consensusScore: 3.8, potentialScore: 3.5 },
  { employeeId: '3', consensusScore: 2.2, potentialScore: 1.8 },
  { employeeId: '4', consensusScore: 3.2, potentialScore: 2.5 },
  { employeeId: '5', consensusScore: 1.8, potentialScore: 2.1 },
];

const NineBoxMatrix = () => {
  const navigate = useNavigate();
  const { employees } = useEvaluation();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [evaluations] = useState(mockNineBoxEvaluations);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);

  const selectedEvaluation = evaluations.find(e => e.employeeId === selectedEmployee);
  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  /**
   * Converte nota de 1-4 para posição de 0-3 no grid
   */
  const convertScoreToGridPosition = (score: number): number => {
    const clampedScore = Math.max(1, Math.min(4, score));
    return clampedScore - 1;
  };

  /**
   * Obtém o quadrante baseado nas notas (retorna índices de 1-3)
   */
  const getQuadrant = (performance: number, potential: number): { row: number; col: number } => {
    // Determina o quadrante baseado nos intervalos:
    // 1.0-2.0 = quadrante 1
    // 2.0-3.0 = quadrante 2  
    // 3.0-4.0 = quadrante 3
    
    let perfQuadrant: number;
    let potQuadrant: number;
    
    // Performance (coluna)
    if (performance <= 2.0) {
      perfQuadrant = 1;
    } else if (performance <= 3.0) {
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
   * Calcula a posição do ponto dentro da matriz
   */
  const getPointPosition = (performance: number, potential: number) => {
    const x = convertScoreToGridPosition(performance);
    const y = convertScoreToGridPosition(potential);
    
    // Converte para porcentagem (0-100%)
    const xPercent = (x / 3) * 100;
    // Inverte o Y porque o grid visual cresce de baixo para cima
    const yPercent = (1 - y / 3) * 100;
    
    return { x: xPercent, y: yPercent };
  };

  /**
   * Verifica se um quadrante está ativo (contém o colaborador selecionado)
   */
  const isQuadrantActive = (row: number, col: number): boolean => {
    if (!selectedEvaluation) return false;
    
    const quadrant = getQuadrant(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore);
    return quadrant.row === row && quadrant.col === col;
  };

  const getActiveQuadrantInfo = () => {
    if (!selectedEvaluation) return null;
    const quadrant = getQuadrant(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore);
    const key = `${quadrant.row},${quadrant.col}`;
    return matrixConfig[key];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                <Grid3x3 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 mr-2 sm:mr-3" />
                <span className="break-words">Matriz 9-Box</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                Análise de Performance vs Potencial
              </p>
            </div>
          </div>
          
          <Button
            variant="primary"
            icon={<Download size={18} />}
            onClick={() => navigate('/action-plan')}
            size="lg"
            className="w-full sm:w-auto"
          >
            Gerar Plano de Ação
          </Button>
        </div>

        {/* Seleção de Colaborador */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
            Selecionar Colaborador
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador
              </label>
              <select
                className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-700 text-sm sm:text-base"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Selecione um colaborador</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Cargo
                  </label>
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base border border-gray-200">
                    {selectedEmp.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="inline h-4 w-4 mr-1" />
                    Departamento
                  </label>
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base border border-gray-200">
                    {selectedEmp.department}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Conteúdo Principal */}
      {selectedEmployee && selectedEvaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Coluna Esquerda - Scores e Info */}
          <div className="space-y-4">
            {/* Card de Scores */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Avaliação de {selectedEmp?.name}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg sm:rounded-xl p-4 border border-primary-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Performance</p>
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                    {selectedEvaluation.consensusScore.toFixed(1)}
                  </p>
                  <div className="mt-2 bg-primary-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedEvaluation.consensusScore / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg sm:rounded-xl p-4 border border-secondary-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Potencial</p>
                    <Target className="h-4 w-4 text-secondary-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-600">
                    {selectedEvaluation.potentialScore.toFixed(1)}
                  </p>
                  <div className="mt-2 bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-secondary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedEvaluation.potentialScore / 4) * 100}%` }}
                    />
                  </div>
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                Posicionamento na Matriz
              </h2>

              {/* Grid da Matriz 9-Box */}
              <div className="flex justify-center">
                <div className="relative">
                  
                  {/* Título do eixo Y (Potencial) */}
                  <div className="absolute -left-12 sm:-left-40 top-1/2 transform -translate-y-1/2 -rotate-90">
                    <span className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-widest">
                      POTENCIAL
                    </span>
                  </div>
                  
                  {/* Labels do eixo Y */}
                  <div className="absolute -left-10 sm:-left-12 flex flex-col justify-between h-72 sm:h-[420px]">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Alto</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Médio</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Baixo</span>
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
                                border-2 ${isActive ? `${config.activeBorderColor} shadow-xl z-10` : config.borderColor}
                                transition-all duration-300 cursor-pointer
                                ${isHovered && !isActive ? 'shadow-lg z-5' : ''}
                              `}
                            >
                              <div className="text-center">
                                <div className="text-[10px] sm:text-xs opacity-80 leading-tight">
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
                        className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full shadow-lg z-20 ring-4 ring-white"
                        style={{
                          left: `${getPointPosition(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore).x}%`,
                          top: `${getPointPosition(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore).y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )}
                  </div>

                  {/* Labels do eixo X */}
                  <div className="flex justify-between w-72 sm:w-[420px] mt-4 sm:mt-6">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Baixo</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Médio</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Alto</span>
                  </div>

                  {/* Título do eixo X */}
                  <div className="flex justify-center w-72 sm:w-[420px] mt-3">
                    <span className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-widest">
                      DESEMPENHO
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 sm:mt-8 p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200 flex items-start">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
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

      {/* Empty State */}
      {!selectedEmployee && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 mb-4 sm:mb-6">
              <Grid3x3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Selecione um colaborador acima para visualizar sua posição na Matriz 9-Box
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NineBoxMatrix;