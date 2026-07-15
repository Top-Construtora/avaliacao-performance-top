import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEvaluation } from './useEvaluation';
import { useAuth } from '../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../types/evaluation.types';
import { evaluationService } from '../services/evaluation.service';
import { formatDateBR } from '../utils/date';

export interface SelfEvaluationData {
  conhecimentos: string[];
  ferramentas: string[];
  forcasInternas: string[];
  qualidades: string[];
}

interface CompetencyScore {
  [key: string]: number;
}

export interface CompetencyCategory {
  id: string;
  title: string;
  items: { id: string; name: string; description: string }[];
}

export type ToolkitSectionId = keyof SelfEvaluationData;

/**
 * Toda a lógica da Autoavaliação (estado, auto-save, validação, payload, guards).
 * Extraída de SelfEvaluation.tsx sem alterar payloads nem chaves de localStorage.
 */
export function useSelfEvaluationForm() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { currentCycle, saveSelfEvaluation, loading, deliveriesCriteria } = useEvaluation();

  // Modo demonstração: admin pode percorrer o fluxo mesmo sem ciclo/dados reais
  const isAdminDemo = user?.email === 'admintop@sistema.com';

  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);

  const [existingEvaluationData, setExistingEvaluationData] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState<'toolkit' | 'competencies'>('toolkit');
  const [formData, setFormData] = useState<SelfEvaluationData>({
    conhecimentos: [''],
    ferramentas: [''],
    forcasInternas: [''],
    qualidades: [''],
  });
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore>({});
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>([]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [, setHasUnsavedChanges] = useState(false);
  const [isRestoringData, setIsRestoringData] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Guard StrictMode: evita restaurar/toast duas vezes para a mesma chave
  const restoredKeyRef = useRef<string | null>(null);

  const getStorageKey = useCallback(() => {
    if (!currentCycle?.id || !user?.id) return null;
    return `self_evaluation_autosave_${currentCycle.id}_${user.id}`;
  }, [currentCycle?.id, user?.id]);

  // Verifica avaliação existente → modo leitura
  useEffect(() => {
    const checkExisting = async () => {
      if (currentCycle && user) {
        try {
          const response = await evaluationService.getSelfEvaluations(user.id, currentCycle.id);
          if (response && response.length > 0) {
            const existingEval = response[0] as any;
            setHasExistingEvaluation(true);
            setExistingEvaluationData(existingEval);
            setViewMode('view');
            setCurrentStep('competencies');

            if (existingEval.evaluation_competencies) {
              const scores: CompetencyScore = {};

              existingEval.evaluation_competencies.forEach((comp: any) => {
                scores[comp.criterion_name] = comp.score;
              });
              setCompetencyScores(scores);
            }

            setFormData({
              conhecimentos: existingEval.knowledge?.length > 0 ? existingEval.knowledge : [''],
              ferramentas: existingEval.tools?.length > 0 ? existingEval.tools : [''],
              forcasInternas:
                existingEval.strengths_internal?.length > 0
                  ? existingEval.strengths_internal
                  : [''],
              qualidades: existingEval.qualities?.length > 0 ? existingEval.qualities : [''],
            });

            const completedSectionsSet = new Set<string>();
            if (existingEval.knowledge?.length > 0) completedSectionsSet.add('conhecimentos');
            if (existingEval.tools?.length > 0) completedSectionsSet.add('ferramentas');
            if (existingEval.strengths_internal?.length > 0)
              completedSectionsSet.add('forcasInternas');
            if (existingEval.qualities?.length > 0) completedSectionsSet.add('qualidades');
            setCompletedSections(completedSectionsSet);
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

  // Auto-save: restaurar do localStorage (só edição, sem avaliação existente)
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || hasExistingEvaluation || viewMode === 'view') return;
    if (restoredKeyRef.current === storageKey) return; // guard StrictMode

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        restoredKeyRef.current = storageKey;
        setIsRestoringData(true);
        const parsed = JSON.parse(savedData);

        if (parsed.formData) {
          setFormData(parsed.formData);
          const completedSectionsSet = new Set<string>();
          Object.entries(parsed.formData).forEach(([key, values]) => {
            if ((values as string[]).some((v) => v.trim() !== '')) {
              completedSectionsSet.add(key);
            }
          });
          setCompletedSections(completedSectionsSet);
        }
        if (parsed.competencyScores) setCompetencyScores(parsed.competencyScores);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.timestamp) setLastSaved(new Date(parsed.timestamp));

        toast.success('Dados restaurados automaticamente', { icon: '💾', duration: 3000 });
      } catch (error) {
        console.error('Erro ao restaurar auto-save:', error);
        localStorage.removeItem(storageKey);
      } finally {
        setIsRestoringData(false);
      }
    }
  }, [getStorageKey, hasExistingEvaluation, viewMode]);

  // Auto-save: gravar no localStorage quando houver mudanças
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || viewMode === 'view' || hasExistingEvaluation || isRestoringData) return;

    const hasFormData = Object.values(formData).some((arr) =>
      (arr as string[]).some((v: string) => v.trim() !== ''),
    );
    const hasScores = Object.keys(competencyScores).length > 0;

    if (hasFormData || hasScores) {
      const dataToSave = {
        formData,
        competencyScores,
        currentStep,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [
    formData,
    competencyScores,
    currentStep,
    getStorageKey,
    viewMode,
    hasExistingEvaluation,
    isRestoringData,
  ]);

  useEffect(() => {
    if (!isRestoringData && viewMode === 'edit') setHasUnsavedChanges(true);
  }, [formData, competencyScores, isRestoringData, viewMode]);

  const clearAutoSave = useCallback(() => {
    const storageKey = getStorageKey();
    if (storageKey) localStorage.removeItem(storageKey);
  }, [getStorageKey]);

  const validateToolkitSection = useCallback((section: ToolkitSectionId, values: string[]) => {
    const hasValidItem = values.some((v) => v.trim() !== '');
    setValidationErrors((prev) => {
      if (!hasValidItem) {
        return { ...prev, [section]: 'Adicione pelo menos um item nesta seção' };
      }
      const newErrors = { ...prev };
      delete newErrors[section];
      return newErrors;
    });
  }, []);

  // Categorias de competência (organizacionais dinâmicas)
  useEffect(() => {
    const organizationalCompetencies =
      deliveriesCriteria.length > 0 ? deliveriesCriteria : EVALUATION_COMPETENCIES.deliveries;

    const toItems = (arr: { name: string; description: string }[]) =>
      arr.map((comp) => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
      }));

    setCompetencyCategories([
      {
        id: 'competencias-tecnicas',
        title: 'Competências Técnicas',
        items: toItems(EVALUATION_COMPETENCIES.technical),
      },
      {
        id: 'competencias-comportamentais',
        title: 'Competências Comportamentais',
        items: toItems(EVALUATION_COMPETENCIES.behavioral),
      },

      {
        id: 'competencias-organizacionais',
        title: 'Competências Organizacionais',
        items: toItems(organizationalCompetencies as any),
      },
    ]);
  }, [deliveriesCriteria]);

  const addField = useCallback((section: ToolkitSectionId) => {
    setFormData((prev) => ({ ...prev, [section]: [...prev[section], ''] }));
  }, []);

  const removeField = useCallback((section: ToolkitSectionId, index: number) => {
    setFormData((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  }, []);

  const updateField = useCallback(
    (section: ToolkitSectionId, index: number, value: string) => {
      setFormData((prev) => {
        const newSectionData = prev[section].map((item, i) => (i === index ? value : item));
        return { ...prev, [section]: newSectionData };
      });
      const newSectionData = formData[section].map((item, i) => (i === index ? value : item));
      validateToolkitSection(section, newSectionData);
      const hasValidItems = newSectionData.some((item) => item.trim() !== '');
      setCompletedSections((prev) => {
        const newSet = new Set(prev);
        if (hasValidItems) newSet.add(section);
        else newSet.delete(section);
        return newSet;
      });
    },
    [formData, validateToolkitSection],
  );

  const handleCompetencyScore = useCallback((competencyName: string, score: number) => {
    setCompetencyScores((prev) => ({ ...prev, [competencyName]: score }));
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!currentCycle || !user) {
      if (isAdminDemo) {
        toast('Modo demonstração — autoavaliação não enviada', { icon: '🎬' });
        navigate('/');
        return;
      }
      toast.error('Ciclo de avaliação ou usuário não encontrado');
      return;
    }

    const totalCompetencies = competencyCategories.reduce((sum, c) => sum + c.items.length, 0);
    const evaluatedCompetencies = Object.keys(competencyScores).length;
    if (evaluatedCompetencies < totalCompetencies) {
      toast.error('Avalie todas as competências antes de salvar');
      return;
    }

    const cleanedData = Object.entries(formData).reduce((acc, [key, values]) => {
      acc[key as ToolkitSectionId] = (values as string[]).filter((v) => v.trim() !== '');
      return acc;
    }, {} as SelfEvaluationData);

    const competencies = competencyCategories.flatMap((category) =>
      category.items.map((item) => {
        let categoryType: 'technical' | 'behavioral' | 'deliveries';
        if (category.id === 'competencias-tecnicas') categoryType = 'technical';
        else if (category.id === 'competencias-comportamentais') categoryType = 'behavioral';
        else categoryType = 'deliveries';

        return {
          criterion_name: item.name,
          criterion_description: item.description,
          name: item.name,
          description: item.description,
          category: categoryType,
          score: competencyScores[item.name] || competencyScores[item.id] || 0,
          written_response: '',
        };
      }),
    );

    setIsSaving(true);
    try {
      await saveSelfEvaluation({
        cycleId: currentCycle.id,
        employeeId: user.id,
        competencies,
        toolkit: {
          knowledge: cleanedData.conhecimentos,
          tools: cleanedData.ferramentas,
          strengths_internal: cleanedData.forcasInternas,
          qualities: cleanedData.qualidades,
        },
      });
      clearAutoSave();
      toast.success('Autoavaliação completa salva com sucesso!');
      navigate('/');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
          duration: 5000,
          icon: '🔒',
        });
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        toast.error('Você não tem permissão para realizar esta ação.');
      } else if (error.response?.status === 500) {
        toast.error('Erro no servidor. Por favor, tente novamente em alguns instantes.');
      } else if (error.request) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao salvar autoavaliação. Por favor, tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isAdminDemo,
    currentCycle,
    user,
    competencyCategories,
    competencyScores,
    formData,
    saveSelfEvaluation,
    clearAutoSave,
    navigate,
  ]);

  const isCycleInValidPeriod = useCallback(() => {
    if (!currentCycle) return false;
    const today = new Date();
    return today >= new Date(currentCycle.start_date) && today <= new Date(currentCycle.end_date);
  }, [currentCycle]);

  const getCyclePeriodMessage = useCallback(() => {
    if (!currentCycle) return null;
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    if (today < startDate) {
      return {
        type: 'warning' as const,
        message: `O período de avaliação iniciará em ${formatDateBR(currentCycle.start_date)}`,
      };
    }
    if (today > endDate) {
      return {
        type: 'error' as const,
        message: `O período de avaliação encerrou em ${formatDateBR(currentCycle.end_date)}`,
      };
    }
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 7) {
      return {
        type: 'warning' as const,
        message: `Atenção: ${daysRemaining} dias restantes para completar a avaliação`,
      };
    }
    return null;
  }, [currentCycle]);

  const totalCompetencies = competencyCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const competencyProgress =
    totalCompetencies > 0 ? (Object.keys(competencyScores).length / totalCompetencies) * 100 : 0;

  return {
    // contexto
    navigate,
    profile,
    currentCycle,
    loading,
    isAdminDemo,
    // estado
    viewMode,
    hasExistingEvaluation,
    existingEvaluationData,
    currentStep,
    setCurrentStep,
    formData,
    competencyScores,
    completedSections,
    competencyCategories,
    isSaving,
    lastSaved,
    validationErrors,
    // handlers
    addField,
    removeField,
    updateField,
    handleCompetencyScore,
    handleSave,
    // guards/derivados
    isCycleInValidPeriod,
    getCyclePeriodMessage,
    totalCompetencies,
    competencyProgress,
  };
}
