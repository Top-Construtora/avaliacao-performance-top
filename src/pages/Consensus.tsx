import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Users,
  Award,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Handshake,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ScoreMap {
  [key: string]: number;
}

interface EvaluationData {
  scores: ScoreMap;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'Técnica' | 'Comportamental' | 'Organizacional';
  icon: React.ElementType;
}

const Consensus = () => {
  const navigate = useNavigate();
  const { employees, evaluations, saveEvaluation } = useEvaluation();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [consensusScores, setConsensusScores] = useState<ScoreMap>({});
  const [consensusObservations, setConsensusObservations] = useState<Record<string, string>>({});
  const [selfScores, setSelfScores] = useState<ScoreMap>({});
  const [leaderScores, setLeaderScores] = useState<ScoreMap>({});
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  const criteria: Criterion[] = [
    { 
      id: 'gestao-conhecimento', 
      name: 'GESTÃO DO CONHECIMENTO', 
      description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes',
      category: 'Técnica', 
      icon: Target 
    },
    { 
      id: 'orientacao-resultados', 
      name: 'ORIENTAÇÃO A RESULTADOS', 
      description: 'Foco em resultados com segurança e qualidade',
      category: 'Técnica', 
      icon: TrendingUp 
    },
    { 
      id: 'pensamento-critico', 
      name: 'PENSAMENTO CRÍTICO', 
      description: 'Capacidade de analisar criticamente situações e propor soluções',
      category: 'Técnica', 
      icon: Target 
    },
    { 
      id: 'aderencia-processos', 
      name: 'ADERÊNCIA A PROCESSOS', 
      description: 'Seguimento de procedimentos e padrões estabelecidos',
      category: 'Técnica', 
      icon: Target 
    },
    { 
      id: 'comunicacao', 
      name: 'COMUNICAÇÃO', 
      description: 'Capacidade de se comunicar de forma clara e eficaz',
      category: 'Comportamental', 
      icon: Users 
    },
    { 
      id: 'inteligencia-emocional', 
      name: 'INTELIGÊNCIA EMOCIONAL', 
      description: 'Capacidade de reconhecer e gerenciar emoções próprias e dos outros',
      category: 'Comportamental', 
      icon: Users 
    },
    { 
      id: 'colaboracao', 
      name: 'COLABORAÇÃO', 
      description: 'Trabalho em equipe e cooperação com colegas',
      category: 'Comportamental', 
      icon: Users 
    },
    { 
      id: 'flexibilidade', 
      name: 'FLEXIBILIDADE', 
      description: 'Adaptação a mudanças e novas situações',
      category: 'Comportamental', 
      icon: Users 
    },
    { 
      id: 'missao-dada-cumprida', 
      name: 'MISSÃO DADA É MISSÃO CUMPRIDA', 
      description: 'Comprometimento com a entrega e cumprimento de compromissos',
      category: 'Organizacional', 
      icon: Award 
    },
    { 
      id: 'senso-dono', 
      name: 'SENSO DE DONO', 
      description: 'Responsabilidade e cuidado como se fosse próprio',
      category: 'Organizacional', 
      icon: Award 
    },
    { 
      id: 'planejar-preco', 
      name: 'PLANEJAR É PREÇO', 
      description: 'Valorização do planejamento e organização',
      category: 'Organizacional', 
      icon: Award 
    },
    { 
      id: 'melhoria-continua', 
      name: 'MELHORIA CONTÍNUA', 
      description: 'Busca constante por aperfeiçoamento e inovação',
      category: 'Organizacional', 
      icon: Award 
    }
  ];

  const categoryConfig = {
    'Técnica': {
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700'
    },
    'Comportamental': {
      color: 'text-secondary-600 dark:text-secondary-400',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700'
    },
    'Organizacional': {
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
      gradient: 'from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700'
    }
  };

  // Initialize scores when employee is selected
  const initializeScores = () => {
    const initialScores: ScoreMap = {};
    criteria.forEach(criterion => {
      initialScores[criterion.id] = 3; // Default score
    });
    setSelfScores(initialScores);
    setLeaderScores({ ...initialScores, ...criteria.reduce((acc, c) => ({ ...acc, [c.id]: 4 }), {}) });
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  useEffect(() => {
    if (selectedEmployeeId) {
      setConsensusScores({});
      setConsensusObservations({});
      initializeScores();
    }
  }, [selectedEmployeeId]);

  const handleConsensusChange = (criterionId: string, score: number): void => {
    setConsensusScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const handleSelfScoreChange = (criterionId: string, score: number): void => {
    setSelfScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const handleLeaderScoreChange = (criterionId: string, score: number): void => {
    setLeaderScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const handleObservationChange = (criterionId: string, observation: string): void => {
    setConsensusObservations(prev => ({
      ...prev,
      [criterionId]: observation
    }));
  };

  const getProgress = () => {
    const scoredItems = Object.keys(consensusScores).filter(key => consensusScores[key] > 0).length;
    return (scoredItems / criteria.length) * 100;
  };

  const handleSaveConsensus = (): void => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador');
      return;
    }

    const hasUnratedCriteria = criteria.some(criterion => 
      !consensusScores[criterion.id] || consensusScores[criterion.id] === 0
    );

    if (hasUnratedCriteria) {
      toast.error('Todos os critérios precisam ter uma nota de consenso');
      return;
    }

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
        observations: JSON.stringify(consensusObservations)
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
      .filter(score => score && score > 0);
    
    if (validScores.length === 0) return 0;
    
    const total = validScores.reduce((sum, score) => sum + score, 0);
    return total / validScores.length;
  };

  const calculateOverallAverage = (): number => {
    const technical = calculateCategoryAverage('Técnica');
    const behavioral = calculateCategoryAverage('Comportamental');
    const organizational = calculateCategoryAverage('Organizacional');
    
    return (technical * 0.4) + (behavioral * 0.3) + (organizational * 0.3);
  };

  const generateMatrix = (): void => {
    setShowMatrix(true);
    toast.success('Matriz 9-Box gerada com sucesso!');
  };

  const ScoreButton = ({ score, isSelected, onClick }: { 
    score: number; 
    isSelected: boolean; 
    onClick: (score: number) => void;
  }) => (
    <button
      onClick={() => onClick(score)}
      className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
        isSelected 
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg ring-2 ring-primary-300 dark:ring-primary-600 ring-offset-2 dark:ring-offset-gray-800' 
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 shadow-sm'
      }`}
      title={`Selecionar nota ${score}`}
      aria-label={`Nota ${score} ${isSelected ? '(selecionada)' : ''}`}
    >
      {score}
    </button>
  );

  const EditableScoreIndicator = ({ 
    score, 
    type, 
    onScoreChange, 
    criterionId 
  }: { 
    score: number; 
    type: 'self' | 'leader';
    onScoreChange: (criterionId: string, score: number) => void;
    criterionId: string;
  }) => {
    const config = {
      self: { 
        bg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700', 
        label: 'Autoavaliação',
        lightBg: 'bg-secondary-50 dark:bg-secondary-900/20',
        hoverBg: 'hover:bg-secondary-100 dark:hover:bg-secondary-800/30',
        borderColor: 'border-secondary-300 dark:border-secondary-600',
        focusRing: 'focus:ring-secondary-500 dark:focus:ring-secondary-400'
      },
      leader: { 
        bg: 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700', 
        label: 'Avaliação do Líder',
        lightBg: 'bg-primary-50 dark:bg-primary-900/20',
        hoverBg: 'hover:bg-primary-100 dark:hover:bg-primary-800/30',
        borderColor: 'border-primary-300 dark:border-primary-600',
        focusRing: 'focus:ring-primary-500 dark:focus:ring-primary-400'
      }
    };
    
    return (
      <div className="flex flex-col items-center space-y-4 w-32">
        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center h-10 flex items-center justify-center">{config[type].label}</h6>
        <div 
          className={`w-14 h-14 rounded-xl ${config[type].bg} flex items-center justify-center text-white text-xl font-bold shadow-lg dark:shadow-xl`}
          title={`${config[type].label}: ${score}`}
        >
          {score}
        </div>
        <div className="flex items-center space-x-1 justify-center">
          {[1, 2, 3, 4].map(scoreValue => (
            <button
              key={scoreValue}
              onClick={() => onScoreChange(criterionId, scoreValue)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 transform hover:scale-105 ${
                score === scoreValue
                  ? `${config[type].bg} text-white shadow-md ring-2 ring-offset-1 dark:ring-offset-gray-800 ${type === 'self' ? 'ring-secondary-300 dark:ring-secondary-600' : 'ring-primary-300 dark:ring-primary-600'}`
                  : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${config[type].hoverBg} border border-gray-200 dark:border-gray-600 ${config[type].borderColor}`
              }`}
              title={`${config[type].label}: ${scoreValue}`}
            >
              {scoreValue}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const progress = getProgress();

  // Group criteria by category
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, Criterion[]>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <Handshake className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 dark:text-primary-400 mr-3" />
                Reunião de Consenso
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Definição colaborativa das notas finais</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Progresso</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{Math.round(progress)}%</p>
            </div>
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" className="dark:stroke-gray-700" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#consensusGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="consensusGradient">
                    <stop offset="0%" stopColor="#12b0a0" />
                    <stop offset="50%" stopColor="#1e6076" />
                    <stop offset="100%" stopColor="#baa673" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o Colaborador
            </label>
            <select
              className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Escolha um colaborador...</option>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Cargo
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                  {selectedEmployee.position}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Criteria by Category */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <>
            {Object.entries(groupedCriteria).map(([category, categoryCriteria], categoryIndex) => {
              const config = categoryConfig[category as keyof typeof categoryConfig];
              const categoryProgress = categoryCriteria.filter(c => consensusScores[c.id] > 0).length / categoryCriteria.length * 100;
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className={`px-4 sm:px-8 py-4 sm:py-6 ${config.bgColor} border-b ${config.borderColor}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${config.gradient} shadow-md dark:shadow-lg`}>
                          {(() => {
                            const Icon = categoryCriteria[0].icon;
                            return <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
                          })()}
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{category}</h2>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {categoryCriteria.filter(c => consensusScores[c.id] > 0).length} de {categoryCriteria.length} critérios definidos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-300`}
                            style={{ width: `${categoryProgress}%` }}
                          />
                        </div>
                        {categoryProgress === 100 && (
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {categoryCriteria.map((criterion) => {
                        const selfScore = selfScores[criterion.id] || 0;
                        const leaderScore = leaderScores[criterion.id] || 0;
                        const consensusScore = consensusScores[criterion.id] || 0;

                        return (
                          <div key={criterion.id} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-6 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200">
                            <div className="flex flex-col space-y-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-base">{criterion.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{criterion.description}</p>
                              </div>
                              
                              <div className="flex flex-col space-y-6">
                                {/* Avaliações Auto e Líder */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                      <Sparkles className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                      Avaliações
                                    </h5>
                                  </div>
                                  <div className="flex items-start justify-center space-x-8">
                                    <EditableScoreIndicator 
                                      score={selfScore} 
                                      type="self" 
                                      onScoreChange={handleSelfScoreChange}
                                      criterionId={criterion.id}
                                    />
                                    <div className="h-24 w-px bg-gray-300 dark:bg-gray-600 mt-14"></div>
                                    <EditableScoreIndicator 
                                      score={leaderScore} 
                                      type="leader" 
                                      onScoreChange={handleLeaderScoreChange}
                                      criterionId={criterion.id}
                                    />
                                  </div>
                                </div>

                                {/* Consenso */}
                                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-700">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                      <Handshake className="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400" />
                                      Nota de Consenso
                                    </h5>
                                    {consensusScore > 0 && (
                                      <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Definido</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-center space-x-3">
                                    {[1, 2, 3, 4].map(score => (
                                      <ScoreButton
                                        key={score}
                                        score={score}
                                        isSelected={consensusScore === score}
                                        onClick={(selectedScore: number) => handleConsensusChange(criterion.id, selectedScore)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Campo de Observações */}
                            <div className="mt-3">
                              <label className="flex items-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Observações
                              </label>
                              <textarea
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                rows={2}
                                placeholder="Adicione observações sobre esta competência..."
                                value={consensusObservations[criterion.id] || ''}
                                onChange={(e) => handleObservationChange(criterion.id, e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Score Summary */}
            {Object.keys(consensusScores).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-primary-100 dark:border-gray-700 p-4 sm:p-8"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Resumo do Consenso
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-primary-200 dark:border-primary-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Técnicas</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{calculateCategoryAverage('Técnica').toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 40%</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-secondary-200 dark:border-secondary-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Comportamentais</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-secondary-600 dark:text-secondary-400">{calculateCategoryAverage('Comportamental').toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 30%</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-accent-200 dark:border-accent-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Organizacionais</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">{calculateCategoryAverage('Organizacional').toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 30%</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-500 to-secondary-600 dark:from-primary-600 dark:to-secondary-700 p-4 sm:p-6 rounded-xl text-white">
                    <h4 className="text-xs sm:text-sm font-medium text-primary-100 dark:text-primary-200 mb-1">Nota Final</h4>
                    <p className="text-2xl sm:text-3xl font-bold">{calculateOverallAverage().toFixed(1)}</p>
                    <p className="text-xs text-primary-100 dark:text-primary-200 mt-1">Média Ponderada</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
            >
              <div className="flex items-center space-x-2 text-sm">
                {progress < 100 ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Complete todas as avaliações para finalizar
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Consenso completo!
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="secondary"
                  onClick={handleSaveConsensus}
                  icon={<Save size={18} />}
                  size="lg"
                  disabled={progress < 100}
                >
                  Salvar Consenso
                </Button>
                <Button
                  variant="primary"
                  onClick={generateMatrix}
                  icon={<BarChart3 size={18} />}
                  size="lg"
                  disabled={progress < 100}
                >
                  Gerar Matriz 9-Box
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 mb-6">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              Selecione um colaborador acima para iniciar a reunião de consenso
            </p>
          </div>
        </motion.div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMatrix(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl dark:shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Matriz 9-Box Gerada!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                  O colaborador {selectedEmployee?.name} foi posicionado na matriz 9-Box com base no consenso estabelecido.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowMatrix(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/nine-box')}
                  >
                    Ver Matriz
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Consensus;