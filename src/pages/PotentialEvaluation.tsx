import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Info,
  Rocket,
  TrendingUp,
  BookOpen,
  Building,
  Eye,
  Calendar,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

interface PotentialCriterion {
  id: string;
  title: string;
  description: string;
  score?: number;
  icon: React.ElementType;
}

const PotentialEvaluation = () => {
  const navigate = useNavigate();
  const { employees, saveEvaluation } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [criteria, setCriteria] = useState<PotentialCriterion[]>([
    {
      id: 'subsequent-function',
      title: 'Potencial para função subsequente',
      description: 'O que você enxerga como potencial máximo deste parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o desempenho e a motivação sustentados até hoje?',
      icon: Rocket
    },
    {
      id: 'continuous-learning',
      title: 'Aprendizado contínuo',
      description: 'Sobre o aprendizado contínuo: percebe que este busca o desenvolvimento pessoal, profissional e o aprimoramento de seus conhecimentos técnicos e acadêmicos.',
      icon: BookOpen
    },
    {
      id: 'cultural-alignment',
      title: 'Alinhamento com Código Cultural',
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da TOP Construtora e Incorporadora.',
      icon: Building
    },
    {
      id: 'systemic-vision',
      title: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
      icon: Eye
    }
  ]);

  const legend = [
    { value: 1, label: 'Não atende o esperado', color: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { value: 2, label: 'Em desenvolvimento', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { value: 3, label: 'Atende ao esperado', color: 'bg-primary-500', bgColor: 'bg-primary-50', borderColor: 'border-primary-200' },
    { value: 4, label: 'Supera', color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
  ];

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(criterion => 
      criterion.id === id ? { ...criterion, score } : criterion
    ));
  };

  const getProgress = () => {
    const scoredItems = criteria.filter(c => c.score !== undefined).length;
    return (scoredItems / criteria.length) * 100;
  };

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }

    const hasUnratedCriteria = criteria.some(c => c.score === undefined);
    if (hasUnratedCriteria) {
      toast.error('Avalie todos os critérios antes de salvar');
      return;
    }

    const averageScore = criteria.reduce((sum, criterion) => sum + (criterion.score || 0), 0) / criteria.length;

    const potentialCriteria = criteria.map(criterion => ({
      id: criterion.id,
      name: criterion.title,
      description: criterion.description,
      category: 'potential' as 'technical' | 'behavioral' | 'deliveries',
      score: criterion.score!
    }));

    const evaluation = {
      id: `potential-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      criteria: potentialCriteria,
      feedback: {
        strengths: 'Avaliação de potencial concluída',
        improvements: '',
        observations: `Avaliação de potencial - Média: ${averageScore.toFixed(1)}`
      },
      technicalScore: averageScore,
      behavioralScore: 0,
      deliveriesScore: 0,
      finalScore: averageScore,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação de Potencial salva com sucesso!');
    navigate('/');
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const progress = getProgress();
  const averageScore = criteria.reduce((sum, criterion) => sum + (criterion.score || 0), 0) / criteria.filter(c => c.score).length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full lg:w-auto">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 mr-2 sm:mr-3" />
                <span className="break-words">Avaliação de Potencial</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                Identifique o potencial de crescimento do colaborador
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">Progresso</p>
              <p className="text-base sm:text-lg font-bold text-gray-800">{Math.round(progress)}%</p>
            </div>
            <div className="relative">
              <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#baa673" />
                    <stop offset="100%" stopColor="#12b0a0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Colaborador
            </label>
            <select
              className="w-full rounded-lg sm:rounded-xl border-gray-200 shadow-sm focus:border-accent-500 focus:ring-accent-500 text-gray-700"
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
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base">
                  {selectedEmployee.position}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent-600" />
              Escala de Avaliação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {legend.map((item) => (
                <div key={item.value} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${item.bgColor} ${item.borderColor} border-2`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-base sm:text-lg font-bold ${item.color} text-white`}>
                      {item.value}
                    </span>
                    <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 break-words">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation Criteria */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {criteria.map((criterion, index) => {
              const IconComponent = criterion.icon;
              
              return (
                <motion.div
                  key={criterion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className={`p-4 sm:p-6 ${criterion.score ? legend[criterion.score - 1].bgColor : 'bg-gray-50'} border-b ${criterion.score ? legend[criterion.score - 1].borderColor : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${criterion.score ? legend[criterion.score - 1].color : 'bg-gray-400'} shadow-md flex-shrink-0 self-start`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 break-words">
                            {index + 1}. {criterion.title}
                          </h3>
                          {criterion.score && (
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${legend[criterion.score - 1].color} text-white self-start sm:self-auto`}>
                              {legend[criterion.score - 1].label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 mt-2">
                          {criterion.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                      {[1, 2, 3, 4].map((rating) => {
                        const ratingInfo = legend[rating - 1];
                        return (
                          <button
                            key={rating}
                            onClick={() => handleScoreChange(criterion.id, rating)}
                            className={`flex-1 max-w-none sm:max-w-[140px] p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                              criterion.score === rating
                                ? `${ratingInfo.color} text-white border-transparent shadow-lg transform scale-105`
                                : `${ratingInfo.bgColor} ${ratingInfo.borderColor} hover:shadow-md bg-white`
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{rating}</div>
                              <div className="text-xs font-medium break-words">
                                {ratingInfo.label}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Summary */}
      <AnimatePresence>
        {selectedEmployeeId && criteria.some(c => c.score) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl sm:rounded-2xl shadow-sm border border-accent-100 p-4 sm:p-6 lg:p-8"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-600" />
              Análise de Potencial
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-accent-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Média Geral</h4>
                <p className="text-2xl sm:text-3xl font-bold text-accent-600">{averageScore.toFixed(1)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-accent-500 to-accent-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(averageScore / 4) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-primary-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Critérios Avaliados</h4>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600">{criteria.filter(c => c.score).length}/{criteria.length}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {criteria.filter(c => c.score).length === criteria.length ? 'Avaliação completa' : 'Em andamento'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-accent-500 to-primary-600 p-4 sm:p-6 rounded-lg sm:rounded-xl text-white sm:col-span-2 lg:col-span-1">
                <h4 className="text-sm font-medium text-accent-100 mb-2">Classificação</h4>
                <p className="text-xl sm:text-2xl font-bold break-words">
                  {averageScore >= 3.5 ? 'Alto Potencial' : 
                   averageScore >= 2.5 ? 'Potencial Médio' : 
                   averageScore >= 1.5 ? 'Potencial em Desenvolvimento' : 
                   'Necessita Desenvolvimento'}
                </p>
                <p className="text-xs text-accent-100 mt-2">
                  Baseado na média das avaliações
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-2 text-sm order-2 sm:order-1">
              {progress < 100 ? (
                <>
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <span className="text-gray-600 text-center sm:text-left">
                    Complete todas as avaliações para salvar
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    Todos os critérios foram avaliados!
                  </span>
                </>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleSave}
              icon={<Save size={18} />}
              size="lg"
              disabled={progress < 100}
              className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 w-full sm:w-auto order-1 sm:order-2"
            >
              Salvar Avaliação de Potencial
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 lg:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 mb-4 sm:mb-6">
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-accent-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Selecione um colaborador acima para iniciar a avaliação de potencial
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PotentialEvaluation;