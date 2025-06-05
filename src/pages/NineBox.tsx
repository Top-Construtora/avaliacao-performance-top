import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, BarChart3, Download, Calendar, Briefcase } from 'lucide-react';

// Tipos
interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
}

interface Evaluation {
  employeeId: string;
  consensusScore: number; // Performance (1-4)
  potentialScore: number; // Potencial (1-4)
}

interface MatrixConfig {
  name: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  activeBorderColor: string;
}

// Configuração da matriz com cores mais sóbrias
const matrixConfig: Record<string, MatrixConfig> = {
  '1,1': { 
    name: '', 
    bgColor: 'bg-red-50/70',
    borderColor: 'border-red-200',
    textColor: 'text-gray-700',
    description: 'Avaliar possibilidade de movimentação para função menor ou demissão',
    activeBorderColor: 'border-red-400'
  },
  '1,2': { 
    name: '', 
    bgColor: 'bg-yellow-50/70',
    borderColor: 'border-yellow-200',
    textColor: 'text-gray-700',
    description: 'Avaliar possibilidade de movimentação horizontal',
    activeBorderColor: 'border-yellow-400'
  },
  '1,3': { 
    name: '', 
    bgColor: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    textColor: 'text-gray-700',
    description: 'Está no lugar certo. Manter na posição e rever remuneração',
    activeBorderColor: 'border-emerald-400'
  },
  '2,1': { 
    name: '', 
    bgColor: 'bg-rose-50/70',
    borderColor: 'border-rose-200',
    textColor: 'text-gray-700',
    description: 'Avaliar se está na área certa. Rever atribuições',
    activeBorderColor: 'border-rose-400'
  },
  '2,2': { 
    name: '', 
    bgColor: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    textColor: 'text-gray-700',
    description: 'Investir no potencial e desempenho para manter na atual função',
    activeBorderColor: 'border-blue-400'
  },
  '2,3': { 
    name: '', 
    bgColor: 'bg-green-50/70',
    borderColor: 'border-green-200',
    textColor: 'text-gray-700',
    description: 'Avaliar a possibilidade de promoção na própria área',
    activeBorderColor: 'border-green-400'
  },
  '3,1': { 
    name: '', 
    bgColor: 'bg-gray-50/70',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    description: 'Verificar a causa: Local ou Chefe errado? Investir no desenvolvimento',
    activeBorderColor: 'border-gray-400'
  },
  '3,2': { 
    name: '', 
    bgColor: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    textColor: 'text-gray-700',
    description: 'Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo',
    activeBorderColor: 'border-indigo-400'
  },
  '3,3': { 
    name: '', 
    bgColor: 'bg-teal-600',
    borderColor: 'border-teal-600',
    textColor: 'text-white',
    description: 'Dar mais atribuições. Preparar para função maior. Líder do futuro!',
    activeBorderColor: 'border-teal-800'
  }
};

// Mock data
const mockEmployees: Employee[] = [
  { id: '1', name: 'Maria Santos', position: 'UX Designer', department: 'Design' },
  { id: '2', name: 'João Silva', position: 'Tech Lead', department: 'Engineering' },
  { id: '3', name: 'Pedro Oliveira', position: 'Project Manager', department: 'Project Management' },
  { id: '4', name: 'Ana Costa', position: 'Software Developer', department: 'Engineering' },
  { id: '5', name: 'Carlos Mendes', position: 'HR Specialist', department: 'People & Management' },
];

const mockEvaluations: Evaluation[] = [
  { employeeId: '1', consensusScore: 3.2, potentialScore: 2.5 },
  { employeeId: '2', consensusScore: 3.8, potentialScore: 3.5 },
  { employeeId: '3', consensusScore: 2.2, potentialScore: 1.8 },
  { employeeId: '4', consensusScore: 3.2, potentialScore: 2.5 },
  { employeeId: '5', consensusScore: 1.8, potentialScore: 2.1 },
];

const NineBoxMatrix = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees] = useState(mockEmployees);
  const [evaluations] = useState(mockEvaluations);

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
    const perfQuadrant = Math.ceil(performance);
    const potQuadrant = Math.ceil(potential);
    
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

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Matriz 9-Box
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Análise de Performance vs Potencial</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base">
                <Download size={14} className="mr-2" />
                <span className="hidden sm:inline">Gerar Plano de Ação</span>
                <span className="sm:hidden">Plano</span>
              </button>
            </div>
          </div>

          {/* Seleção de Colaborador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador
              </label>
              <select
                className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
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
                    Cargo
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 text-sm">
                    {selectedEmp.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 text-sm">
                    {selectedEmp.department}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Matriz 9-Box */}
        {selectedEmployee && selectedEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                Posicionamento na Matriz
              </h2>
              
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Performance</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {selectedEvaluation.consensusScore.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Potencial</p>
                  <p className="text-3xl font-bold text-secondary-600">
                    {selectedEvaluation.potentialScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid da Matriz 9-Box */}
            <div className="flex justify-center">
              <div className="relative">
                
                {/* Título do eixo Y (Potencial) */}
                <div className="absolute -left-14 sm:-left-20 top-1/2 transform -translate-y-1/2 -rotate-90">
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
                        
                        return (
                          <div
                            key={key}
                            className={`
                              relative flex items-center justify-center p-3 sm:p-5
                              ${config.bgColor} ${config.textColor}
                              border-[1.5px] ${isActive ? `${config.activeBorderColor} border-[3px] shadow-lg z-10` : config.borderColor}
                              transition-all duration-300
                            `}
                          >
                            <div className="text-center px-1">
                              <div className="text-[11px] sm:text-sm leading-relaxed">
                                {config.description}
                              </div>
                            </div>
                          </div>
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
                      className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full shadow-md z-20"
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

            {/* Legenda do quadrante ativo */}
            {selectedEvaluation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <p className="text-sm font-semibold text-gray-700 mb-2">Posição Atual:</p>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const quadrant = getQuadrant(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore);
                    const key = `${quadrant.row},${quadrant.col}`;
                    return matrixConfig[key]?.description || '';
                  })()}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16 text-center"
          >
            <div className="max-w-sm mx-auto">
              <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 mb-6">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Nenhum colaborador selecionado
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                Selecione um colaborador acima para visualizar sua posição na Matriz 9-Box
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NineBoxMatrix;