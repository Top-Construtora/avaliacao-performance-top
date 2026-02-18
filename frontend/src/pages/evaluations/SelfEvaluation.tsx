import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Brain,
  Wrench,
  Award,
  Plus,
  X,
  Save,
  ArrowLeft,
  ArrowRight,
  Target,
  CheckCircle,
  Info,
  Shield,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  Zap,
  Pen,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import Button from '../../components/Button';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';
import { evaluationService } from '../../services/evaluation.service';

interface SelfEvaluationData {
  conhecimentos: string[];
  ferramentas: string[];
  forcasInternas: string[];
  qualidades: string[];
}

interface CompetencyScore {
  [key: string]: number;
}

interface Section {
  id: keyof SelfEvaluationData;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  items: string[];
}

const SelfEvaluation = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { currentCycle, saveSelfEvaluation, checkExistingEvaluation, loading, deliveriesCriteria } = useEvaluation();

  // Controle de modo de visualização (igual ao Consenso)
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [existingEvaluationData, setExistingEvaluationData] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState<'toolkit' | 'competencies'>('toolkit');
  const [formData, setFormData] = useState<SelfEvaluationData>({
    conhecimentos: [''],
    ferramentas: [''],
    forcasInternas: [''],
    qualidades: ['']
  });
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['competencias-tecnicas', 'competencias-comportamentais', 'competencias-organizacionais']));
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [competencyCategories, setCompetencyCategories] = useState<any[]>([]);

  // Auto-save states
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRestoringData, setIsRestoringData] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Storage key for auto-save
  const getStorageKey = useCallback(() => {
    if (!currentCycle?.id || !user?.id) return null;
    return `self_evaluation_autosave_${currentCycle.id}_${user.id}`;
  }, [currentCycle?.id, user?.id]);

  // Check for existing evaluation (igual ao Consenso)
  useEffect(() => {
    const checkExisting = async () => {
      if (currentCycle && user) {
        try {
          const response = await evaluationService.getSelfEvaluations(user.id, currentCycle.id);

          if (response && response.length > 0) {
            const existingEval = response[0];
            setHasExistingEvaluation(true);
            setExistingEvaluationData(existingEval);
            setViewMode('view');
            setCurrentStep('competencies');

            // Preencher scores de competências
            if (existingEval.evaluation_competencies) {
              const scores: CompetencyScore = {};
              existingEval.evaluation_competencies.forEach((comp: any) => {
                scores[comp.criterion_name] = comp.score;
              });
              setCompetencyScores(scores);
            }

            // Preencher dados do toolkit
            setFormData({
              conhecimentos: existingEval.knowledge?.length > 0 ? existingEval.knowledge : [''],
              ferramentas: existingEval.tools?.length > 0 ? existingEval.tools : [''],
              forcasInternas: existingEval.strengths_internal?.length > 0 ? existingEval.strengths_internal : [''],
              qualidades: existingEval.qualities?.length > 0 ? existingEval.qualities : ['']
            });

            // Marcar seções como completas para exibição correta
            const completedSectionsSet = new Set<string>();
            if (existingEval.knowledge?.length > 0) completedSectionsSet.add('conhecimentos');
            if (existingEval.tools?.length > 0) completedSectionsSet.add('ferramentas');
            if (existingEval.strengths_internal?.length > 0) completedSectionsSet.add('forcasInternas');
            if (existingEval.qualities?.length > 0) completedSectionsSet.add('qualidades');
            setCompletedSections(completedSectionsSet);

            // Expandir todas as seções de competências no modo view
            setExpandedSections(new Set(['competencias-tecnicas', 'competencias-comportamentais', 'competencias-organizacionais']));
          } else {
            setHasExistingEvaluation(false);
            setExistingEvaluationData(null);
            setViewMode('edit');
          }
        } catch (error) {
          console.error('Erro ao verificar autoavaliação existente:', error);
          setHasExistingEvaluation(false);
          setExistingEvaluationData(null);
          setViewMode('edit');
        }
      }
    };
    checkExisting();
  }, [currentCycle, user]);

  // Auto-save: Restaurar dados do localStorage ao carregar (apenas se não houver avaliação existente)
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || hasExistingEvaluation || viewMode === 'view') return;

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setIsRestoringData(true);
        const parsed = JSON.parse(savedData);

        if (parsed.formData) {
          setFormData(parsed.formData);
          // Atualizar seções completas
          const completedSectionsSet = new Set<string>();
          Object.entries(parsed.formData).forEach(([key, values]) => {
            if ((values as string[]).some(v => v.trim() !== '')) {
              completedSectionsSet.add(key);
            }
          });
          setCompletedSections(completedSectionsSet);
        }

        if (parsed.competencyScores) {
          setCompetencyScores(parsed.competencyScores);
        }

        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }

        if (parsed.timestamp) {
          setLastSaved(new Date(parsed.timestamp));
        }

        toast.success('Dados restaurados automaticamente', {
          icon: '💾',
          duration: 3000
        });

        console.log('📝 Dados restaurados do auto-save:', {
          formData: !!parsed.formData,
          scores: Object.keys(parsed.competencyScores || {}).length,
          step: parsed.currentStep
        });
      } catch (error) {
        console.error('Erro ao restaurar auto-save:', error);
        localStorage.removeItem(storageKey);
      } finally {
        setIsRestoringData(false);
      }
    }
  }, [getStorageKey, hasExistingEvaluation, viewMode]);

  // Auto-save: Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || viewMode === 'view' || hasExistingEvaluation || isRestoringData) return;

    // Verificar se há dados para salvar
    const hasFormData = Object.values(formData).some(arr => arr.some(v => v.trim() !== ''));
    const hasScores = Object.keys(competencyScores).length > 0;

    if (hasFormData || hasScores) {
      const dataToSave = {
        formData,
        competencyScores,
        currentStep,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      console.log('💾 Auto-save realizado:', {
        formDataSections: Object.keys(formData).length,
        numScores: Object.keys(competencyScores).length,
        step: currentStep
      });
    }
  }, [formData, competencyScores, currentStep, getStorageKey, viewMode, hasExistingEvaluation, isRestoringData]);

  // Marcar como tendo alterações não salvas
  useEffect(() => {
    if (!isRestoringData && viewMode === 'edit') {
      setHasUnsavedChanges(true);
    }
  }, [formData, competencyScores, isRestoringData, viewMode]);

  // Limpar auto-save após salvar com sucesso
  const clearAutoSave = useCallback(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
      console.log('🗑️ Auto-save limpo após salvar com sucesso');
    }
  }, [getStorageKey]);

  // Validação em tempo real para toolkit
  const validateToolkitSection = useCallback((section: keyof SelfEvaluationData, values: string[]) => {
    const hasValidItem = values.some(v => v.trim() !== '');
    if (!hasValidItem) {
      setValidationErrors(prev => ({
        ...prev,
        [section]: 'Adicione pelo menos um item nesta seção'
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[section];
        return newErrors;
      });
    }
  }, []);

  // Initialize competency categories with dynamic organizational competencies
  useEffect(() => {
    // Usar deliveriesCriteria do contexto ou fallback para EVALUATION_COMPETENCIES.deliveries
    const organizationalCompetencies = deliveriesCriteria.length > 0
      ? deliveriesCriteria
      : EVALUATION_COMPETENCIES.deliveries;

    setCompetencyCategories([
      {
        id: 'competencias-tecnicas',
        title: 'Competências Técnicas',
        icon: Target,
        gradient: 'from-primary to-primary-700 dark:from-primary-600 dark:to-primary-700',
        bgColor: 'bg-primary-50 dark:bg-primary-600/20',
        borderColor: 'border-primary-200 dark:border-primary-700',
        items: EVALUATION_COMPETENCIES.technical.map(comp => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description
        }))
      },
      {
        id: 'competencias-comportamentais',
        title: 'Competências Comportamentais',
        icon: Users,
        gradient: 'from-gray-600 to-gray-700 dark:from-gray-600 dark:to-gray-700',
        bgColor: 'bg-gray-50 dark:bg-gray-800/20',
        borderColor: 'border-gray-200 dark:border-gray-700',
        items: EVALUATION_COMPETENCIES.behavioral.map(comp => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description
        }))
      },
      {
        id: 'competencias-organizacionais',
        title: 'Competências Organizacionais',
        icon: Building,
        gradient: 'from-stone-700 to-stone-800 dark:from-stone-700 dark:to-stone-800',
        bgColor: 'bg-stone-50 dark:bg-stone-800/20',
        borderColor: 'border-stone-200 dark:border-stone-700',
        items: organizationalCompetencies.map((comp: any) => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description
        }))
      }
    ]);
  }, [deliveriesCriteria]);

  const addField = (section: keyof SelfEvaluationData) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], '']
    }));
  };

  const removeField = (section: keyof SelfEvaluationData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateField = (section: keyof SelfEvaluationData, index: number, value: string) => {
    const newSectionData = formData[section].map((item, i) => i === index ? value : item);

    setFormData(prev => ({
      ...prev,
      [section]: newSectionData
    }));

    // Validação em tempo real
    validateToolkitSection(section, newSectionData);

    // Check if section is completed
    const hasValidItems = newSectionData.some(item => item.trim() !== '');

    if (hasValidItems) {
      setCompletedSections(prev => new Set(prev).add(section));
    } else {
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(section);
        return newSet;
      });
    }
  };

  const handleCompetencyScore = (competencyName: string, score: number) => {
    setCompetencyScores(prev => ({
      ...prev,
      [competencyName]: score
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNextStep = () => {
    const hasEmptySections = Object.entries(formData).some(([key, values]) => 
      values.every((value: string) => value.trim() === '')
    );

    if (hasEmptySections) {
      toast.error('Preencha pelo menos um item em cada seção');
      return;
    }

    setCurrentStep('competencies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (): Promise<void> => {
    console.log('🔄 Iniciando salvamento da autoavaliação');

    if (!currentCycle || !user) {
      console.error('❌ Erro: Ciclo ou usuário não encontrado', { currentCycle, user });
      toast.error('Ciclo de avaliação ou usuário não encontrado');
      return;
    }

    // Check if all competencies are evaluated
    const totalCompetencies = competencyCategories.reduce((sum, category) => sum + category.items.length, 0);
    const evaluatedCompetencies = Object.keys(competencyScores).length;

    console.log('📊 Validação de competências:', { totalCompetencies, evaluatedCompetencies });

    if (evaluatedCompetencies < totalCompetencies) {
      console.warn('⚠️ Nem todas as competências foram avaliadas');
      toast.error('Avalie todas as competências antes de salvar');
      return;
    }

    const cleanedData = Object.entries(formData).reduce((acc, [key, values]) => {
      acc[key as keyof SelfEvaluationData] = values.filter((value: string) => value.trim() !== '');
      return acc;
    }, {} as SelfEvaluationData);

    // Prepare competencies for the new system
    const competencies = competencyCategories.flatMap(category =>
      category.items.map(item => {
        // Determinar a categoria baseada no ID da categoria
        let categoryType: 'technical' | 'behavioral' | 'deliveries';
        if (category.id === 'competencias-tecnicas') {
          categoryType = 'technical';
        } else if (category.id === 'competencias-comportamentais') {
          categoryType = 'behavioral';
        } else {
          categoryType = 'deliveries';
        }

        return {
          criterion_name: item.name,
          criterion_description: item.description,
          name: item.name,
          description: item.description,
          category: categoryType,
          score: competencyScores[item.name] || competencyScores[item.id] || 0,
          written_response: ''
        };
      })
    );

    console.log('📦 Dados preparados para envio:', {
      cycleId: currentCycle.id,
      employeeId: user.id,
      competenciesCount: competencies.length,
      toolkitSections: Object.keys(cleanedData).length
    });

    const saveDraft = async () => {
      if (!currentCycle?.id || !profile?.id) {
        toast.error('Informações necessárias não encontradas');
        return;
      }

      try {
        await evaluationService.saveSelfEvaluation(
          currentCycle.id,
          profile.id,
          competencies,
        );
        toast.success('Rascunho salvo!');
      } catch (error) {
        toast.error('Erro ao salvar rascunho');
      }
    };

    setIsSaving(true);
    try {
      console.log('📤 Enviando autoavaliação para o servidor...');

      await saveSelfEvaluation({
        cycleId: currentCycle.id,
        employeeId: user.id,
        competencies,
        toolkit: {
          knowledge: cleanedData.conhecimentos,
          tools: cleanedData.ferramentas,
          strengths_internal: cleanedData.forcasInternas,
          qualities: cleanedData.qualidades
        }
      });

      console.log('✅ Autoavaliação salva com sucesso!');
      clearAutoSave(); // Limpar auto-save após salvar com sucesso
      toast.success('Autoavaliação completa salva com sucesso!');
      navigate('/');
    } catch (error: any) {
      // Log detalhado do erro
      console.error('❌ Erro ao salvar autoavaliação:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });

      // Mensagem específica baseada no tipo de erro
      if (error.response?.status === 401) {
        console.error('🔒 Erro de autenticação: Token expirado ou inválido');
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
          duration: 5000,
          icon: '🔒'
        });
        // Aguardar 2 segundos para o usuário ler a mensagem antes de redirecionar
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 403) {
        console.error('⛔ Erro de permissão');
        toast.error('Você não tem permissão para realizar esta ação.');
      } else if (error.response?.status === 500) {
        console.error('💥 Erro interno do servidor');
        toast.error('Erro no servidor. Por favor, tente novamente em alguns instantes.');
      } else if (error.request) {
        console.error('🌐 Erro de conexão: Sem resposta do servidor');
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        console.error('⚠️ Erro desconhecido');
        toast.error(error.message || 'Erro ao salvar autoavaliação. Por favor, tente novamente.');
      }
    } finally {
      setIsSaving(false);
      console.log('🏁 Processo de salvamento finalizado');
    }
  };

  // Check if cycle is within valid dates
  const isCycleInValidPeriod = () => {
    if (!currentCycle) return false;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    
    return today >= startDate && today <= endDate;
  };

  const getCyclePeriodMessage = () => {
    if (!currentCycle) return null;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    
    if (today < startDate) {
      return {
        type: 'warning',
        message: `O período de avaliação iniciará em ${startDate.toLocaleDateString('pt-BR')}`
      };
    }
    
    if (today > endDate) {
      return {
        type: 'error',
        message: `O período de avaliação encerrou em ${endDate.toLocaleDateString('pt-BR')}`
      };
    }
    
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 7) {
      return {
        type: 'warning',
        message: `Atenção: ${daysRemaining} dias restantes para completar a avaliação`
      };
    }
    
    return null;
  };

  // Check if there's no active cycle or cycle is out of period
  if (!currentCycle || !isCycleInValidPeriod()) {
    const periodMessage = getCyclePeriodMessage();
    
    return (
      <div className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-naue-border-gray dark:border-gray-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-primary dark:text-primary-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {currentCycle && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-naue-black dark:text-gray-300 font-medium">
              <strong>Ciclo:</strong> {currentCycle.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Período: {new Date(currentCycle.start_date).toLocaleDateString('pt-BR')} - {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
        {profile?.is_director && (
          <button
            onClick={() => window.location.href = '/cycle-management'}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }


  const sections: Section[] = [
    {
      id: 'conhecimentos',
      title: 'Conhecimentos',
      subtitle: 'Sei falar sobre:',
      icon: Brain,
      gradient: 'from-top-teal to-top-teal-dark dark:from-top-teal-dark dark:to-top-teal',
      bgColor: 'bg-top-teal-light dark:bg-top-teal/10',
      borderColor: 'border-top-teal/30 dark:border-top-teal/40',
      iconBg: 'bg-gradient-to-br from-top-teal to-top-teal-dark dark:from-top-teal-dark dark:to-top-teal',
      items: formData.conhecimentos
    },
    {
      id: 'ferramentas',
      title: 'Ferramentas',
      subtitle: 'Sei usar:',
      icon: Wrench,
      gradient: 'from-top-blue to-top-blue-dark dark:from-top-blue-dark dark:to-top-blue',
      bgColor: 'bg-top-blue-light dark:bg-top-blue/10',
      borderColor: 'border-top-blue/30 dark:border-top-blue/40',
      iconBg: 'bg-gradient-to-br from-top-blue to-top-blue-dark dark:from-top-blue-dark dark:to-top-blue',
      items: formData.ferramentas
    },
    {
      id: 'forcasInternas',
      title: 'Forças Internas',
      subtitle: 'Me sustentam:',
      icon: Shield,
      gradient: 'from-top-gold to-top-gold-dark dark:from-top-gold-dark dark:to-top-gold',
      bgColor: 'bg-top-gold-light dark:bg-top-gold/10',
      borderColor: 'border-top-gold/30 dark:border-top-gold/40',
      iconBg: 'bg-gradient-to-br from-top-gold to-top-gold-dark dark:from-top-gold-dark dark:to-top-gold',
      items: formData.forcasInternas
    },
    {
      id: 'qualidades',
      title: 'Qualidades',
      subtitle: 'Tenho para oferecer:',
      icon: Award,
      gradient: 'from-top-gold to-top-gold-dark dark:from-top-gold-dark dark:to-top-gold',
      bgColor: 'bg-top-gold-light dark:bg-top-gold/10',
      borderColor: 'border-top-gold/30 dark:border-top-gold/40',
      iconBg: 'bg-gradient-to-br from-top-gold to-top-gold-dark dark:from-top-gold-dark dark:to-top-gold',
      items: formData.qualidades
    }
  ];

  const toolkitProgress = (completedSections.size / sections.length) * 100;
  const competencyProgress = (Object.keys(competencyScores).length / competencyCategories.reduce((sum, cat) => sum + cat.items.length, 0)) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  const renderToolkitStep = () => (
    <>
      {/* Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 sm:space-y-6"
      >
        {sections.map((section: Section, sectionIndex) => {
          const IconComponent = section.icon;
          const isCompleted = completedSections.has(section.id);
          
          return (
            <motion.div
              key={section.id}
              variants={itemVariants}
              className={`bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border ${isCompleted ? section.borderColor : 'border-naue-border-gray dark:border-gray-700'} overflow-hidden transition-all duration-300`}
            >
              {/* Section Header */}
              <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${isCompleted ? section.bgColor : 'bg-gray-50 dark:bg-gray-700/50'} border-b border-gray-100 dark:border-gray-700`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${section.iconBg} shadow-md`}>
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{section.title}</h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{section.subtitle}</p>
                    </div>
                  </div>
                  {isCompleted ? (
                    <div className="flex items-center space-x-1 sm:space-x-2 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-600/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Completo</span>
                    </div>
                  ) : validationErrors[section.id] && viewMode === 'edit' ? (
                    <div className="flex items-center space-x-1 sm:space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Obrigatório</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  {section.items.map((item: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-2 sm:space-x-3 group"
                    >
                      <div className="flex-1 relative">
                        {viewMode === 'view' && item.trim() ? (
                          // Visualização estática - apenas mostra o texto
                          <div className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg sm:rounded-xl">
                            {item}
                          </div>
                        ) : viewMode === 'view' ? null : (
                          // Modo de edição - input editável
                          <>
                            <input
                              type="text"
                              value={item}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(section.id, index, e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-naue-black dark:text-gray-300 font-medium rounded-lg sm:rounded-xl focus:ring-2 focus:ring-top-teal dark:focus:ring-top-teal focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                              placeholder={`Digite ${section.title.toLowerCase()} ${index + 1}...`}
                            />
                            {item.trim() && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-2 sm:right-3 top-2 sm:top-3.5"
                              >
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 dark:text-primary-400" />
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                      {section.items.length > 1 && viewMode === 'edit' && (
                        <button
                          onClick={() => removeField(section.id, index)}
                          className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add More Button - Only show in edit mode */}
                {viewMode === 'edit' && (
                  <button
                    onClick={() => addField(section.id)}
                    className={`mt-3 sm:mt-4 flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-lg border border-dashed ${isCompleted ? section.borderColor : 'border-gray-300 dark:border-gray-600'} text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 group`}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="text-xs sm:text-sm font-medium">Adicionar mais</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Tips Section - Only show in edit mode */}
        {viewMode === 'edit' && (
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-top-teal-light to-top-blue-light dark:from-top-teal/10 dark:to-top-blue/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-top-teal/20 dark:border-top-teal/30"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm sm:text-base">Dicas para uma boa autoavaliação</h3>
                <ul className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-600 mr-2">•</span>
                    <span>Seja específico e honesto sobre suas competências</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-600 mr-2">•</span>
                    <span>Inclua tanto habilidades técnicas quanto comportamentais</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-600 mr-2">•</span>
                    <span>Pense em situações reais onde aplicou essas habilidades</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Only show in edit mode */}
        {viewMode === 'edit' && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 space-y-4 sm:space-y-0"
          >
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              size="lg"
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
              <span className="text-xs sm:text-sm text-center">
                {completedSections.size === sections.length ? (
                  <span className="flex items-center text-primary-600 dark:text-primary-400">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Todas as seções completas!
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">{sections.length - completedSections.size} seções pendentes</span>
                )}
              </span>
              <Button
                variant="primary"
                onClick={handleNextStep}
                icon={<ArrowRight size={18} />}
                size="lg"
                disabled={completedSections.size !== sections.length}
                className="bg-gradient-to-r from-top-teal to-top-blue dark:from-top-teal-dark dark:to-top-blue-dark w-full sm:w-auto"
              >
                Próxima Etapa
              </Button>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons - View mode */}
        {viewMode === 'view' && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 space-y-4 sm:space-y-0"
          >
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              size="lg"
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Voltar ao Dashboard
            </Button>

            <Button
              variant="primary"
              onClick={() => setCurrentStep('competencies')}
              icon={<ArrowRight size={18} />}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 w-full sm:w-auto order-1 sm:order-2"
            >
              Ver Competências
            </Button>
          </motion.div>
        )}
      </motion.div>
    </>
  );

  const renderCompetenciesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-4 sm:space-y-6"
    >
      {competencyCategories.map((category, categoryIndex) => {
        const IconComponent = category.icon;
        const isExpanded = expandedSections.has(category.id);
        const categoryProgress = category.items.filter(item => competencyScores[item.name] !== undefined || competencyScores[item.id] !== undefined).length / category.items.length * 100;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(category.id)}
              className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${category.bgColor} border-b ${category.borderColor} hover:opacity-90 transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${category.gradient} shadow-md`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{category.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {category.items.filter(item => competencyScores[item.name] !== undefined || competencyScores[item.id] !== undefined).length} de {category.items.length} competências avaliadas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-16 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${category.gradient} transition-all duration-300`}
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
                >
                  {category.items.map((item, itemIndex) => {
                    const ratingLabels = {
                      1: { label: 'Insatisfatório', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
                      2: { label: 'Em Desenvolvimento', color: 'bg-accent-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
                      3: { label: 'Satisfatório', color: 'bg-primary-500', textColor: 'text-blue-600 dark:text-blue-400' },
                      4: { label: 'Excepcional', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' }
                    };
                    // Buscar score pelo nome (criterion_name) ou pelo id
                    const score = competencyScores[item.name] || competencyScores[item.id];
                    const ratingInfo = score ? ratingLabels[score as keyof typeof ratingLabels] : null;

                    return viewMode === 'view' ? (
                      // Modo visualização - linha compacta com nota
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.03 }}
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
                      >
                        <div className="flex-1 mr-4">
                          <h4 className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100">{item.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{item.description}</p>
                        </div>
                        {score && ratingInfo && (
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className={`text-xs sm:text-sm font-medium ${ratingInfo.textColor}`}>
                              {ratingInfo.label}
                            </span>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${ratingInfo.color} flex items-center justify-center`}>
                              <span className="text-lg sm:text-xl font-bold text-white">{score}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      // Modo edição - cards clicáveis
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                        className="space-y-3 sm:space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1 sm:mr-4">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          </div>
                          {score && (
                            <div className="text-center">
                              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                score >= 4 ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300' :
                                score >= 3 ? 'bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300' :
                                score >= 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                Nota: {score}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          {[1, 2, 3, 4].map((rating) => {
                            const ratingLabel = ratingLabels[rating as keyof typeof ratingLabels];

                            return (
                              <button
                                key={rating}
                                onClick={() => handleCompetencyScore(item.name, rating)}
                                className={`py-3 sm:py-4 px-2 sm:px-4 rounded-lg border transition-all duration-200 ${
                                  score === rating
                                    ? `${ratingLabel.color} text-white border-transparent shadow-lg transform scale-105`
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-xl sm:text-2xl font-bold mb-1">{rating}</div>
                                  <div className="text-xs">
                                    {ratingLabel.label}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Action Buttons - Only show in edit mode */}
      {viewMode === 'edit' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 space-y-4 sm:space-y-0"
        >
          <Button
            variant="outline"
            onClick={() => setCurrentStep('toolkit')}
            icon={<ArrowLeft size={18} />}
            size="lg"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Voltar
          </Button>

          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
            <span className="text-xs sm:text-sm text-center">
              {competencyProgress === 100 ? (
                <span className="flex items-center text-primary-600 dark:text-primary-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Todas as competências avaliadas!
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">{Math.round(competencyProgress)}% completo</span>
              )}
            </span>
            <Button
              variant="primary"
              onClick={handleSave}
              icon={<Save size={18} />}
              size="lg"
              disabled={competencyProgress < 100 || isSaving || loading}
              className="bg-gradient-to-r from-top-teal to-top-blue dark:from-top-teal-dark dark:to-top-blue-dark w-full sm:w-auto"
            >
              {isSaving ? 'Salvando...' : 'Salvar Autoavaliação'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                {currentStep === 'toolkit' ? (
                  <>
                    <Pen className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-stone-700 dark:text-stone-700 mr-2 sm:mr-3" />
                    <span className="break-words">Meu Toolkit Profissional</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-600 dark:text-gray-600 mr-2 sm:mr-3" />
                    <span className="break-words">Autoavaliação de Competências</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                {currentStep === 'toolkit' 
                  ? 'Construa seu perfil de competências e habilidades'
                  : 'Avalie suas competências técnicas, comportamentais e organizacionais'
                }
              </p>
              {currentCycle && (
                <p className="text-xs text-gray-500 mt-1">
                  Ciclo: {currentCycle.title} | Prazo: {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          
          {/* Period Alert - Only show in edit mode */}
          {viewMode === 'edit' && getCyclePeriodMessage() && (
            <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
              getCyclePeriodMessage()?.type === 'error'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
            }`}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{getCyclePeriodMessage()?.message}</p>
            </div>
          )}

          {/* Progress Indicator - Only show in edit mode */}
          {viewMode === 'edit' && (
            <div className="flex items-center space-x-4 w-full lg:w-auto justify-end">
              {/* Auto-save indicator */}
              {lastSaved && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Progresso</p>
                <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                  {Math.round(currentStep === 'toolkit' ? toolkitProgress : competencyProgress)}%
                </p>
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
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(currentStep === 'toolkit' ? toolkitProgress : competencyProgress) * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#166534" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          )}
        </div>

        {/* Step Indicator - Show in edit mode and view mode (clickable in view mode) */}
        {(viewMode === 'edit' || viewMode === 'view') && (
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <button
              onClick={() => viewMode === 'view' && setCurrentStep('toolkit')}
              disabled={viewMode === 'edit'}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 ${
                currentStep === 'toolkit'
                  ? 'bg-primary-100 dark:bg-primary-600/30 text-primary-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              } ${viewMode === 'view' ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'toolkit' ? 'bg-primary dark:bg-green-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                1
              </div>
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Toolkit Profissional</span>
            </button>

            <div className="w-8 sm:w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${viewMode === 'view' || currentStep === 'competencies' ? 'w-full bg-primary dark:bg-green-700' : 'w-0'}`} />
            </div>

            <button
              onClick={() => viewMode === 'view' && setCurrentStep('competencies')}
              disabled={viewMode === 'edit'}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 ${
                currentStep === 'competencies'
                  ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              } ${viewMode === 'view' ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'competencies' ? 'bg-gray-600 dark:bg-gray-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                2
              </div>
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Competências</span>
            </button>
          </div>
        )}

        {/* Quick Stats for Toolkit Step - Only show in edit mode */}
        {currentStep === 'toolkit' && viewMode === 'edit' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            {sections.map((section) => {
              const filledItems = section.items.filter(item => item.trim() !== '').length;
              const isCompleted = completedSections.has(section.id);
              
              return (
                <div 
                  key={section.id} 
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isCompleted ? section.borderColor : 'border-gray-200 dark:border-gray-600'} ${isCompleted ? section.bgColor : 'bg-gray-50 dark:bg-gray-700/50'} transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <section.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isCompleted ? 'text-naue-black dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`} />
                    {isCompleted && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary-500 dark:text-primary-400" />}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-naue-black dark:text-gray-300 font-medium mt-1 sm:mt-2 break-words">{section.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{filledItems} itens</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Content based on current step */}
      <AnimatePresence mode="wait">
        {currentStep === 'toolkit' ? renderToolkitStep() : renderCompetenciesStep()}
      </AnimatePresence>

      {/* Info Banner for Existing Evaluation - View Mode - No final da página */}
      {hasExistingEvaluation && !loading && viewMode === 'view' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Autoavaliação já realizada
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Você já completou sua autoavaliação para este ciclo. Visualizando em modo somente leitura.
              </p>
              {existingEvaluationData && (
                <div className="flex flex-wrap gap-4 items-center mt-3">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Nota Final: <span className="text-lg font-bold">{existingEvaluationData.final_score?.toFixed(1) || 'N/A'}</span>
                  </span>
                  <span className="text-sm text-blue-600 dark:text-blue-300">
                    Avaliado em: {new Date(existingEvaluationData.evaluation_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SelfEvaluation;