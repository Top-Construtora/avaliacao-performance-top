// src/pages/Consensus.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Users,
  User,
  Award,
  CheckCircle
} from 'lucide-react';

// Interfaces para tipagem
interface ScoreMap {
  [key: string]: number;
}

interface EvaluationData {
  scores: ScoreMap;
}

interface Criterion {
  id: string;
  name: string;
  category: 'Técnica' | 'Comportamental' | 'Organizacional';
}

const Consensus = () => {
  const navigate = useNavigate();
  const { employees, evaluations, saveEvaluation } = useEvaluation();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [consensusScores, setConsensusScores] = useState<ScoreMap>({});
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  // Critérios baseados na imagem fornecida
  const criteria: Criterion[] = [
    { id: 'gestao-conhecimento', name: 'GESTÃO DO CONHECIMENTO', category: 'Técnica' },
    { id: 'orientacao-resultados', name: 'ORIENTAÇÃO A RESULTADOS', category: 'Técnica' },
    { id: 'pensamento-critico', name: 'PENSAMENTO CRÍTICO', category: 'Técnica' },
    { id: 'aderencia-processos', name: 'ADERÊNCIA A PROCESSOS', category: 'Técnica' },
    { id: 'comunicacao', name: 'COMUNICAÇÃO', category: 'Comportamental' },
    { id: 'inteligencia-emocional', name: 'INTELIGÊNCIA EMOCIONAL', category: 'Comportamental' },
    { id: 'colaboracao', name: 'COLABORAÇÃO', category: 'Comportamental' },
    { id: 'flexibilidade', name: 'FLEXIBILIDADE', category: 'Comportamental' },
    { id: 'missao-dada-cumprida', name: 'MISSÃO DADA É MISSÃO CUMPRIDA', category: 'Organizacional' },
    { id: 'senso-dono', name: 'SENSO DE DONO', category: 'Organizacional' },
    { id: 'planejar-preco', name: 'PLANEJAR É PREÇO', category: 'Organizacional' },
    { id: 'melhoria-continua', name: 'MELHORIA CONTÍNUA', category: 'Organizacional' }
  ];

  // Buscar avaliações do colaborador selecionado
  const getEmployeeEvaluations = (employeeId: string): { selfEvaluation: EvaluationData | null; leaderEvaluation: EvaluationData | null } => {
    if (!employeeId) return { selfEvaluation: null, leaderEvaluation: null };
    
    // Simular autoavaliação e avaliação do líder com dados baseados na imagem
    const selfEvaluation: EvaluationData = {
      scores: {
        'gestao-conhecimento': 3,
        'orientacao-resultados': 3,
        'pensamento-critico': 3,
        'aderencia-processos': 3,
        'comunicacao': 3,
        'inteligencia-emocional': 3,
        'colaboracao': 3,
        'flexibilidade': 3,
        'missao-dada-cumprida': 3,
        'senso-dono': 3,
        'planejar-preco': 3,
        'melhoria-continua': 3
      }
    };
    
    const leaderEvaluation: EvaluationData = {
      scores: {
        'gestao-conhecimento': 4,
        'orientacao-resultados': 4,
        'pensamento-critico': 4,
        'aderencia-processos': 4,
        'comunicacao': 4,
        'inteligencia-emocional': 4,
        'colaboracao': 4,
        'flexibilidade': 4,
        'missao-dada-cumprida': 4,
        'senso-dono': 4,
        'planejar-preco': 4,
        'melhoria-continua': 4
      }
    };

    return { selfEvaluation, leaderEvaluation };
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const { selfEvaluation, leaderEvaluation } = getEmployeeEvaluations(selectedEmployeeId);

  // Limpar consenso quando trocar de colaborador
  useEffect(() => {
    if (selectedEmployeeId) {
      // Inicializar com objeto vazio - usuário deve escolher
      setConsensusScores({});
    }
  }, [selectedEmployeeId]);

  const handleConsensusChange = (criterionId: string, score: number): void => {
    setConsensusScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const handleSaveConsensus = (): void => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador');
      return;
    }

    // Verificar se todos os critérios foram avaliados (score > 0)
    const hasUnratedCriteria = criteria.some(criterion => 
      !consensusScores[criterion.id] || consensusScores[criterion.id] === 0
    );

    if (hasUnratedCriteria) {
      toast.error('Todos os critérios precisam ter uma nota de consenso');
      return;
    }

    // Verificar se as notas estão na faixa válida (1-4)
    const hasInvalidScores = Object.values(consensusScores).some(score => 
      score < 1 || score > 4
    );

    if (hasInvalidScores) {
      toast.error('As notas devem estar entre 1 e 4');
      return;
    }

    // Salvar consenso
    const consensusEvaluation = {
      id: `consensus-${selectedEmployeeId}-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'consensus',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      criteria: criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: `Consenso para ${criterion.name}`,
        category: criterion.category.toLowerCase() as 'technical' | 'behavioral' | 'deliveries',
        score: consensusScores[criterion.id]
      })),
      feedback: {
        strengths: 'Avaliação definida por consenso',
        improvements: 'Pontos definidos em reunião de consenso',
        observations: 'Nota final estabelecida através do consenso'
      },
      technicalScore: calculateCategoryAverage('Técnica'),
      behavioralScore: calculateCategoryAverage('Comportamental'),
      deliveriesScore: calculateCategoryAverage('Organizacional'),
      finalScore: calculateOverallAverage(),
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false
    };

    saveEvaluation(consensusEvaluation);
    toast.success('Consenso salvo com sucesso!');
  };

  const calculateCategoryAverage = (category: 'Técnica' | 'Comportamental' | 'Organizacional'): number => {
    const categoryCriteria = criteria.filter(c => c.category === category);
    const validScores = categoryCriteria
      .map(criterion => consensusScores[criterion.id])
      .filter(score => score && score > 0); // Só considerar scores válidos (> 0)
    
    if (validScores.length === 0) return 0;
    
    const total = validScores.reduce((sum, score) => sum + score, 0);
    return total / validScores.length;
  };

  const calculateOverallAverage = (): number => {
    const technical = calculateCategoryAverage('Técnica');
    const behavioral = calculateCategoryAverage('Comportamental');
    const organizational = calculateCategoryAverage('Organizacional');
    
    // Pesos: Técnica 40%, Comportamental 30%, Organizacional 30%
    return (technical * 0.4) + (behavioral * 0.3) + (organizational * 0.3);
  };

  const generateMatrix = (): void => {
    setShowMatrix(true);
    toast.success('Matriz 9-Box gerada com sucesso!');
  };

  // Componente de botão de pontuação com melhor feedback visual
  const ScoreButton = ({ score, isSelected, onClick }: { 
    score: number; 
    isSelected: boolean; 
    onClick: (score: number) => void;
  }) => (
    <button
      onClick={() => onClick(score)}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
        isSelected 
          ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300' 
          : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-300'
      }`}
      title={`Selecionar nota ${score}`}
      aria-label={`Nota ${score} ${isSelected ? '(selecionada)' : ''}`}
    >
      {score}
    </button>
  );

  // Componente de indicador de pontuação
  const ScoreIndicator = ({ score, type }: { score: number; type: 'self' | 'leader' }) => {
    const colors = {
      self: 'bg-blue-500',
      leader: 'bg-green-500'
    };
    
    const labels = {
      self: 'Autoavaliação',
      leader: 'Avaliação do Líder'
    };
    
    return (
      <div 
        className={`w-10 h-10 rounded-full ${colors[type]} flex items-center justify-center text-white text-sm font-bold shadow-md`}
        title={`${labels[type]}: ${score}`}
      >
        {score}
      </div>
    );
  };

  // Função para resetar todos os consensos
  const resetAllConsensus = (): void => {
    setConsensusScores({});
    toast('Todos os consensos foram resetados');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={16} />}
            >
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reunião de Consenso</h1>
              <p className="text-gray-600">Definição das notas finais através do consenso</p>
            </div>
          </div>
        </div>

        {/* Seleção do colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colaborador
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Selecione um colaborador</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={selectedEmployee.position}
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
                  value={selectedEmployee.department}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={new Date().toLocaleDateString('pt-BR')}
                  readOnly
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Tabela de Consenso */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Avaliação por Critério</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Critério
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-2">
                      <User size={16} />
                      <span>Autoavaliação</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-2">
                      <Users size={16} />
                      <span>Avaliação Líder</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-2">
                      <Award size={16} />
                      <span>Consenso</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criteria.map((criterion) => {
                  const selfScore = selfEvaluation?.scores[criterion.id] || 0;
                  const leaderScore = leaderEvaluation?.scores[criterion.id] || 0;
                  const consensusScore = consensusScores[criterion.id] || 0; // 0 significa não selecionado

                  return (
                    <tr key={criterion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {criterion.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {criterion.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ScoreIndicator score={selfScore} type="self" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ScoreIndicator score={leaderScore} type="leader" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          {[1, 2, 3, 4].map(score => (
                            <ScoreButton
                              key={score}
                              score={score}
                              isSelected={consensusScore === score}
                              onClick={(selectedScore: number) => handleConsensusChange(criterion.id, selectedScore)}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Resumo das Notas */}
      {selectedEmployeeId && Object.keys(consensusScores).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo das Notas de Consenso</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800">Técnicas</h4>
              <p className="text-2xl font-bold text-blue-600">{calculateCategoryAverage('Técnica').toFixed(1)}</p>
              <p className="text-xs text-blue-600">Peso 40%</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800">Comportamentais</h4>
              <p className="text-2xl font-bold text-green-600">{calculateCategoryAverage('Comportamental').toFixed(1)}</p>
              <p className="text-xs text-green-600">Peso 30%</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-purple-800">Organizacionais</h4>
              <p className="text-2xl font-bold text-purple-600">{calculateCategoryAverage('Organizacional').toFixed(1)}</p>
              <p className="text-xs text-purple-600">Peso 30%</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800">Nota Final</h4>
              <p className="text-2xl font-bold text-gray-700">{calculateOverallAverage().toFixed(1)}</p>
              <p className="text-xs text-gray-500">Média Ponderada</p>
            </div>
          </div>

          {/* Indicador de progresso */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progresso do Consenso:</span>
              <span>
                {Object.keys(consensusScores).filter(key => consensusScores[key] > 0).length} / {criteria.length} critérios avaliados
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(Object.keys(consensusScores).filter(key => consensusScores[key] > 0).length / criteria.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ações */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end space-x-4"
        >
          <Button
            variant="secondary"
            onClick={handleSaveConsensus}
            icon={<Save size={16} />}
          >
            Salvar Consenso
          </Button>
          <Button
            variant="primary"
            onClick={generateMatrix}
            icon={<CheckCircle size={16} />}
          >
            Gerar Matriz 9-Box
          </Button>
        </motion.div>
      )}

      {/* Modal de Matriz 9-Box */}
      {showMatrix && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMatrix(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Matriz 9-Box Gerada!
              </h2>
              <p className="text-gray-600 mb-6">
                O colaborador {selectedEmployee?.name} foi posicionado na matriz 9-Box com base no consenso estabelecido.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowMatrix(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/reports')}
                >
                  Ver Relatórios
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador selecionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecione um colaborador acima para iniciar a reunião de consenso
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consensus;