import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';
import { pdiService } from '../../services/pdiService';
import { evaluationService } from '../../services/evaluation.service';
import LeaderEvaluationHeader from '../../components/LeaderEvaluationHeader';
import EvaluationSection from '../../components/EvaluationSection';
import PotentialAndPDI from '../../components/PotentialAndPDI';
import { AlertCircle, CheckCircle, Save, ArrowRight, BookOpen, Target, Award, Info } from 'lucide-react';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';

// Define SectionProps interface for type consistency
interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number; // score can be number or undefined
}

interface SectionProps {
  id: string;
  title: string;
  weight: number;
  expanded: boolean;
  icon: React.ElementType; // Icon component from LucideReact
  gradient: string;
  darkGradient: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
  items: CompetencyItem[];
}

interface Scores {
  technical: number;
  behavioral: number;
  organizational: number;
  final: number;
}

// Define PotentialItem interface here or import it from PotentialAndPDI
interface PotentialItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}


const LeaderEvaluation = () => {
  const navigate = useNavigate();
  const { currentCycle, saveLeaderEvaluation, checkExistingEvaluation, loadSubordinates, subordinates, deliveriesCriteria } = useEvaluation();
  const { user, profile } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Competências, 2: Potencial, 3: PDI
  const [loading, setLoading] = useState(true);
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leaderEvaluationId, setLeaderEvaluationId] = useState<string | null>(null);

  // Verificar se é usuário admin para modo demonstração
  const isAdminDemo = user?.email === 'admintop@sistema.com';

  // Controle de modo de visualização (igual ao Consenso)
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  const [existingEvaluationData, setExistingEvaluationData] = useState<any>(null);

  // Auto-save states
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRestoringData, setIsRestoringData] = useState(false);

  // Storage key for auto-save
  const getStorageKey = useCallback(() => {
    if (!currentCycle?.id || !selectedEmployeeId || !profile?.id) return null;
    return `leader_evaluation_autosave_${currentCycle.id}_${selectedEmployeeId}_${profile.id}`;
  }, [currentCycle?.id, selectedEmployeeId, profile?.id]);

  const [sections, setSections] = useState<SectionProps[]>([]); // Inicializar vazio, será preenchido no useEffect

  // Inicializar sections quando deliveriesCriteria carregar
  useEffect(() => {
    // Usar deliveriesCriteria do contexto ou fallback para EVALUATION_COMPETENCIES.deliveries
    const organizationalCompetencies = deliveriesCriteria.length > 0
      ? deliveriesCriteria
      : EVALUATION_COMPETENCIES.deliveries;

    setSections([
      {
        id: 'technical',
        title: 'Competências Técnicas',
        weight: 50,
        expanded: true,
        icon: BookOpen,
        gradient: 'from-top-teal to-top-teal-dark',
        darkGradient: 'dark:from-top-teal-dark dark:to-top-teal',
        bgColor: 'bg-top-teal-light',
        darkBgColor: 'dark:bg-top-teal/10',
        borderColor: 'border-top-teal/30',
        darkBorderColor: 'dark:border-top-teal/40',
        items: EVALUATION_COMPETENCIES.technical.map(comp => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description,
          score: undefined
        }))
      },
      {
        id: 'behavioral',
        title: 'Competências Comportamentais',
        weight: 30,
        expanded: false,
        icon: Target,
        gradient: 'from-top-blue to-top-blue-dark',
        darkGradient: 'dark:from-top-blue-dark dark:to-top-blue',
        bgColor: 'bg-top-blue-light',
        darkBgColor: 'dark:bg-top-blue/10',
        borderColor: 'border-top-blue/30',
        darkBorderColor: 'dark:border-top-blue/40',
        items: EVALUATION_COMPETENCIES.behavioral.map(comp => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description,
          score: undefined
        }))
      },
      {
        id: 'organizational',
        title: 'Competências Organizacionais',
        weight: 20,
        expanded: false,
        icon: Award,
        gradient: 'from-top-gold to-top-gold-dark',
        darkGradient: 'dark:from-top-gold-dark dark:to-top-gold',
        bgColor: 'bg-top-gold-light',
        darkBgColor: 'dark:bg-top-gold/10',
        borderColor: 'border-top-gold/30',
        darkBorderColor: 'dark:border-top-gold/40',
        items: organizationalCompetencies.map((comp: any) => ({
          id: comp.name.toLowerCase().replace(/\s+/g, '-'),
          name: comp.name,
          description: comp.description,
          score: undefined
        }))
      }
    ]);
  }, [deliveriesCriteria]);

  const [potentialItems, setPotentialItems] = useState<PotentialItem[]>([ // Explicitly type potentialItems state
    {
      id: 'pot1',
      name: 'Potencial para função subsequente',
      description: 'O que você enxerga como potencial máximo deste parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o performancee e a motivação sustentados até hoje?',
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
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da empresa.',
      score: undefined
    },
    {
      id: 'pot4',
      name: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
      score: undefined
    }
  ]);

  const [pdiData, setPdiData] = useState<PdiData>({ // Explicitly type pdiData state
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });

  // Load subordinates on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSubordinates();
      setLoading(false);
    };
    loadData();
  }, [loadSubordinates]);

  // Auto-save: Restaurar dados do localStorage ao selecionar colaborador
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || hasExistingEvaluation || viewMode === 'view') return;

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setIsRestoringData(true);
        const parsed = JSON.parse(savedData);

        if (parsed.sections) {
          setSections(parsed.sections);
        }

        if (parsed.potentialItems) {
          setPotentialItems(parsed.potentialItems);
        }

        if (parsed.pdiData) {
          setPdiData(prev => ({ ...prev, ...parsed.pdiData }));
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
          sections: !!parsed.sections,
          potentialItems: !!parsed.potentialItems,
          pdiData: !!parsed.pdiData,
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
    const hasSectionScores = sections.some(s => s.items.some(i => i.score !== undefined));
    const hasPotentialScores = potentialItems.some(i => i.score !== undefined);
    const hasPdiItems = pdiData.curtosPrazos.length > 0 || pdiData.mediosPrazos.length > 0 || pdiData.longosPrazos.length > 0;

    if (hasSectionScores || hasPotentialScores || hasPdiItems) {
      const dataToSave = {
        sections,
        potentialItems,
        pdiData,
        currentStep,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());

      console.log('💾 Auto-save realizado:', {
        hasSectionScores,
        hasPotentialScores,
        hasPdiItems,
        step: currentStep
      });
    }
  }, [sections, potentialItems, pdiData, currentStep, getStorageKey, viewMode, hasExistingEvaluation, isRestoringData]);

  // Limpar auto-save após salvar com sucesso
  const clearAutoSave = useCallback(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
      console.log('🗑️ Auto-save limpo após salvar com sucesso');
    }
  }, [getStorageKey]);

  // Load existing PDI when employee is selected
  const loadExistingPDI = async (employeeId: string) => {
    try {
      const existingPDI = await pdiService.getPDI(employeeId);

      if (existingPDI) {
        const transformedPDI = pdiService.transformPDIDataFromAPI(existingPDI);
        setPdiData(prev => ({
          ...transformedPDI,
          colaboradorId: employeeId,
          colaborador: prev.colaborador || transformedPDI.colaborador,
          cargo: prev.cargo || transformedPDI.cargo,
          departamento: prev.departamento || transformedPDI.departamento,
        }));
        toast('PDI existente carregado para edição');
      }
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      // Não mostrar erro se não houver PDI, é esperado
    }
  };

  // Check for existing evaluation and populate PDI data when employee is selected
  useEffect(() => {
    const checkAndPopulate = async () => {
      if (currentCycle && selectedEmployeeId) {
        // Buscar avaliação existente
        try {
          const response = await evaluationService.getLeaderEvaluations(selectedEmployeeId, currentCycle.id);

          if (response && response.length > 0) {
            const existingEval = response[0];
            setHasExistingEvaluation(true);
            setExistingEvaluationData(existingEval);
            setViewMode('view');

            toast.success(
              `Visualizando avaliação salva (Nota Final: ${existingEval.final_score?.toFixed(1) || 'N/A'})`,
              { duration: 4000 }
            );

            // Preencher competências com os dados salvos
            if (existingEval.evaluation_competencies) {
              const technicalComps = existingEval.evaluation_competencies.filter((c: any) => c.category === 'technical');
              const behavioralComps = existingEval.evaluation_competencies.filter((c: any) => c.category === 'behavioral');
              const deliveriesComps = existingEval.evaluation_competencies.filter((c: any) => c.category === 'deliveries');

              setSections(prev => prev.map(section => {
                const comps = section.id === 'technical' ? technicalComps :
                             section.id === 'behavioral' ? behavioralComps :
                             deliveriesComps;

                return {
                  ...section,
                  items: section.items.map(item => {
                    const matchingComp = comps.find((c: any) =>
                      c.criterion_name === item.name
                    );
                    return {
                      ...item,
                      score: matchingComp?.score
                    };
                  })
                };
              }));
            }

            // Preencher potencial
            if (existingEval.potential_score) {
              setPotentialItems(prev => prev.map((item, idx) => ({
                ...item,
                score: idx === 0 ? existingEval.potential_score : item.score
              })));
            }
          } else {
            setHasExistingEvaluation(false);
            setExistingEvaluationData(null);
            setViewMode('edit');
          }
        } catch (error) {
          console.error('Erro ao verificar avaliação existente:', error);
          setHasExistingEvaluation(false);
          setExistingEvaluationData(null);
          setViewMode('edit');
        }

        // Load existing PDI
        await loadExistingPDI(selectedEmployeeId);
      }

      if (selectedEmployeeId) {
        const employeeProfile = subordinates.find(sub => sub.id === selectedEmployeeId);
        if (employeeProfile) {
          setPdiData((prev: PdiData) => ({ // Explicitly type prev
            ...prev,
            colaboradorId: employeeProfile.id,
            colaborador: employeeProfile.name,
            cargo: employeeProfile.position,
            departamento: Array.isArray(employeeProfile.departments)
              ? employeeProfile.departments.map(dep => dep.name).join(', ')
              : employeeProfile.departments || 'Não definido',
            periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            dataCriacao: prev.dataCriacao || new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
          }));
        }
      }
    };
    checkAndPopulate();
  }, [currentCycle, selectedEmployeeId, checkExistingEvaluation, subordinates]);

  const calculateScores = (): Scores => {
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

    newScores.final = (
      (newScores.technical * 0.5) +
      (newScores.behavioral * 0.3) +
      (newScores.organizational * 0.2)
    );
    return newScores;
  };

  const calculatePotentialScores = () => {
    const scores = potentialItems.filter(item => item.score !== undefined).map(item => item.score || 0);
    if (scores.length === 0) return { results: 0, agility: 0, relationships: 0, final: 0 };

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      results: potentialItems[0]?.score || 0,
      agility: potentialItems[1]?.score || 0,
      relationships: ((potentialItems[2]?.score || 0) + (potentialItems[3]?.score || 0)) / 2,
      final: average
    };
  };

  const getProgress = () => {
    if (currentStep === 1) {
      const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
      const scoredItems = sections.reduce(
        (acc, section) => acc + section.items.filter(item => item.score !== undefined).length,
        0
      );
      return totalItems > 0 ? (scoredItems / totalItems) * 100 : 0;
    } else if (currentStep === 2) {
      const scoredItems = potentialItems.filter(item => item.score !== undefined).length;
      return potentialItems.length > 0 ? (scoredItems / potentialItems.length) * 100 : 0;
    } else {
      const allPdiItems = [...pdiData.curtosPrazos, ...pdiData.mediosPrazos, ...pdiData.longosPrazos];
      if (allPdiItems.length === 0) return 0;
      const completedItems = allPdiItems.filter(item => item.status === '5').length;
      return (completedItems / allPdiItems.length) * 100;
    }
  };

  const canProceedToStep2 = () => {
    return sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );
  };

  const canProceedToStep3 = () => {
    return potentialItems.every(item => item.score !== undefined);
  };

  const handleNextStep = () => {
    // Admin demo pode navegar livremente entre etapas
    if (currentStep === 1 && (canProceedToStep2() || isAdminDemo)) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && (canProceedToStep3() || isAdminDemo)) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      toast.error('Dados incompletos para enviar');
      return;
    }

    const allCompetenciesScored = sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );

    const allPotentialScored = potentialItems.every(item => item.score !== undefined);

    if (!allCompetenciesScored || !allPotentialScored) {
      toast.error('Complete todas as avaliações de competências e potencial antes de enviar');
      return;
    }

    const totalPdiItems = pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;
    if (totalPdiItems === 0) {
      toast.error('Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de enviar.');
      return;
    }

    const competencies = sections.flatMap(section =>
      section.items.map(item => {
        // Determinar a categoria baseada no ID da seção
        let category: 'technical' | 'behavioral' | 'deliveries';
        if (section.id === 'technical') {
          category = 'technical';
        } else if (section.id === 'behavioral') {
          category = 'behavioral';
        } else {
          category = 'deliveries';
        }

        return {
          id: item.id,
          criterion_name: item.name,
          criterion_description: item.description,
          category: category,
          score: item.score!,
          weight: 1.0
        };
      })
    );

    setIsSaving(true);
    try {
      // Preparar detalhes de potencial para salvar
      const potentialDetails: Record<string, { name: string; score: number }> = {};
      potentialItems.forEach(item => {
        if (item.score !== undefined) {
          potentialDetails[item.id] = {
            name: item.name,
            score: item.score
          };
        }
      });

      // 1. Criar a avaliação do líder
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: calculatePotentialScores().final,
        potentialDetails,
        feedback: {
          strengths_internal: 'Avaliação completa',
          improvements: '',
          observations: `Potencial: ${potentialItems.map(item => `${item.name}: ${item.score}`).join(', ')}`
        }
      });

      // 2. Salvar o PDI usando o novo serviço
      const pdiParams = pdiService.transformPDIDataForAPI(
        pdiData,
        currentCycle.id,
        undefined // leaderEvaluationId será undefined por enquanto
      );

      await pdiService.savePDI(pdiParams);

      // Limpar auto-save após salvar com sucesso
      clearAutoSave();

      toast.success('Avaliação e PDI salvos com sucesso!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  // Função de salvar rascunho removida - não é mais necessária
  /*
  const handleSaveDraft = async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      toast.error('Dados incompletos para salvar');
      return;
    }

    const competencies = sections.flatMap(section =>
      section.items
        .filter(item => item.score !== undefined)
        .map(item => {
          // Determinar a categoria baseada no ID da seção
          let category: 'technical' | 'behavioral' | 'deliveries';
          if (section.id === 'technical') {
            category = 'technical';
          } else if (section.id === 'behavioral') {
            category = 'behavioral';
          } else {
            category = 'deliveries';
          }

          return {
            id: item.id,
            criterion_name: item.name,
            criterion_description: item.description,
            category: category,
            score: item.score!,
            weight: 1.0
          };
        })
    );

    const totalPdiItems = pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;
    if (competencies.length === 0 && totalPdiItems === 0) {
      toast.error('Avalie pelo menos uma competência ou adicione um item ao PDI antes de salvar');
      return;
    }

    const potentialScore = potentialItems.some(item => item.score !== undefined)
      ? calculatePotentialScores().final
      : undefined;

    // Preparar detalhes de potencial para salvar (rascunho)
    const potentialDetails: Record<string, { name: string; score: number }> = {};
    potentialItems.forEach(item => {
      if (item.score !== undefined) {
        potentialDetails[item.id] = {
          name: item.name,
          score: item.score
        };
      }
    });

    setIsSaving(true);
    try {
      // Salvar avaliação como rascunho
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: potentialScore || 0,
        potentialDetails: Object.keys(potentialDetails).length > 0 ? potentialDetails : undefined,
        feedback: {
          strengths_internal: '',
          improvements: '',
          observations: 'Avaliação salva como rascunho'
        }
      });

      // Se houver itens no PDI, salvar também
      if (totalPdiItems > 0) {
        const pdiParams = pdiService.transformPDIDataForAPI(
          pdiData,
          currentCycle.id,
          undefined // Sem ID da avaliação por enquanto
        );

        await pdiService.savePDI(pdiParams);
      }

      toast.success('Rascunho salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setIsSaving(false);
    }
  };
  */

  const isCycleInValidPeriod = (): boolean => { // Explicitly define return type
    if (!currentCycle) return false;
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    return today >= startDate && today <= endDate;
  };

  const getCyclePeriodMessage = (): { type: 'warning' | 'error', message: string } | null => { // Explicitly define return type
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
        message: `Atenção: ${daysRemaining} dias restantes para completar as avaliações`
      };
    }
    return null;
  };

  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);

  if (loading) {
    return <LoadingSpinner minHeight="min-h-[60vh]" />;
  }

  if (!currentCycle || !isCycleInValidPeriod()) {
    const periodMessage = getCyclePeriodMessage();
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-green-800 dark:text-green-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {profile?.is_director && (
          <button
            onClick={() => window.location.href = '/cycle-management'}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Info Banner for Existing Evaluation - View Mode (igual ao Consenso) */}
      {hasExistingEvaluation && selectedEmployeeId && !loading && viewMode === 'view' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Avaliação de Líder já realizada
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Esta avaliação já foi preenchida e salva. Você está visualizando os dados em modo somente leitura.
                {existingEvaluationData && (
                  <span className="block mt-1 font-medium">
                    Nota Final: {existingEvaluationData.final_score?.toFixed(1) || 'N/A'} |
                    Avaliado em: {new Date(existingEvaluationData.evaluation_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <LeaderEvaluationHeader
        currentStep={currentStep}
        currentCycle={currentCycle}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        subordinates={subordinates}
        loading={loading}
        progress={getProgress()}
        periodMessage={getCyclePeriodMessage()}
        pdiData={pdiData}
        setPdiData={setPdiData}
        lastSaved={lastSaved}
      />

      {/* Modo demonstração para admin ou colaborador selecionado */}
      {(selectedEmployeeId || isAdminDemo) && (
        <>
          {/* Banner de modo demonstração para admin */}
          {isAdminDemo && !selectedEmployeeId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start">
                <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Modo Demonstração
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Você está visualizando a interface em modo demonstração. As funcionalidades estão disponíveis para visualização, mas não é possível salvar avaliações sem selecionar um colaborador.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <>
              {sections.map((section, index) => (
                <EvaluationSection
                  key={section.id}
                  section={section}
                  setSections={setSections}
                  sectionIndex={index}
                  calculateScores={calculateScores}
                  isSaving={isSaving}
                  readOnly={viewMode === 'view' || (isAdminDemo && !selectedEmployeeId)}
                />
              ))}
              {viewMode === 'edit' && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
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
                    <Button variant="primary" onClick={handleNextStep} icon={<ArrowRight size={18} />} size="lg" disabled={!canProceedToStep2() && !isAdminDemo}>
                      Próxima Etapa
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 2 && (
            <PotentialAndPDI
              currentStep={currentStep}
              potentialItems={potentialItems}
              setPotentialItems={setPotentialItems}
              pdiData={pdiData}
              setPdiData={setPdiData}
              handlePreviousStep={handlePreviousStep}
              handleNextStep={handleNextStep}
              handleSubmit={handleSubmit}
              isSaving={isSaving}
              loading={loading}
              canProceedToStep3={canProceedToStep3}
              selectedEmployee={selectedEmployee}
              hideActionButtons={viewMode === 'view'}
              readOnly={viewMode === 'view' || (isAdminDemo && !selectedEmployeeId)}
            />
          )}

          {currentStep === 3 && (
            <PotentialAndPDI
              currentStep={currentStep}
              potentialItems={potentialItems}
              setPotentialItems={setPotentialItems}
              pdiData={pdiData}
              setPdiData={setPdiData}
              handlePreviousStep={handlePreviousStep}
              handleNextStep={handleNextStep}
              handleSubmit={handleSubmit}
              isSaving={isSaving}
              loading={loading}
              canProceedToStep3={canProceedToStep3}
              selectedEmployee={selectedEmployee}
              hideActionButtons={viewMode === 'view'}
              readOnly={viewMode === 'view' || (isAdminDemo && !selectedEmployeeId)}
            />
          )}
        </>
      )}

      {!selectedEmployeeId && !isAdminDemo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-gray-100 to-green-100 dark:from-gray-900/20 dark:to-green-900/20 mb-4 sm:mb-6">
              <Info className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {subordinates.length === 0 && !loading ? 'Nenhum subordinado disponível' : 'Nenhum avaliado selecionado'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {subordinates.length === 0 && !loading
                ? profile?.is_leader && !profile?.is_director
                  ? 'Você não possui avaliados subordinados para avaliar.'
                  : 'Entre em contato com o RH para verificar suas permissões.'
                : 'Selecione um avaliado acima para iniciar a avaliação de performance'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LeaderEvaluation;