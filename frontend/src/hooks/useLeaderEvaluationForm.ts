import { useState, useEffect, useCallback, useRef, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Target, Award } from 'lucide-react';
import { useEvaluation } from './useEvaluation';
import { useAuth } from '../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../types/evaluation.types';
import { pdiService } from '../services/pdiService';
import { evaluationService } from '../services/evaluation.service';
import { formatDateBR } from '../utils/date';

export interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

export interface SectionProps {
  id: string;
  title: string;
  weight: number;
  expanded: boolean;
  icon: ElementType;
  gradient: string;
  darkGradient: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
  items: CompetencyItem[];
}

export interface PotentialItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

export interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

export interface PdiData {
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

export type Prazo = 'curto' | 'medio' | 'longo';
export type PrazoKey = 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos';

export const PRAZO_MAP: Record<Prazo, PrazoKey> = {
  curto: 'curtosPrazos',
  medio: 'mediosPrazos',
  longo: 'longosPrazos',
};

export function getQuadrantDescription(quadrant?: string): string {
  const descriptions: Record<string, string> = {
    A1: 'Alto Potencial - Alta performancee',
    A2: 'Alto Potencial - Média performance',
    A3: 'Alto Potencial - Baixa performance',
    B1: 'Médio Potencial - Alta performance',
    B3: 'Médio Potencial - Baixa performance',
    C1: 'Baixo Potencial - Alta performance',
    C2: 'Baixo Potencial - Média performance',
    C3: 'Baixo Potencial - Baixa performance',
  };
  return quadrant ? descriptions[quadrant] || 'Não avaliado' : 'Não avaliado';
}

export function getQuadrantColor(quadrant?: string): string {
  if (!quadrant) return 'bg-secondary text-muted-foreground';
  const colors: Record<string, string> = {
    A1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    A2: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    A3: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    B1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    B2: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    B3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    C1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    C2: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    C3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[quadrant] || 'bg-secondary text-muted-foreground';
}

/**
 * Toda a lógica da Avaliação do Líder — extraída de LeaderEvaluation.tsx e das
 * sub-lógicas de EvaluationSection/PotentialAndPDI, mais o efeito nine-box do
 * header. Payloads e chaves de localStorage inalterados.
 */
export function useLeaderEvaluationForm() {
  const navigate = useNavigate();
  const {
    currentCycle,
    saveLeaderEvaluation,
    loadSubordinates,
    subordinates,
    deliveriesCriteria,
    getNineBoxByEmployeeId,
  } = useEvaluation();
  const { user, profile } = useAuth();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  const [existingEvaluationData, setExistingEvaluationData] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRestoringData, setIsRestoringData] = useState(false);
  const autoSaveRestoredRef = useRef<string | null>(null);

  const isAdminDemo = user?.email === 'admintop@sistema.com';

  const getStorageKey = useCallback(() => {
    if (!currentCycle?.id || !selectedEmployeeId || !profile?.id) return null;
    return `leader_evaluation_autosave_${currentCycle.id}_${selectedEmployeeId}_${profile.id}`;
  }, [currentCycle?.id, selectedEmployeeId, profile?.id]);

  const [sections, setSections] = useState<SectionProps[]>([]);

  // Init sections
  useEffect(() => {
    const organizationalCompetencies =
      deliveriesCriteria.length > 0 ? deliveriesCriteria : EVALUATION_COMPETENCIES.deliveries;

    const toItems = (arr: { name: string; description: string }[]) =>
      arr.map((comp) => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
        score: undefined,
      }));

    const base = {
      gradient: 'from-lime to-lime-deep',
      darkGradient: 'dark:from-lime dark:to-lime-deep',
      bgColor: 'bg-lime/10',
      darkBgColor: 'dark:bg-lime/10',
      borderColor: 'border-lime/30',
      darkBorderColor: 'dark:border-lime/30',
    };

    setSections([
      {
        id: 'technical',
        title: 'Competências Técnicas',
        weight: 50,
        expanded: true,
        icon: BookOpen,
        ...base,
        items: toItems(EVALUATION_COMPETENCIES.technical),
      },
      {
        id: 'behavioral',
        title: 'Competências Comportamentais',
        weight: 30,
        expanded: false,
        icon: Target,
        ...base,
        items: toItems(EVALUATION_COMPETENCIES.behavioral),
      },

      {
        id: 'organizational',
        title: 'Competências Organizacionais',
        weight: 20,
        expanded: false,
        icon: Award,
        ...base,
        items: toItems(organizationalCompetencies as any),
      },
    ]);
  }, [deliveriesCriteria]);

  const [potentialItems, setPotentialItems] = useState<PotentialItem[]>([
    {
      id: 'pot1',
      name: 'Potencial para função subsequente',
      description:
        'O que você enxerga como potencial máximo deste parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o performancee e a motivação sustentados até hoje?',
      score: undefined,
    },
    {
      id: 'pot2',
      name: 'Aprendizado contínuo',
      description:
        'Sobre o aprendizado contínuo: percebo que este busca o desenvolvimento pessoal, profissional e o aprimoramento de seus conhecimentos técnicos e acadêmicos.',
      score: undefined,
    },
    {
      id: 'pot3',
      name: 'Alinhamento com Código Cultural',
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da empresa.',
      score: undefined,
    },
    {
      id: 'pot4',
      name: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
      score: undefined,
    },
  ]);

  const [pdiData, setPdiData] = useState<PdiData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: [],
  });

  // Load subordinates
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSubordinates();
      setLoading(false);
    };
    loadData();
  }, [loadSubordinates]);

  // Restore auto-save (apenas scores das sections; strip de icon preservado no save)
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || hasExistingEvaluation || viewMode === 'view' || sections.length === 0)
      return;
    if (autoSaveRestoredRef.current === storageKey) return;

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setIsRestoringData(true);
        autoSaveRestoredRef.current = storageKey;
        const parsed = JSON.parse(savedData);

        if (
          parsed.sections &&
          Array.isArray(parsed.sections) &&
          parsed.sections.every((s: any) => s && s.id && Array.isArray(s.items))
        ) {
          setSections((prev) =>
            prev.map((section) => {
              const savedSection = parsed.sections.find((s: any) => s.id === section.id);
              if (!savedSection) return section;
              return {
                ...section,
                expanded: savedSection.expanded ?? section.expanded,
                items: section.items.map((item) => {
                  const savedItem = savedSection.items.find((i: any) => i.id === item.id);
                  return savedItem ? { ...item, score: savedItem.score } : item;
                }),
              };
            }),
          );
        }

        if (parsed.potentialItems && Array.isArray(parsed.potentialItems)) {
          setPotentialItems(parsed.potentialItems);
        }
        if (parsed.pdiData && typeof parsed.pdiData === 'object') {
          setPdiData((prev) => ({ ...prev, ...parsed.pdiData }));
        }
        if (parsed.currentStep && typeof parsed.currentStep === 'number') {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.timestamp) setLastSaved(new Date(parsed.timestamp));

        toast.success('Dados restaurados automaticamente', { icon: '💾', duration: 3000 });
      } catch (error) {
        console.error('Erro ao restaurar auto-save:', error);
        localStorage.removeItem(storageKey);
      } finally {
        setIsRestoringData(false);
      }
    } else {
      autoSaveRestoredRef.current = storageKey;
    }
  }, [getStorageKey, hasExistingEvaluation, viewMode, sections.length]);

  // Save auto-save (strip icon)
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || viewMode === 'view' || hasExistingEvaluation || isRestoringData) return;

    const hasSectionScores = sections.some((s) => s.items.some((i) => i.score !== undefined));
    const hasPotentialScores = potentialItems.some((i) => i.score !== undefined);
    const hasPdiItems =
      pdiData.curtosPrazos.length > 0 ||
      pdiData.mediosPrazos.length > 0 ||
      pdiData.longosPrazos.length > 0;

    if (hasSectionScores || hasPotentialScores || hasPdiItems) {
      const serializableSections = sections.map(({ icon: _icon, ...rest }) => rest);
      const dataToSave = {
        sections: serializableSections,
        potentialItems,
        pdiData,
        currentStep,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    }
  }, [
    sections,
    potentialItems,
    pdiData,
    currentStep,
    getStorageKey,
    viewMode,
    hasExistingEvaluation,
    isRestoringData,
  ]);

  const clearAutoSave = useCallback(() => {
    const storageKey = getStorageKey();
    if (storageKey) localStorage.removeItem(storageKey);
  }, [getStorageKey]);

  const loadExistingPDI = async (employeeId: string) => {
    try {
      const existingPDI = await pdiService.getPDI(employeeId);
      if (existingPDI) {
        const transformedPDI = pdiService.transformPDIDataFromAPI(existingPDI);
        setPdiData((prev) => ({
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
    }
  };

  // Check existing evaluation + populate PDI on employee selection
  useEffect(() => {
    const checkAndPopulate = async () => {
      if (!selectedEmployeeId) {
        setIsLoadingEmployee(false);
        return;
      }
      autoSaveRestoredRef.current = null;

      const employeeProfile = subordinates.find((sub) => sub.id === selectedEmployeeId);
      if (employeeProfile) {
        setPdiData((prev) => ({
          ...prev,
          colaboradorId: employeeProfile.id,
          colaborador: employeeProfile.name,
          cargo: employeeProfile.position,
          departamento: Array.isArray(employeeProfile.departments)
            ? employeeProfile.departments.map((dep) => dep.name).join(', ')
            : employeeProfile.departments || 'Não definido',
          periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          dataCriacao: prev.dataCriacao || new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        }));
      }

      if (currentCycle) {
        setIsLoadingEmployee(true);
        try {
          const response = await evaluationService.getLeaderEvaluations(
            selectedEmployeeId,
            currentCycle.id,
          );
          if (response && response.length > 0) {
            const existingEval = response[0] as any;
            setHasExistingEvaluation(true);
            setExistingEvaluationData(existingEval);
            setViewMode('view');

            toast.success(
              `Visualizando avaliação salva (Nota Final: ${existingEval.final_score?.toFixed(1) || 'N/A'})`,
              { duration: 4000 },
            );

            if (existingEval.evaluation_competencies) {
              const byCat = (cat: string) =>
                existingEval.evaluation_competencies.filter((c: any) => c.category === cat);
              const technicalComps = byCat('technical');
              const behavioralComps = byCat('behavioral');
              const deliveriesComps = byCat('deliveries');

              setSections((prev) =>
                prev.map((section) => {
                  const comps =
                    section.id === 'technical'
                      ? technicalComps
                      : section.id === 'behavioral'
                        ? behavioralComps
                        : deliveriesComps;
                  return {
                    ...section,
                    items: section.items.map((item) => {
                      const matchingComp = comps.find((c: any) => c.criterion_name === item.name);
                      return { ...item, score: matchingComp?.score };
                    }),
                  };
                }),
              );
            }

            if (existingEval.potential_score) {
              setPotentialItems((prev) =>
                prev.map((item, idx) => ({
                  ...item,
                  score: idx === 0 ? existingEval.potential_score : item.score,
                })),
              );
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
        } finally {
          setIsLoadingEmployee(false);
        }

        await loadExistingPDI(selectedEmployeeId);
      }
    };
    checkAndPopulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle, selectedEmployeeId]);

  // Nine-box → pdiData (efeito antes no LeaderEvaluationHeader)
  const employeeNineBox = selectedEmployeeId
    ? getNineBoxByEmployeeId(selectedEmployeeId)
    : undefined;
  useEffect(() => {
    if (employeeNineBox) {
      setPdiData((prev) => ({
        ...prev,
        nineBoxQuadrante: employeeNineBox.nine_box_position,
        nineBoxDescricao: getQuadrantDescription(employeeNineBox.nine_box_position),
      }));
    }
  }, [employeeNineBox]);

  // ------- Cálculos -------
  const calculatePotentialScores = useCallback(() => {
    const scores = potentialItems
      .filter((item) => item.score !== undefined)
      .map((item) => item.score || 0);
    if (scores.length === 0) return { results: 0, agility: 0, relationships: 0, final: 0 };
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      results: potentialItems[0]?.score || 0,
      agility: potentialItems[1]?.score || 0,
      relationships: ((potentialItems[2]?.score || 0) + (potentialItems[3]?.score || 0)) / 2,
      final: average,
    };
  }, [potentialItems]);

  const canProceedToStep2 = useCallback(
    () => sections.every((s) => s.items.every((i) => i.score !== undefined)),
    [sections],
  );
  const canProceedToStep3 = useCallback(
    () => potentialItems.every((i) => i.score !== undefined),
    [potentialItems],
  );

  // ------- Mutadores -------
  const setSectionScore = useCallback((sectionId: string, itemId: string, score: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, score } : it)) }
          : s,
      ),
    );
  }, []);

  const handlePotentialScoreChange = useCallback((itemId: string, score: number) => {
    setPotentialItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, score } : it)));
  }, []);

  const addPdiItem = useCallback((draft: Omit<ActionItem, 'id'> & { prazo: Prazo }) => {
    if (
      !draft.competencia.trim() ||
      !draft.comoDesenvolver.trim() ||
      !draft.resultadosEsperados.trim() ||
      !draft.prazo
    ) {
      toast.error(
        'Preencha todos os campos obrigatórios: Competência, Como Desenvolver e Resultados Esperados.',
      );
      return false;
    }
    const newItem: ActionItem = {
      id: Date.now().toString(),
      competencia: draft.competencia.trim(),
      calendarizacao: draft.calendarizacao.trim() || 'A definir',
      comoDesenvolver: draft.comoDesenvolver.trim(),
      resultadosEsperados: draft.resultadosEsperados.trim(),
      status: draft.status || '1',
      observacao: draft.observacao.trim(),
    };
    const key = PRAZO_MAP[draft.prazo];
    setPdiData((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
    toast.success(
      `Item adicionado ao PDI de ${draft.prazo === 'curto' ? 'Curto' : draft.prazo === 'medio' ? 'Médio' : 'Longo'} Prazo!`,
    );
    return true;
  }, []);

  const removePdiItem = useCallback((idToRemove: string, prazo: Prazo) => {
    const key = PRAZO_MAP[prazo];
    setPdiData((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== idToRemove) }));
    toast.success('Item de PDI removido.');
  }, []);

  const updateActionItem = useCallback(
    (category: PrazoKey, id: string, field: keyof ActionItem, value: string) => {
      setPdiData((prev) => ({
        ...prev,
        [category]: prev[category].map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  // ------- Submit -------
  const handleSubmit = useCallback(async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      if (isAdminDemo) {
        toast('Modo demonstração — avaliação não enviada', { icon: '🎬' });
        navigate('/');
        return;
      }
      toast.error('Dados incompletos para enviar');
      return;
    }
    const allCompetenciesScored = sections.every((s) =>
      s.items.every((i) => i.score !== undefined),
    );
    const allPotentialScored = potentialItems.every((i) => i.score !== undefined);
    if (!allCompetenciesScored || !allPotentialScored) {
      toast.error('Complete todas as avaliações de competências e potencial antes de enviar');
      return;
    }
    const totalPdiItems =
      pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;
    if (totalPdiItems === 0) {
      toast.error(
        'Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de enviar.',
      );
      return;
    }

    const competencies = sections.flatMap((section) =>
      section.items.map((item) => {
        let category: 'technical' | 'behavioral' | 'deliveries';
        if (section.id === 'technical') category = 'technical';
        else if (section.id === 'behavioral') category = 'behavioral';
        else category = 'deliveries';
        return {
          id: item.id,
          criterion_name: item.name,
          criterion_description: item.description,
          category,
          score: item.score!,
          weight: 1.0,
        };
      }),
    );

    setIsSaving(true);
    try {
      const potentialDetails: Record<string, { name: string; score: number }> = {};
      potentialItems.forEach((item) => {
        if (item.score !== undefined) {
          potentialDetails[item.id] = { name: item.name, score: item.score };
        }
      });

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
          observations: `Potencial: ${potentialItems.map((item) => `${item.name}: ${item.score}`).join(', ')}`,
        },
      });

      const pdiParams = pdiService.transformPDIDataForAPI(pdiData, currentCycle.id, undefined);
      await pdiService.savePDI(pdiParams);

      clearAutoSave();
      toast.success('Avaliação e PDI salvos com sucesso!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setIsSaving(false);
    }
  }, [
    isAdminDemo,
    currentCycle,
    selectedEmployeeId,
    profile?.id,
    sections,
    potentialItems,
    pdiData,
    saveLeaderEvaluation,
    calculatePotentialScores,
    clearAutoSave,
    navigate,
  ]);

  // ------- Guards -------
  const isCycleInValidPeriod = useCallback((): boolean => {
    if (!currentCycle) return false;
    const today = new Date();
    return today >= new Date(currentCycle.start_date) && today <= new Date(currentCycle.end_date);
  }, [currentCycle]);

  const getCyclePeriodMessage = useCallback((): {
    type: 'warning' | 'error';
    message: string;
  } | null => {
    if (!currentCycle) return null;
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    if (today < startDate) {
      return {
        type: 'warning',
        message: `O período de avaliação iniciará em ${formatDateBR(currentCycle.start_date)}`,
      };
    }
    if (today > endDate) {
      return {
        type: 'error',
        message: `O período de avaliação encerrou em ${formatDateBR(currentCycle.end_date)}`,
      };
    }
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 7) {
      return {
        type: 'warning',
        message: `Atenção: ${daysRemaining} dias restantes para completar as avaliações`,
      };
    }
    return null;
  }, [currentCycle]);

  const selectedEmployee = subordinates.find((emp) => emp.id === selectedEmployeeId);

  return {
    navigate,
    profile,
    currentCycle,
    subordinates,
    // estado
    selectedEmployeeId,
    setSelectedEmployeeId,
    currentStep,
    setCurrentStep,
    loading,
    isLoadingEmployee,
    hasExistingEvaluation,
    existingEvaluationData,
    isSaving,
    viewMode,
    lastSaved,
    isAdminDemo,
    sections,
    potentialItems,
    pdiData,
    employeeNineBox,
    selectedEmployee,
    // mutadores
    setSectionScore,
    handlePotentialScoreChange,
    addPdiItem,
    removePdiItem,
    updateActionItem,
    // cálculos
    calculatePotentialScores,
    canProceedToStep2,
    canProceedToStep3,
    // submit/guards
    handleSubmit,
    isCycleInValidPeriod,
    getCyclePeriodMessage,
  };
}
