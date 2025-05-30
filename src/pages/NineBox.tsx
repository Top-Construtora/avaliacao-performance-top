import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, BarChart3, Download, Filter, TrendingUp, Users, Award, Sparkles, Target, Info } from 'lucide-react';

// Simulando dados de contexto
const mockEmployees = [
  { id: '1', name: 'Maria Santos', position: 'UX Designer', department: 'Design' },
  { id: '2', name: 'João Silva', position: 'Tech Lead', department: 'Engineering' },
  { id: '3', name: 'Pedro Oliveira', position: 'Project Manager', department: 'Project Management' },
  { id: '4', name: 'Ana Costa', position: 'Software Developer', department: 'Engineering' },
  { id: '5', name: 'Carlos Mendes', position: 'HR Specialist', department: 'People & Management' },
];

const mockEvaluations = [
  { employeeId: '1', consensusScore: 2.5, potentialScore: 3.2 },
  { employeeId: '2', consensusScore: 3.8, potentialScore: 3.5 },
  { employeeId: '3', consensusScore: 2.2, potentialScore: 1.8 },
  { employeeId: '4', consensusScore: 3.2, potentialScore: 2.5 },
  { employeeId: '5', consensusScore: 1.8, potentialScore: 2.1 },
];

const NineBoxMatrix = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees] = useState(mockEmployees);
  const [evaluations] = useState(mockEvaluations);

  // Configuração da matriz com cores da paleta
  type MatrixKey = '3,1' | '3,2' | '3,3' | '2,1' | '2,2' | '2,3' | '1,1' | '1,2' | '1,3';
  type MatrixConfigType = {
    [key in MatrixKey]: {
      name: string;
      bgColor: string;
      borderColor: string;
      textColor: string;
      description: string;
      gradient?: string;
    }
  };
  const matrixConfig: MatrixConfigType = {
    '3,1': { 
      name: '', 
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-700',
      description: 'Verificar a causa: Local ou Chefe errado? Investir no desenvolvimento'
    },
    '3,2': { 
      name: '', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-gray-700',
      description: 'Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo'
    },
    '3,3': { 
      name: '', 
      bgColor: '',
      gradient: 'bg-gradient-to-br from-primary-500 to-secondary-600',
      borderColor: 'border-primary-500',
      textColor: 'text-white',
      description: 'Dar mais atribuições. Preparar para função maior. Líder do futuro!'
    },
    '2,1': { 
      name: '', 
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-300',
      textColor: 'text-gray-700',
      description: 'Avaliar se está na área certa. Rever atribuições'
    },
    '2,2': { 
      name: '', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-gray-700',
      description: 'Investir no potencial e desempenho para manter na atual função'
    },
    '2,3': { 
      name: '', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-gray-700',
      description: 'Avaliar a possibilidade de promoção na própria área'
    },
    '1,1': { 
      name: '', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-gray-700',
      description: 'Avaliar possibilidade de movimentação para função menor ou demissão'
    },
    '1,2': { 
      name: '', 
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-gray-700',
      description: 'Avaliar possibilidade de movimentação horizontal'
    },
    '1,3': { 
      name: '', 
      bgColor: 'bg-green-100',
      borderColor: 'border-green-400',
      textColor: 'text-gray-700',
      description: 'Está no lugar certo. Manter na posição e rever remuneração'
    }
  };

  const recommendations = {
    '3,1': {
      icon: Sparkles,
      actions: [
        'Investir em desenvolvimento focado',
        'Identificar barreiras de desempenho',
        'Mentoria intensiva',
        'Reavaliação de função atual'
      ]
    },
    '3,2': {
      icon: TrendingUp,
      actions: [
        'Acelerar desenvolvimento',
        'Preparar para próximo nível',
        'Exposição a projetos estratégicos',
        'Programa de liderança'
      ]
    },
    '3,3': {
      icon: Award,
      actions: [
        'Plano de sucessão',
        'Desafios estratégicos',
        'Embaixador da cultura',
        'Preparação para C-Level'
      ]
    },
    '2,1': {
      icon: Target,
      actions: [
        'Avaliar fit cultural',
        'Plano de melhoria específico',
        'Acompanhamento próximo',
        'Considerar realocação'
      ]
    },
    '2,2': {
      icon: Users,
      actions: [
        'Manter engajamento',
        'Desenvolvimento gradual',
        'Reconhecimento consistente',
        'Oportunidades laterais'
      ]
    },
    '2,3': {
      icon: TrendingUp,
      actions: [
        'Especialização técnica',
        'Liderança técnica',
        'Projetos de alta complexidade',
        'Mentoria para outros'
      ]
    },
    '1,1': {
      icon: Info,
      actions: [
        'Plano de melhoria urgente',
        'Avaliação de continuidade',
        'Suporte intensivo',
        'Prazo para evolução'
      ]
    },
    '1,2': {
      icon: Target,
      actions: [
        'Foco em eficiência',
        'Treinamento específico',
        'Metas claras',
        'Acompanhamento regular'
      ]
    },
    '1,3': {
      icon: Award,
      actions: [
        'Reconhecimento técnico',
        'Carreira em Y',
        'Especialização profunda',
        'Contribuição individual'
      ]
    }
  };

  interface GetQuadrantStyleParams {
    performance: number;
    potential: number;
    quadrantRow: number;
    quadrantCol: number;
  }

  const getQuadrantStyle = (
    performance: number,
    potential: number,
    quadrantRow: number,
    quadrantCol: number
  ): string => {
    const perfQuadrant = Math.ceil(performance);
    const potQuadrant = Math.ceil(potential);

    const isActiveQuadrant = (potQuadrant === (4 - quadrantRow)) && (perfQuadrant === quadrantCol);

    if (isActiveQuadrant) {
      return "ring-4 ring-primary-500 ring-offset-2 transform scale-105 shadow-xl";
    }
    return "";
  };

  const selectedEvaluation = evaluations.find(e => e.employeeId === selectedEmployee);
  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const nineBoxKey = selectedEvaluation ? 
    `${Math.ceil(selectedEvaluation.potentialScore)},${Math.ceil(selectedEvaluation.consensusScore)}` : null;
  const nineBoxData = nineBoxKey ? matrixConfig[nineBoxKey as MatrixKey] : null;
  const recommendationData = nineBoxKey ? recommendations[nineBoxKey as MatrixKey] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Matriz 9-Box
                </h1>
                <p className="text-gray-600 mt-1">Análise de Performance vs Potencial</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg">
                <Download size={16} className="mr-2" />
                Gerar Plano de Ação
              </button>
            </div>
          </div>

          {/* Seleção de Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700">
                    {selectedEmp.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700">
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
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Posicionamento na Matriz
              </h2>
              {nineBoxData && nineBoxData.name && (
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${nineBoxData.gradient || nineBoxData.bgColor} ${nineBoxData.borderColor} border-2 ${nineBoxData.textColor}`}>
                    {nineBoxData.name}
                  </span>
                  <span className="text-sm text-gray-600">{nineBoxData.description}</span>
                </div>
              )}
            </div>

            {/* Grid da Matriz 9-Box */}
            <div className="flex justify-center">
              <div className="relative">
                
                {/* Título do eixo Y (Potencial) */}
                <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 -rotate-90">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Potencial</span>
                </div>
                
                {/* Labels do eixo Y */}
                <div className="absolute -left-16 flex flex-col justify-between h-96 py-8">
                  <span className="text-sm font-medium text-gray-600">Alto</span>
                  <span className="text-sm font-medium text-gray-600">Médio</span>
                  <span className="text-sm font-medium text-gray-600">Baixo</span>
                </div>

                {/* Grid 3x3 */}
                <div className="w-96 h-96">
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
                    {[1, 2, 3].map((row) => (
                      [1, 2, 3].map((col) => {
                        const key = `${4-row},${col}`;
                        const config = matrixConfig[key as MatrixKey];
                        const isActive = selectedEvaluation && 
                          Math.ceil(selectedEvaluation.potentialScore) === (4-row) &&
                          Math.ceil(selectedEvaluation.consensusScore) === col;
                        
                        return (
                          <div
                            key={key}
                            className={`
                              relative flex items-center justify-center p-4 rounded-xl transition-all duration-300
                              ${config.gradient || config.bgColor} ${config.borderColor} border-2 ${config.textColor}
                              ${isActive ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, row, col) : ''}
                              hover:shadow-lg cursor-pointer
                            `}
                          >
                            <div className="text-center">
                              {config.name && (
                                <div className="text-sm font-bold mb-1">{config.name}</div>
                              )}
                              <div className="text-xs opacity-80">
                                {config.description.length > 60 ? config.description.substring(0, 60) + '...' : config.description}
                              </div>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="absolute inset-0 flex items-center justify-center"
                                >
                                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                                    <User className="h-8 w-8 text-primary-600" />
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>

                {/* Labels do eixo X */}
                <div className="flex justify-between w-96 mt-6">
                  <span className="text-sm font-medium text-gray-600">Baixo</span>
                  <span className="text-sm font-medium text-gray-600">Médio</span>
                  <span className="text-sm font-medium text-gray-600">Alto</span>
                </div>

                {/* Título do eixo X */}
                <div className="flex justify-center w-96 mt-2">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Desempenho</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Análise de Performance e Potencial */}
        {selectedEmployee && selectedEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Análise de Performance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="p-2 rounded-lg bg-primary-50 mr-3">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                </div>
                Análise de Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Performance Atual</span>
                    <span className="text-2xl font-bold text-primary-600">{selectedEvaluation.consensusScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedEvaluation.consensusScore / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    O colaborador está {selectedEvaluation.consensusScore >= 3 ? 'acima da média' : selectedEvaluation.consensusScore >= 2 ? 'na média' : 'abaixo da média'} em termos de desempenho.
                  </p>
                </div>
              </div>
            </div>

            {/* Análise de Potencial */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="p-2 rounded-lg bg-secondary-50 mr-3">
                  <Sparkles className="h-5 w-5 text-secondary-600" />
                </div>
                Análise de Potencial
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Potencial Identificado</span>
                    <span className="text-2xl font-bold text-secondary-600">{selectedEvaluation.potentialScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedEvaluation.potentialScore / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Demonstra {selectedEvaluation.potentialScore >= 3 ? 'alto potencial' : selectedEvaluation.potentialScore >= 2 ? 'potencial moderado' : 'potencial em desenvolvimento'} para crescimento.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recomendações */}
        {selectedEmployee && nineBoxData && recommendationData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="p-2 rounded-lg bg-accent-50 mr-3">
                <recommendationData.icon className="h-5 w-5 text-accent-600" />
              </div>
              Plano de Ação Recomendado
            </h3>
            <div className={`p-6 rounded-xl ${nineBoxData.gradient || nineBoxData.bgColor} ${nineBoxData.borderColor} border-2`}>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary-600" />
                {nineBoxData.name ? `Categoria: ${nineBoxData.name}` : 'Recomendações'}
              </h4>
              <div className="space-y-3">
                {recommendationData.actions.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <div className="max-w-sm mx-auto">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 mb-6">
                <BarChart3 className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum colaborador selecionado</h3>
              <p className="text-gray-500">
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