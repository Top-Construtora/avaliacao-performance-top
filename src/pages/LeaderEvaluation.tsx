import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  ArrowLeft,
  Star,
  Users,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Briefcase,
  Calendar,
  User
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  weight: number;
  items: CompetencyItem[];
  expanded: boolean;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  borderColor: string;
}

interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface Scores {
  technical: number;
  behavioral: number;
  organizational: number;
  final: number;
}

const LeaderEvaluation = () => {
  const navigate = useNavigate();
  const { employees, saveEvaluation } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [scores, setScores] = useState<Scores>({
    technical: 0,
    behavioral: 0,
    organizational: 0,
    final: 0
  });
  
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'technical',
      title: 'Competências Técnicas',
      weight: 50,
      expanded: true,
      icon: Target,
      gradient: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      items: [
        { 
          id: 'tech1', 
          name: 'Gestão de Conhecimento',
          description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes',
          score: undefined 
        },
        { 
          id: 'tech2', 
          name: 'Segurança e Resultados',
          description: 'Foco em segurança do trabalho e entrega de resultados com qualidade',
          score: undefined 
        },
        { 
          id: 'tech3', 
          name: 'Pensamento Crítico',
          description: 'Habilidade de analisar situações e tomar decisões fundamentadas',
          score: undefined 
        },
        { 
          id: 'tech4', 
          name: 'Assertiva e Provedora',
          description: 'Comunicação clara e capacidade de prover soluções efetivas',
          score: undefined 
        }
      ]
    },
    {
      id: 'behavioral',
      title: 'Competências Comportamentais',
      weight: 30,
      expanded: false,
      icon: Users,
      gradient: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      items: [
        { 
          id: 'beh1', 
          name: 'Comunicação',
          description: 'Capacidade de transmitir informações de forma clara e eficaz',
          score: undefined 
        },
        { 
          id: 'beh2', 
          name: 'Inteligência Emocional',
          description: 'Habilidade de gerenciar emoções próprias e compreender as dos outros',
          score: undefined 
        },
        { 
          id: 'beh3', 
          name: 'Delegação',
          description: 'Capacidade de distribuir tarefas adequadamente e empoderar a equipe',
          score: undefined 
        },
        { 
          id: 'beh4', 
          name: 'Patrimonialista',
          description: 'Cuidado e responsabilidade com os recursos da empresa',
          score: undefined 
        }
      ]
    },
    {
      id: 'organizational',
      title: 'Competências Organizacionais',
      weight: 20,
      expanded: false,
      icon: Briefcase,
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      items: [
        { 
          id: 'org1', 
          name: 'Meritocracia e Missão Compartilhada',
          description: 'Reconhecimento por mérito e alinhamento com os valores da empresa',
          score: undefined 
        },
        { 
          id: 'org2', 
          name: 'Espiral de Passos',
          description: 'Desenvolvimento contínuo e progressão estruturada',
          score: undefined 
        },
        { 
          id: 'org3', 
          name: 'Planilhas e Prazos',
          description: 'Organização, controle e cumprimento de prazos estabelecidos',
          score: undefined 
        },
        { 
          id: 'org4', 
          name: 'Relações Construtivas',
          description: 'Construção de relacionamentos positivos e produtivos',
          score: undefined 
        }
      ]
    }
  ]);

  const ratingLabels = {
    1: { label: 'Insatisfatório', color: 'bg-red-500' },
    2: { label: 'Em Desenvolvimento', color: 'bg-yellow-500' },
    3: { label: 'Satisfatório', color: 'bg-primary-500' },
    4: { label: 'Excepcional', color: 'bg-green-500' }
  };

  // Calculate scores whenever ratings change
  useEffect(() => {
    calculateScores();
  }, [sections]);

  const calculateScores = () => {
    const newScores: Scores = { technical: 0, behavioral: 0, organizational: 0, final: 0 };
    
    sections.forEach(section => {
      const sectionScores = section.items.filter(item => item.score !== undefined).map(item => item.score || 0);
      if (sectionScores.length > 0) {
        const average = sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length;
        
        if (section.id === 'technical') newScores.technical = average;
        else if (section.id === 'behavioral') newScores.behavioral = average;
        else if (section.id === 'organizational') newScores.organizational = average;
      }
    });
    
    // Calculate final weighted score
    newScores.final = (
      (newScores.technical * 0.5) +
      (newScores.behavioral * 0.3) +
      (newScores.organizational * 0.2)
    );
    
    setScores(newScores);
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, expanded: !section.expanded } : section
    ));
  };

  const handleScoreChange = (sectionId: string, itemId: string, score: number) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, score } : item
            )
          }
        : section
    ));
  };

  const getProgress = () => {
    const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
    const scoredItems = sections.reduce(
      (acc, section) => acc + section.items.filter(item => item.score !== undefined).length, 
      0
    );
    return totalItems > 0 ? (scoredItems / totalItems) * 100 : 0;
  };

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }

    const allCriteria = sections.flatMap(section => 
      section.items
        .filter(item => item.score !== undefined)
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: (section.id === 'technical' ? 'technical' : 
                    section.id === 'behavioral' ? 'behavioral' : 'deliveries') as 'technical' | 'behavioral' | 'deliveries',
          score: item.score!
        }))
    );

    const evaluation = {
      id: `leader-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'in-progress' as const,
      criteria: allCriteria,
      feedback: {
        strengths: '',
        improvements: '',
        observations: ''
      },
      technicalScore: scores.technical,
      behavioralScore: scores.behavioral,
      deliveriesScore: scores.organizational,
      finalScore: scores.final,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: true
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação salva como rascunho');
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }
    
    const allScored = sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );

    if (!allScored) {
      toast.error('Avalie todas as competências antes de enviar');
      return;
    }

    const allCriteria = sections.flatMap(section => 
      section.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: (section.id === 'technical' ? 'technical' : 
                  section.id === 'behavioral' ? 'behavioral' : 'deliveries') as 'technical' | 'behavioral' | 'deliveries',
        score: item.score!
      }))
    );

    const evaluation = {
      id: `leader-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      criteria: allCriteria,
      feedback: {
        strengths: '',
        improvements: '',
        observations: ''
      },
      technicalScore: scores.technical,
      behavioralScore: scores.behavioral,
      deliveriesScore: scores.organizational,
      finalScore: scores.final,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false
    };

    saveEvaluation(evaluation);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const progress = getProgress();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Avaliação do Líder</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Avalie o desempenho dos seus colaboradores</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">Progresso</p>
              <p className="text-lg font-bold text-gray-800">{Math.round(progress)}%</p>
            </div>
            <div className="relative">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                  fill="none"
                  className="sm:hidden"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                  className="hidden sm:block"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${progress * 1.26} 126`}
                  strokeLinecap="round"
                  className="sm:hidden"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                  className="hidden sm:block"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#1e6076" />
                    <stop offset="100%" stopColor="#12b0a0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Colaborador
            </label>
            <select
              className="w-full rounded-xl border-gray-200 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 text-gray-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Cargo
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm">
                  {selectedEmployee.position}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Evaluation Sections */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <>
            {sections.map((section, sectionIndex) => {
              const IconComponent = section.icon;
              const sectionProgress = section.items.filter(item => item.score !== undefined).length / section.items.length * 100;
              
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${section.bgColor} border-b ${section.borderColor} flex items-center justify-between hover:opacity-90 transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${section.gradient} shadow-md flex-shrink-0`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center">
                          <span className="truncate">{section.title}</span>
                          <span className={`mt-1 sm:mt-0 sm:ml-3 text-xs font-medium px-2 py-1 rounded-full ${section.bgColor} text-gray-700 flex-shrink-0`}>
                            Peso {section.weight}%
                          </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {section.items.filter(item => item.score !== undefined).length} de {section.items.length} competências avaliadas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${section.gradient} transition-all duration-300`}
                          style={{ width: `${sectionProgress}%` }}
                        />
                      </div>
                      {section.expanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {section.expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
                      >
                        {section.items.map((item, itemIndex) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIndex * 0.05 }}
                            className="space-y-3 sm:space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                              <div className="flex-1 sm:mr-4">
                                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{item.name}</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                              {item.score && (
                                <div className="text-center sm:text-right flex-shrink-0">
                                  <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${ratingLabels[item.score as keyof typeof ratingLabels].color} text-white`}>
                                    {ratingLabels[item.score as keyof typeof ratingLabels].label}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                              {[1, 2, 3, 4].map((rating) => {
                                const ratingInfo = ratingLabels[rating as keyof typeof ratingLabels];
                                return (
                                  <button
                                    key={rating}
                                    onClick={() => handleScoreChange(section.id, item.id, rating)}
                                    className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl border-2 transition-all duration-200 ${
                                      item.score === rating
                                        ? `${ratingInfo.color} text-white border-transparent shadow-lg transform scale-105`
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                                    }`}
                                  >
                                    <div className="text-center">
                                      <div className="text-xl sm:text-2xl font-bold mb-1">{rating}</div>
                                      <div className="text-xs">
                                        {ratingInfo.label}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Score Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 rounded-xl sm:rounded-2xl shadow-sm border border-primary-100 p-4 sm:p-6 lg:p-8"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-600" />
                Resumo das Notas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-primary-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Técnicas</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600">{scores.technical.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">Peso 50%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.technical / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-secondary-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Comportamentais</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-600">{scores.behavioral.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">Peso 30%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.behavioral / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-accent-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Organizacionais</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-600">{scores.organizational.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">Peso 20%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-accent-500 to-accent-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.organizational / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-4 sm:p-6 rounded-xl text-white">
                  <h4 className="text-sm font-medium text-primary-100 mb-1">Nota Final</h4>
                  <p className="text-2xl sm:text-3xl font-bold">{scores.final.toFixed(1)}</p>
                  <p className="text-xs text-primary-100 mt-1">Média Ponderada</p>
                  <div className="flex items-center mt-3">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {scores.final >= 3.5 ? 'Excelente' : scores.final >= 2.5 ? 'Bom' : scores.final >= 1.5 ? 'Regular' : 'Necessita Melhoria'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
            >
              <div className="flex items-center space-x-2 text-sm">
                {progress < 100 ? (
                  <>
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                    <span className="text-gray-600">
                      Complete todas as avaliações para enviar
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-600 font-medium">
                      Todas as competências foram avaliadas!
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  icon={<Save size={18} />}
                  size="lg"
                  disabled={progress === 0}
                  className="w-full sm:w-auto"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  icon={<Send size={18} />}
                  size="lg"
                  disabled={progress < 100}
                  className="w-full sm:w-auto"
                >
                  Enviar Avaliação
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
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-secondary-100 to-primary-100 mb-4 sm:mb-6">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Selecione um colaborador acima para iniciar a avaliação de desempenho
            </p>
          </div>
        </motion.div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 text-center"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Avaliação Enviada!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                A avaliação foi registrada com sucesso no sistema.
              </p>
              <div className="text-sm text-gray-500">
                Redirecionando...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderEvaluation;