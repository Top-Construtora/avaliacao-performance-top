import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, BarChart3, Download, Filter } from 'lucide-react';

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

  // Função para obter a categoria do 9-Box baseada nos quadrantes
  const getNineBoxCategory = (performance, potential) => {
    const perfQuadrant = performance
    const potQuadrant = potential;
    
    // Matriz 3x3 - Potencial (Y) x Performance (X)
    const matrix = {
      '3,1': { name: 'Enigma', color: 'bg-yellow-200', description: 'Verificar a Causa: Local ou Chefe errado? Investir no desenvolvimento' },
      '3,2': { name: 'Promessa', color: 'bg-green-200', description: 'Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo' },
      '3,3': { name: 'Estrela', color: 'bg-green-300', description: 'Dar mais atribuições. Preparar para função maior. Líder do futuro!' },
      '2,1': { name: 'Dilema', color: 'bg-orange-200', description: 'Avaliar se está na área certa. Rever atribuições' },
      '2,2': { name: 'Núcleo', color: 'bg-purple-200', description: 'Investir no potencial e desempenho para manter na atual função' },
      '2,3': { name: 'Especialista', color: 'bg-green-200', description: 'Avaliar a possibilidade de promoção na própria área' },
      '1,1': { name: 'Inadequado', color: 'bg-red-200', description: 'Avaliar possibilidade de movimentação para função menor ou demissão' },
      '1,2': { name: 'Questionável', color: 'bg-yellow-200', description: 'Avaliar possibilidade de movimentação horizontal' },
      '1,3': { name: 'Performer', color: 'bg-yellow-200', description: 'Está no lugar certo. Manter na posição e rever remuneração.' }
    };
    
    return matrix[`${potQuadrant},${perfQuadrant}`] || { name: 'N/A', color: 'bg-gray-200', description: 'Posição não definida' };
  };

  // Função para determinar o estilo da borda do quadrante ativo
  const getQuadrantStyle = (performance, potential, quadrantRow, quadrantCol) => {
    const perfQuadrant = (performance);
    const potQuadrant = (potential);
    
    const isActiveQuadrant = (potQuadrant === (4 - quadrantRow)) && (perfQuadrant === quadrantCol);
    
    if (isActiveQuadrant) {
      return "border-4 border-red-600 shadow-xl";
    }
    return "border-2 border-black";
  };

  const selectedEvaluation = evaluations.find(e => e.employeeId === selectedEmployee);
  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const nineBoxData = selectedEvaluation ? getNineBoxCategory(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Matriz 9-Box</h1>
                <p className="text-gray-600">Análise de Performance vs Potencial</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download size={16} className="mr-2" />
                Gerar Plano de Ação
              </button>
            </div>
          </div>

          {/* Seleção de Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colaborador
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                    value={selectedEmp.position}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                    value={selectedEmp.department}
                    readOnly
                  />
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
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Matriz 9-Box - {selectedEmp?.name}
              </h2>
              {nineBoxData && (
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${nineBoxData.color.replace('bg-', 'bg-').replace('-200', '-800')} ${nineBoxData.color}`}>
                    {nineBoxData.name}
                  </span>
                </div>
              )}
            </div>

            {/* Grid da Matriz 9-Box */}
            <div className="flex justify-center">
              <div className="relative">
                
                {/* Título do eixo Y (Potencial) */}
                <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 -rotate-90">
                  <span className="text-sm font-semibold text-gray-700">POTENCIAL</span>
                </div>
                
                {/* Labels do eixo Y na direita */}
                <div className="absolute -right-12 flex flex-col justify-between h-96 py-16">
                  <span className="text-xs text-gray-600">Alto</span>
                  <span className="text-xs text-gray-600">Médio</span>
                  <span className="text-xs text-gray-600">Baixo</span>
                </div>

                {/* Labels do eixo X acima da matriz */}
                <div className="flex justify-between w-96 mb-4">
                  <span className="text-xs text-gray-600">Abaixo do Esperado</span>
                  <span className="text-xs text-gray-600">Esperado</span>
                  <span className="text-xs text-gray-600">Acima do Esperado</span>
                </div>

                {/* Grid 3x3 exatamente como na imagem */}
                <div className="w-96 h-96">
                  <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full">
                    {/* Linha 1 (Potencial Alto - Y: 3-4) */}
                    <div className={`bg-blue-400 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 1, 1) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Verificar a Causa: Local ou Chefe errado? Investir no desenvolvimento
                      </div>
                    </div>
                    <div className={`bg-green-400 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 1, 2) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Concentrar-se no desempenho de curto prazo. Avaliar oportunidades a longo prazo
                      </div>
                    </div>
                    <div className={`bg-green-500 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 1, 3) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Dar mais atribuições. Preparar para função maior. Líder do futuro!
                      </div>
                    </div>

                    {/* Linha 2 (Potencial Médio - Y: 2-3) */}
                    <div className={`bg-yellow-300 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 2, 1) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Avaliar se está na área certa. Rever atribuições
                      </div>
                    </div>
                    <div className={`bg-blue-300 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 2, 2) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Investir no potencial e desempenho para manter na atual função
                      </div>
                    </div>
                    <div className={`bg-green-300 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 2, 3) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Avaliar a possibilidade de promoção na própria área
                      </div>
                    </div>

                    {/* Linha 3 (Potencial Baixo - Y: 1-2) */}
                    <div className={`bg-red-400 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 3, 1) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leaving-tight text-black font-medium">
                        Avaliar possibilidade de movimentação para função menor ou demissão
                      </div>
                    </div>
                    <div className={`bg-yellow-300 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 3, 2) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Avaliar possibilidade de movimentação horizontal
                      </div>
                    </div>
                    <div className={`bg-blue-300 flex items-center justify-center p-3 ${selectedEvaluation ? getQuadrantStyle(selectedEvaluation.consensusScore, selectedEvaluation.potentialScore, 3, 3) : 'border-2 border-black'}`}>
                      <div className="text-xs text-center leading-tight text-black font-medium">
                        Está no lugar certo. Manter na posição e rever remuneração.
                      </div>
                    </div>
                  </div>

                  {/* Ponto pequeno no centro do quadrante ativo */}
                  {selectedEvaluation && (() => {
                    const perfQuadrant = (selectedEvaluation.consensusScore);
                    const potQuadrant = (selectedEvaluation.potentialScore);
                    
                    // Calcular posição do centro do quadrante
                    const xPercent = (perfQuadrant - 1) * 33.33 + 16.67; // Centro do quadrante
                    const yPercent = (3 - potQuadrant) * 33.33 + 16.67; // Centro do quadrante
                    
                    return (
                      <div 
                        className="absolute bg-white rounded-full w-4 h-4 border-2 border-black transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-md"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`
                        }}
                      ></div>
                    );
                  })()}
                </div>

                {/* Título do eixo X abaixo da matriz */}
                <div className="flex justify-center w-96 mt-4">
                  <span className="text-sm font-semibold text-gray-700">DESEMPENHO</span>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise de Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance Média:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedEvaluation.consensusScore.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedEvaluation.consensusScore / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Baseado em 7 competências avaliadas</p>
              </div>
            </div>

            {/* Análise de Potencial */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise de Potencial</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Potencial Médio:</span>
                  <span className="text-lg font-bold text-green-600">{selectedEvaluation.potentialScore.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedEvaluation.potentialScore / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Usando média de performance como referência</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recomendações */}
        {selectedEmployee && nineBoxData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recomendações de Ação</h3>
            <div className={`p-4 rounded-lg ${nineBoxData.color} border-l-4 border-l-blue-600`}>
              <h4 className="font-medium text-gray-800 mb-2">Categoria: {nineBoxData.name}</h4>
              <p className="text-sm text-gray-700">{nineBoxData.description}</p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedEmployee && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador selecionado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um colaborador acima para visualizar sua posição na Matriz 9-Box
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NineBoxMatrix;