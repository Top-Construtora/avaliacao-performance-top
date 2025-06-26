import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
  User,
  ArrowRight,
  Zap,
  Lightbulb,
  HeartHandshake,
  Info,
  Rocket,
  BookOpen,
  Building,
  Eye
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  weight: number;
  items: CompetencyItem[];
  expanded: boolean;
  icon: React.ElementType;
  gradient: string;
  darkGradient: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
}

interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface PotentialItem {
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

interface PotentialScores {
  results: number;
  agility: number;
  relationships: number;
  final: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  department?: string;
  is_leader: boolean;
  is_director: boolean;
  active: boolean;
  reports_to?: string;
}

const LeaderEvaluation = () => {
  const navigate = useNavigate();
  const { saveEvaluation } = useEvaluation();
  const { profile } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Competências, 2: Potencial
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buscar subordinados do Supabase
  useEffect(() => {
    const fetchSubordinates = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        let query = supabase.from('users').select('*');
        
        if (profile.is_director) {
          // Diretores veem todos os usuários ativos (exceto eles mesmos e outros diretores)
          query = query
            .eq('active', true)
            .eq('is_director', false)
            .neq('id', profile.id);
        } else if (profile.is_leader) {
          // Líderes veem apenas seus subordinados diretos
          query = query
            .eq('active', true)
            .eq('reports_to', profile.id);
        } else {
          // Colaboradores não veem ninguém
          setSubordinates([]);
          setLoading(false);
          return;
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar subordinados:', error);
          toast.error('Erro ao carregar subordinados');
        } else {
          console.log('Subordinados encontrados:', data);
          setSubordinates(data || []);
        }
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchSubordinates();
  }, [profile]);
  
  const [scores, setScores] = useState<Scores>({
    technical: 0,
    behavioral: 0,
    organizational: 0,
    final: 0
  });

  const [potentialScores, setPotentialScores] = useState<PotentialScores>({
    results: 0,
    agility: 0,
    relationships: 0,
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
      darkGradient: 'dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50',
      darkBgColor: 'dark:bg-primary-900/20',
      borderColor: 'border-primary-200',
      darkBorderColor: 'dark:border-primary-700',
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
      darkGradient: 'dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50',
      darkBgColor: 'dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200',
      darkBorderColor: 'dark:border-secondary-700',
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
      darkGradient: 'dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50',
      darkBgColor: 'dark:bg-accent-900/20',
      borderColor: 'border-accent-200',
      darkBorderColor: 'dark:border-accent-700',
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

  const [potentialItems, setPotentialItems] = useState<PotentialItem[]>([
    {
      id: 'pot1',
      name: 'Potencial para função subsequente',
      description: 'O que você enxerga como potencial máximo deste parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o desempenho e a motivação sustentados até hoje?',
      score: undefined
    },
    {
      id: 'pot2',
      name: 'Aprendizado contínuo',
      description: 'Sobre o aprendizado contínuo: percebo que este busca o desenvolvimento pessoal, profissional e o aprimoramento de seus conhecimentos técnicos e acadêmicos.',
      score: undefined
    },
    {
      id: 'pot3',
      name: 'Alinhamento com Código Cultural',
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da TOP Construtora e Incorporadora.',
      score: undefined
    },
    {
      id: 'pot4',
      name: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
      score: undefined
    }
  ]);

  const ratingLabels = {
    1: { label: 'Insatisfatório', color: 'bg-red-500', darkColor: 'dark:bg-red-600' },
    2: { label: 'Em Desenvolvimento', color: 'bg-yellow-500', darkColor: 'dark:bg-yellow-600' },
    3: { label: 'Satisfatório', color: 'bg-primary-500', darkColor: 'dark:bg-primary-600' },
    4: { label: 'Excepcional', color: 'bg-green-500', darkColor: 'dark:bg-green-600' }
  };

  const potentialRatingLabels = {
    1: { label: 'Não atende o esperado', color: 'bg-red-500', darkColor: 'dark:bg-red-600' },
    2: { label: 'Em desenvolvimento', color: 'bg-yellow-500', darkColor: 'dark:bg-yellow-600' },
    3: { label: 'Atende ao esperado', color: 'bg-primary-500', darkColor: 'dark:bg-primary-600' },
    4: { label: 'Supera', color: 'bg-green-500', darkColor: 'dark:bg-green-600' }
  };

  // Calculate scores whenever ratings change
  useEffect(() => {
    calculateScores();
  }, [sections]);

  useEffect(() => {
    calculatePotentialScores();
  }, [potentialItems]);

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

  const calculatePotentialScores = () => {
    const scores = potentialItems.filter(item => item.score !== undefined).map(item => item.score || 0);
    
    if (scores.length > 0) {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      const newScores: PotentialScores = {
        results: potentialItems[0]?.score || 0, // Potencial para função subsequente
        agility: potentialItems[1]?.score || 0, // Aprendizado contínuo
        relationships: ((potentialItems[2]?.score || 0) + (potentialItems[3]?.score || 0)) / 2, // Média de Alinhamento Cultural e Visão Sistêmica
        final: average
      };
      
      setPotentialScores(newScores);
    }
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

  const handlePotentialScoreChange = (itemId: string, score: number) => {
    setPotentialItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, score } : item
    ));
  };

  const getProgress = () => {
    if (currentStep === 1) {
      const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
      const scoredItems = sections.reduce(
        (acc, section) => acc + section.items.filter(item => item.score !== undefined).length, 
        0
      );
      return totalItems > 0 ? (scoredItems / totalItems) * 100 : 0;
    } else {
      const scoredItems = potentialItems.filter(item => item.score !== undefined).length;
      return potentialItems.length > 0 ? (scoredItems / potentialItems.length) * 100 : 0;
    }
  };

  const canProceedToStep2 = () => {
    return sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      evaluatorId: profile?.id || 'unknown',
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
      isDraft: true,
      // Adicionar dados de potencial se estiverem preenchidos
      potential: {
        items: potentialItems.filter(item => item.score !== undefined).map(item => ({
          id: item.id,
          name: item.name,
          score: item.score!
        })),
        scores: potentialScores
      }
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação salva como rascunho');
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }
    
    const allCompetenciesScored = sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );

    const allPotentialScored = potentialItems.every(item => item.score !== undefined);

    if (!allCompetenciesScored || !allPotentialScored) {
      toast.error('Complete todas as avaliações antes de enviar');
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
      evaluatorId: profile?.id || 'unknown',
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
      isDraft: false,
      // Dados de potencial completos
      potential: {
        items: potentialItems.map(item => ({
          id: item.id,
          name: item.name,
          score: item.score!
        })),
        scores: potentialScores
      }
    };

    saveEvaluation(evaluation);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);
  const progress = getProgress();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Avaliação do Líder</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {currentStep === 1 ? 'Etapa 1: Avalie as competências' : 'Etapa 2: Avalie o potencial'}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Progresso</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{Math.round(progress)}%</p>
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
                  className="sm:hidden dark:stroke-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                  className="hidden sm:block dark:stroke-gray-700"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o Colaborador
            </label>
            <div className="relative">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 text-sm sm:text-base appearance-none text-gray-700 dark:text-gray-200"
              >
                <option value="">Escolha um colaborador...</option>
                {loading ? (
                  <option value="" disabled>Carregando...</option>
                ) : subordinates.length === 0 ? (
                  <option value="" disabled>Nenhum colaborador subordinado</option>
                ) : (
                  subordinates.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))
                )}
              </select>
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {subordinates.length === 0 && !loading && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {profile?.is_leader && !profile?.is_director 
                  ? "Você não possui colaboradores subordinados para avaliar."
                  : "Entre em contato com o RH para verificar suas permissões."}
              </p>
            )}
          </div>

          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Cargo
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                  {selectedEmployee.position}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Departamento
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                  {selectedEmployee.department || 'Não definido'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Step Indicators */}
        {selectedEmployeeId && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Competências</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Potencial</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Step 1: Competencies Evaluation */}
      <AnimatePresence mode="wait">
        {selectedEmployeeId && currentStep === 1 && (
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
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${section.bgColor} ${section.darkBgColor} border-b ${section.borderColor} ${section.darkBorderColor} flex items-center justify-between hover:opacity-90 transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${section.gradient} ${section.darkGradient} shadow-md dark:shadow-lg flex-shrink-0`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex flex-col sm:flex-row sm:items-center">
                          <span className="truncate">{section.title}</span>
                          <span className={`mt-1 sm:mt-0 sm:ml-3 text-xs font-medium px-2 py-1 rounded-full ${section.bgColor} ${section.darkBgColor} text-gray-700 dark:text-gray-200 flex-shrink-0`}>
                            Peso {section.weight}%
                          </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {section.items.filter(item => item.score !== undefined).length} de {section.items.length} competências avaliadas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                      <div className="w-16 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${section.gradient} ${section.darkGradient} transition-all duration-300`}
                          style={{ width: `${sectionProgress}%` }}
                        />
                      </div>
                      {section.expanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
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
                                <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                              </div>
                              {item.score && (
                                <div className="text-center sm:text-right flex-shrink-0">
                                  <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${ratingLabels[item.score as keyof typeof ratingLabels].color} ${ratingLabels[item.score as keyof typeof ratingLabels].darkColor} text-white`}>
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
                                        ? `${ratingInfo.color} ${ratingInfo.darkColor} text-white border-transparent shadow-lg transform scale-105`
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
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
              className="bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-primary-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-600 dark:text-primary-400" />
                Resumo das Notas - Competências
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-primary-200 dark:border-primary-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Técnicas</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{scores.technical.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 50%</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.technical / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-secondary-200 dark:border-secondary-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Comportamentais</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-600 dark:text-secondary-400">{scores.behavioral.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 30%</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.behavioral / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-accent-200 dark:border-accent-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Organizacionais</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">{scores.organizational.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 20%</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scores.organizational / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary-500 to-secondary-600 dark:from-primary-600 dark:to-secondary-700 p-4 sm:p-6 rounded-xl text-white">
                  <h4 className="text-sm font-medium text-primary-100 dark:text-primary-200 mb-1">Nota Final</h4>
                  <p className="text-2xl sm:text-3xl font-bold">{scores.final.toFixed(1)}</p>
                  <p className="text-xs text-primary-100 dark:text-primary-200 mt-1">Média Ponderada</p>
                  <div className="flex items-center mt-3">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {scores.final >= 3.5 ? 'Excelente' : scores.final >= 2.5 ? 'Bom' : scores.final >= 1.5 ? 'Regular' : 'Necessita Melhoria'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 1 Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
            >
              <div className="flex items-center space-x-2 text-sm">
                {!canProceedToStep2() ? (
                  <>
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Complete todas as competências para prosseguir
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Competências avaliadas! Prossiga para avaliar o potencial.
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
                  onClick={handleNextStep}
                  icon={<ArrowRight size={18} />}
                  size="lg"
                  disabled={!canProceedToStep2()}
                  className="w-full sm:w-auto"
                >
                  Próxima Etapa
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {/* Step 2: Potential Evaluation */}
        {selectedEmployeeId && currentStep === 2 && (
          <>
            {/* Evaluation Criteria */}
            <div className="space-y-4 sm:space-y-6">
              {potentialItems.map((item, index) => {
                const iconMap: { [key: string]: React.ElementType } = {
                  'pot1': Rocket,
                  'pot2': BookOpen,
                  'pot3': Building,
                  'pot4': Eye
                };
                const IconComponent = iconMap[item.id];
                
                // Define cores para cada item de potencial
                const colorMap: { [key: string]: any } = {
                  'pot1': {
                    gradient: 'from-primary-500 to-primary-600',
                    darkGradient: 'dark:from-primary-600 dark:to-primary-700',
                    bgColor: 'bg-primary-50',
                    darkBgColor: 'dark:bg-primary-900/20',
                    borderColor: 'border-primary-200',
                    darkBorderColor: 'dark:border-primary-700'
                  },
                  'pot2': {
                    gradient: 'from-secondary-500 to-secondary-600',
                    darkGradient: 'dark:from-secondary-600 dark:to-secondary-700',
                    bgColor: 'bg-secondary-50',
                    darkBgColor: 'dark:bg-secondary-900/20',
                    borderColor: 'border-secondary-200',
                    darkBorderColor: 'dark:border-secondary-700'
                  },
                  'pot3': {
                    gradient: 'from-accent-500 to-accent-600',
                    darkGradient: 'dark:from-accent-600 dark:to-accent-700',
                    bgColor: 'bg-accent-50',
                    darkBgColor: 'dark:bg-accent-900/20',
                    borderColor: 'border-accent-200',
                    darkBorderColor: 'dark:border-accent-700'
                  },
                  'pot4': {
                    gradient: 'from-gray-500 to-gray-600',
                    darkGradient: 'dark:from-gray-600 dark:to-gray-700',
                    bgColor: 'bg-gray-50',
                    darkBgColor: 'dark:bg-gray-900/20',
                    borderColor: 'border-gray-200',
                    darkBorderColor: 'dark:border-gray-700'
                  }
                };
                
                const colors = colorMap[item.id];
                
                const legend = [
                  { value: 1, color: 'bg-red-500', darkColor: 'dark:bg-red-600', bgColor: 'bg-red-50', darkBgColor: 'dark:bg-red-900/20', borderColor: 'border-red-200', darkBorderColor: 'dark:border-red-700' },
                  { value: 2, color: 'bg-yellow-500', darkColor: 'dark:bg-yellow-600', bgColor: 'bg-yellow-50', darkBgColor: 'dark:bg-yellow-900/20', borderColor: 'border-yellow-200', darkBorderColor: 'dark:border-yellow-700' },
                  { value: 3, color: 'bg-primary-500', darkColor: 'dark:bg-primary-600', bgColor: 'bg-primary-50', darkBgColor: 'dark:bg-primary-900/20', borderColor: 'border-primary-200', darkBorderColor: 'dark:border-primary-700' },
                  { value: 4, color: 'bg-green-500', darkColor: 'dark:bg-green-600', bgColor: 'bg-green-50', darkBgColor: 'dark:bg-green-900/20', borderColor: 'border-green-200', darkBorderColor: 'dark:border-green-700' }
                ];
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className={`p-4 sm:p-6 ${colors.bgColor} ${colors.darkBgColor} border-b ${colors.borderColor} ${colors.darkBorderColor}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${colors.gradient} ${colors.darkGradient} shadow-md dark:shadow-lg flex-shrink-0 self-start`}>
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 break-words">
                              {index + 1}. {item.name}
                            </h3>
                            {item.score && (
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].color} ${potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].darkColor} text-white self-start sm:self-auto`}>
                                {potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[1, 2, 3, 4].map((rating) => {
                          const ratingInfo = potentialRatingLabels[rating as keyof typeof potentialRatingLabels];
                          return (
                            <button
                              key={rating}
                              onClick={() => handlePotentialScoreChange(item.id, rating)}
                              className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl border-2 transition-all duration-200 ${
                                item.score === rating
                                  ? `${ratingInfo.color} ${ratingInfo.darkColor} text-white border-transparent shadow-lg transform scale-105`
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
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
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Potential Score Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-accent-50 to-primary-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-accent-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-600 dark:text-accent-400" />
                Análise de Potencial
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-accent-200 dark:border-accent-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Média Geral</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">{potentialScores.final.toFixed(1)}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(potentialScores.final / 4) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-primary-200 dark:border-primary-700">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Critérios Avaliados</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{potentialItems.filter(c => c.score).length}/{potentialItems.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {potentialItems.filter(c => c.score).length === potentialItems.length ? 'Avaliação completa' : 'Em andamento'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-accent-500 to-primary-600 dark:from-accent-600 dark:to-primary-700 p-4 sm:p-6 rounded-lg sm:rounded-xl text-white sm:col-span-2 lg:col-span-1">
                  <h4 className="text-sm font-medium text-accent-100 dark:text-accent-200 mb-2">Classificação</h4>
                  <p className="text-xl sm:text-2xl font-bold break-words">
                    {potentialScores.final >= 3.5 ? 'Alto Potencial' : 
                     potentialScores.final >= 2.5 ? 'Potencial Médio' : 
                     potentialScores.final >= 1.5 ? 'Potencial em Desenvolvimento' : 
                     'Necessita Desenvolvimento'}
                  </p>
                  <p className="text-xs text-accent-100 dark:text-accent-200 mt-2">
                    Baseado na média das avaliações
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
            >
              <div className="flex items-center space-x-2 text-sm">
                {potentialItems.some(item => item.score === undefined) ? (
                  <>
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Complete todas as avaliações de potencial para enviar
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Avaliação completa! Pronto para enviar.
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  icon={<ArrowLeft size={18} />}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  icon={<Save size={18} />}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  icon={<Send size={18} />}
                  size="lg"
                  disabled={potentialItems.some(item => item.score === undefined)}
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
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-secondary-100 to-primary-100 dark:from-secondary-900/20 dark:to-primary-900/20 mb-4 sm:mb-6">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-600 dark:text-secondary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {subordinates.length === 0 && !loading ? 'Nenhum subordinado disponível' : 'Nenhum colaborador selecionado'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {subordinates.length === 0 && !loading
                ? profile?.is_leader && !profile?.is_director 
                  ? 'Você não possui colaboradores subordinados para avaliar.'
                  : 'Entre em contato com o RH para verificar suas permissões.'
                : 'Selecione um colaborador acima para iniciar a avaliação de desempenho'}
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
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 text-center shadow-xl dark:shadow-2xl"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <CheckCircle className="h-6 w-6 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Avaliação Enviada!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                A avaliação foi registrada com sucesso no sistema.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
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