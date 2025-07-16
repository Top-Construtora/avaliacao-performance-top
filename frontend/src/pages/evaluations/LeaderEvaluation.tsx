import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluation } from '../hooks/useEvaluation'; // Assuming useEvaluation provides employees, getNineBoxByEmployeeId, savePDI
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/user.service';
import { evaluationService } from '../services/evaluation.service';
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
  ArrowRight,
  Zap,
  Lightbulb,
  HeartHandshake,
  Info,
  Rocket,
  BookOpen,
  Building,
  Eye,
  FileText,
  Plus,
  X,
  ChevronUp, // Added for section toggling
  MessageSquare, // Added for observation icon
  Grid3x3, // Added for Nine Box icon
  Edit, // Added for edit button on PDI items
  Trash2 // Added for delete button on PDI items
} from 'lucide-react';
import type { User } from '../types/user';
import { EVALUATION_COMPETENCIES } from '../types/evaluation.types';
import type { WrittenFeedback } from '../types/evaluation.types';

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

// NEW: Aligned with ActionItem structure from provided code
interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string; // Changed from dataInicio/dataFim to single string
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5'; // Numeric status
  observacao: string;
}

// NEW: Aligned with ActionPlanData structure from provided code
interface PdiData {
  id?: string; // Optional as it might not exist on new PDI
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string; // Added Nine Box fields
  nineBoxDescricao?: string; // Added Nine Box fields
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string; // Optional as it might not exist on new PDI
  dataAtualizacao?: string; // Optional as it might not exist on new PDI
}

const LeaderEvaluation = () => {
  const navigate = useNavigate();
  // Updated useEvaluation hook usage to match the provided ActionPlan component's context
  const { currentCycle, saveLeaderEvaluation, checkExistingEvaluation, loadSubordinates, subordinates, getNineBoxByEmployeeId, savePDI } = useEvaluation();
  const { profile } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Competências, 2: Potencial, 3: PDI
  const [loading, setLoading] = useState(true);
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // NEW: Initializing pdiData with the new structure
  const [pdiData, setPdiData] = useState<PdiData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, // Default period
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });

  // NEW: State for a new PDI item being added/edited in the form
  const [newPdiItem, setNewPdiItem] = useState<Omit<ActionItem, 'id'> & { prazo: 'curto' | 'medio' | 'longo' | '' }>({
    competencia: '',
    calendarizacao: '',
    comoDesenvolver: '',
    resultadosEsperados: '',
    status: '1',
    observacao: '',
    prazo: '' // Field to select the term (short, medium, long)
  });

  // NEW: State to control section expansion for PDI categories
  const [expandedPdiSections, setExpandedPdiSections] = useState({
    curto: true, // Curto Prazo is expanded by default as per image
    medio: false,
    longo: false,
  });

  // NEW: State to control the visibility of the PDI add form
  const [editingPdiItemPrazo, setEditingPdiItemPrazo] = useState<'curto' | 'medio' | 'longo' | null>(null);

  // Load subordinates on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSubordinates();
      setLoading(false);
    };
    loadData();
  }, [loadSubordinates]);

  // Check for existing evaluation and populate PDI data when employee is selected
  useEffect(() => {
    const checkAndPopulate = async () => {
      if (currentCycle && selectedEmployeeId) {
        const exists = await checkExistingEvaluation(currentCycle.id, selectedEmployeeId, 'leader');
        setHasExistingEvaluation(exists);
        if (exists) {
          toast.error('Já existe uma avaliação para este colaborador neste ciclo');
          setSelectedEmployeeId('');
        }
      }

      if (selectedEmployeeId) {
        const employeeProfile = subordinates.find(sub => sub.id === selectedEmployeeId);
        const employeeNineBox = getNineBoxByEmployeeId(selectedEmployeeId); // Get Nine Box data

        if (employeeProfile) {
          setPdiData(prev => ({
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
  }, [currentCycle, selectedEmployeeId, checkExistingEvaluation, subordinates, getNineBoxByEmployeeId]);

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
      icon: Users,
      gradient: 'from-secondary-500 to-secondary-600',
      darkGradient: 'dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50',
      darkBgColor: 'dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200',
      darkBorderColor: 'dark:border-secondary-700',
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
      icon: Briefcase,
      gradient: 'from-accent-500 to-accent-600',
      darkGradient: 'dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50',
      darkBgColor: 'dark:bg-accent-900/20',
      borderColor: 'border-accent-200',
      darkBorderColor: 'dark:border-accent-700',
      items: EVALUATION_COMPETENCIES.deliveries.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
        score: undefined
      }))
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
    2: { label: 'Em Desenvolvimento', color: 'bg-accent-500', darkColor: 'dark:bg-accent-600' },
    3: { label: 'Satisfatório', color: 'bg-primary-500', darkColor: 'dark:bg-primary-600' },
    4: { label: 'Excepcional', color: 'bg-green-500', darkColor: 'dark:bg-green-600' }
  };

  const potentialRatingLabels = {
    1: { label: 'Não atende o esperado', color: 'bg-red-500', darkColor: 'dark:bg-red-600' },
    2: { label: 'Em desenvolvimento', color: 'bg-accent-500', darkColor: 'dark:bg-accent-600' },
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

  // NEW: Toggle PDI section expansion
  const togglePdiSection = (sectionKey: 'curto' | 'medio' | 'longo') => {
    setExpandedPdiSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
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
    } else if (currentStep === 2) {
      const scoredItems = potentialItems.filter(item => item.score !== undefined).length;
      return potentialItems.length > 0 ? (scoredItems / potentialItems.length) * 100 : 0;
    } else {
      // NEW: PDI progress based on completed items
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
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && canProceedToStep3()) {
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

  const handleSave = async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      toast.error('Dados incompletos para salvar');
      return;
    }

    // Save as draft - only save what's been filled so far
    const competencies = sections.flatMap(section =>
      section.items
        .filter(item => item.score !== undefined)
        .map(item => {
          const originalComp = EVALUATION_COMPETENCIES[
            section.id === 'technical' ? 'technical' :
            section.id === 'behavioral' ? 'behavioral' : 'deliveries'
          ].find(c => c.name === item.name);

          return {
            id: item.id,
            criterion_name: item.name,
            criterion_description: item.description,
            category: originalComp?.category || 'technical',
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
      ? potentialScores.final
      : undefined;

    setIsSaving(true);
    try {
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: potentialScore || 0,
        feedback: {
          strengths: '',
          improvements: '',
          observations: 'Avaliação salva como rascunho'
        }
      });

      // NEW: Save PDI using the new structure
      if (totalPdiItems > 0) {
        const pdiToSave: PdiData = {
          ...pdiData,
          id: pdiData.id || Date.now().toString(), // Ensure ID exists for new PDI
          dataCriacao: pdiData.dataCriacao || new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        };
        await savePDI(pdiToSave); // Using the savePDI from useEvaluation
      }

      toast.success('Avaliação salva como rascunho');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setIsSaving(false);
    }
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

    // Prepare competencies for the new system
    const competencies = sections.flatMap(section =>
      section.items.map(item => {
        const originalComp = EVALUATION_COMPETENCIES[
          section.id === 'technical' ? 'technical' :
          section.id === 'behavioral' ? 'behavioral' : 'deliveries'
        ].find(c => c.name === item.name);

        return {
          id: item.id,
          criterion_name: item.name,
          criterion_description: item.description,
          category: originalComp?.category || 'technical',
          score: item.score!,
          weight: 1.0
        };
      })
    );

    setIsSaving(true);
    try {
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: potentialScores.final,
        feedback: {
          strengths: 'Avaliação completa',
          improvements: '',
          observations: `Potencial: ${potentialItems.map(item => `${item.name}: ${item.score}`).join(', ')}`
        }
      });

      // NEW: Submit PDI using the new structure
      const pdiToSave: PdiData = {
        ...pdiData,
        id: pdiData.id || Date.now().toString(), // Ensure ID exists for new PDI
        dataCriacao: pdiData.dataCriacao || new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      await savePDI(pdiToSave); // Using the savePDI from useEvaluation

      setShowSuccess(true);
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

  // NEW: Helper function to create a new empty ActionItem
  const createNewActionItem = (): ActionItem => ({
    id: Date.now().toString(),
    competencia: '',
    calendarizacao: '',
    comoDesenvolver: '',
    resultadosEsperados: '',
    status: '1', // Default status 'Não iniciado'
    observacao: ''
  });

  // NEW: Handle changes in the new PDI item form
  const handleNewPdiItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPdiItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NEW: Add a new PDI item to the correct category
  const addPdiItem = () => {
    if (!newPdiItem.competencia.trim() || !newPdiItem.comoDesenvolver.trim() || !newPdiItem.resultadosEsperados.trim() || !newPdiItem.prazo) {
      toast.error('Preencha todos os campos obrigatórios e selecione o prazo para o item de desenvolvimento.');
      return;
    }

    const newItem = { ...newPdiItem, id: Date.now().toString() };

    setPdiData(prev => {
      if (newItem.prazo === 'curto') {
        return { ...prev, curtosPrazos: [...prev.curtosPrazos, newItem] };
      } else if (newItem.prazo === 'medio') {
        return { ...prev, mediosPrazos: [...prev.mediosPrazos, newItem] };
      } else if (newItem.prazo === 'longo') {
        return { ...prev, longosPrazos: [...prev.longosPrazos, newItem] };
      }
      return prev;
    });

    setNewPdiItem({ // Reset form
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacao: '',
      prazo: ''
    });
    setEditingPdiItemPrazo(null); // Hide form after adding
  };

  // NEW: Remove a PDI item from a specific category
  const removePdiItem = (idToRemove: string, prazo: 'curto' | 'medio' | 'longo') => {
    setPdiData(prev => {
      if (prazo === 'curto') {
        return { ...prev, curtosPrazos: prev.curtosPrazos.filter(item => item.id !== idToRemove) };
      } else if (prazo === 'medio') {
        return { ...prev, mediosPrazos: prev.mediosPrazos.filter(item => item.id !== idToRemove) };
      } else if (prazo === 'longo') {
        return { ...prev, longosPrazos: prev.longosPrazos.filter(item => item.id !== idToRemove) };
      }
      return prev;
    });
  };

  // NEW: Update a specific field of an ActionItem
  const updateActionItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: keyof ActionItem,
    value: any
  ) => {
    setPdiData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // NEW: Function to open the PDI add form and pre-set prazo
  const openAddPdiItemForm = (prazo: 'curto' | 'medio' | 'longo') => {
    setNewPdiItem(prev => ({ ...prev, prazo }));
    setEditingPdiItemPrazo(prazo);
    setExpandedPdiSections(prev => ({ ...prev, [prazo]: true })); // Expand section when adding an item
    // Optional: scroll to the form after opening
    const formElement = document.getElementById('pdi-add-form');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // NEW: Function to close the PDI add form
  const closeAddPdiItemForm = () => {
    setEditingPdiItemPrazo(null);
    setNewPdiItem({ // Reset form data
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacao: '',
      prazo: ''
    });
  };

  // NEW: Nine Box helper functions
  const getQuadrantDescription = (quadrant?: string) => {
    const descriptions: Record<string, string> = {
      'A1': 'Alto Potencial - Alto Desempenho',
      'A2': 'Alto Potencial - Médio Desempenho',
      'A3': 'Alto Potencial - Baixo Desempenho',
      'B1': 'Médio Potencial - Alto Desempenho',
      'B2': 'Médio Potencial - Médio Desempenho',
      'B3': 'Médio Potencial - Baixo Desempenho',
      'C1': 'Baixo Potencial - Alto Desempenho',
      'C2': 'Baixo Potencial - Médio Desempenho',
      'C3': 'Baixo Potencial - Baixo Desempenho'
    };
    return quadrant ? descriptions[quadrant] || 'Não avaliado' : 'Não avaliado';
  };

  const getQuadrantColor = (quadrant?: string) => {
    if (!quadrant) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'A2': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      'A3': 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
      'B1': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      'B2': 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
      'B3': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'C1': 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
      'C2': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      'C3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };

    return colors[quadrant] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  // NEW: Status options for PDI items
  const statusOptions = [
    { value: '1', label: 'Não iniciado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600' },
    { value: '2', label: 'Iniciado', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700' },
    { value: '3', label: 'Em andamento', color: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border-accent-300 dark:border-accent-700' },
    { value: '4', label: 'Quase concluído', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
    { value: '5', label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' }
  ];

  // NEW: Categories configuration for PDI sections
  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '0-6 meses',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      description: 'Ações imediatas e de rápido impacto'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '6-12 meses',
      icon: Target,
      gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      description: 'Desenvolvimento contínuo e estruturado'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '12-24 meses',
      icon: Rocket,
      gradient: 'from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50',
      darkBgColor: 'dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      description: 'Visão estratégica e crescimento sustentável'
    }
  ];

  // NEW: Render function for PDI action items, adapted from ActionPlan
  const renderActionItems = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const categoryData = categories.find(cat => cat.key === category)!;
    const items = pdiData[category];
    const isExpanded = expandedPdiSections[category.replace('Prazos', '') as 'curto' | 'medio' | 'longo']; // Adjusted to match state key

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <button
          onClick={() => togglePdiSection(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${categoryData.bgColor} border-b ${categoryData.borderColor} hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${categoryData.iconBg} shadow-md`}>
                <categoryData.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100">{categoryData.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">{categoryData.subtitle} • {categoryData.description}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:hidden">{categoryData.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">{items.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">itens</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
              className="p-4 sm:p-6 lg:p-8"
            >
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">Nenhum item de desenvolvimento adicionado</p>
                    <Button
                      variant="outline"
                      onClick={() => openAddPdiItemForm(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                      icon={<Plus size={16} />}
                      size="sm"
                    >
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <>
                    {items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-600"
                      >
                        {/* Header do Item */}
                        <div className="flex items-start justify-between mb-4 sm:mb-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${categoryData.iconBg} flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md`}>
                              {itemIndex + 1}
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Item de Desenvolvimento
                              </h4>
                              <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium border ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removePdiItem(item.id, category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                            className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          >
                            <X size={16} className="sm:hidden" />
                            <X size={20} className="hidden sm:block" />
                          </button>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          {/* Competência a desenvolver */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Competência a desenvolver
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                              value={item.competencia}
                              onChange={(e) => updateActionItem(category, item.id, 'competencia', e.target.value)}
                            />
                          </div>

                          {/* Calendarização */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                              Calendarização (Mês/Ano)
                            </label>
                            <input
                              type="month" // Changed to month for Mês/Ano format
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              value={item.calendarizacao}
                              onChange={(e) => updateActionItem(category, item.id, 'calendarizacao', e.target.value)}
                            />
                          </div>

                          {/* Como desenvolver as competências */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Lightbulb className="h-4 w-4 mr-2 text-accent-600 dark:text-accent-400" />
                              Como desenvolver as competências
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-accent-500 dark:focus:border-accent-400 focus:ring-accent-500 dark:focus:ring-accent-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                              value={item.comoDesenvolver}
                              onChange={(e) => updateActionItem(category, item.id, 'comoDesenvolver', e.target.value)}
                            />
                          </div>

                          {/* Resultados Esperados */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Resultados Esperados
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                              value={item.resultadosEsperados}
                              onChange={(e) => updateActionItem(category, item.id, 'resultadosEsperados', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                            {/* Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                Status
                              </label>
                              <select
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                                value={item.status}
                                onChange={(e) => updateActionItem(category, item.id, 'status', e.target.value as ActionItem['status'])}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Observação */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                                Observação
                              </label>
                              <textarea
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                                rows={2}
                                placeholder="Observações adicionais..."
                                value={item.observacao}
                                onChange={(e) => updateActionItem(category, item.id, 'observacao', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => openAddPdiItemForm(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                        icon={<Plus size={16} />}
                        className="border-2 border-dashed hover:border-solid"
                        size="sm"
                      >
                        Adicionar Novo Item
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);
  const employeeNineBox = getNineBoxByEmployeeId(selectedEmployeeId); // Get Nine Box data
  const progress = getProgress();

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
        message: `Atenção: ${daysRemaining} dias restantes para completar as avaliações`
      };
    }

    return null;
  };

  // Check if there's no active cycle or cycle is out of period
  if (!currentCycle || !isCycleInValidPeriod()) {
    const periodMessage = getCyclePeriodMessage();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-primary-500 dark:text-primary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {currentCycle && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
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
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

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
                {currentStep === 1 ? 'Etapa 1: Avalie as competências' :
                 currentStep === 2 ? 'Etapa 2: Avalie o potencial' :
                 'Etapa 3: Plano de Desenvolvimento Individual'}
              </p>
              {currentCycle && (
                <p className="text-xs text-gray-500 mt-1">
                  Ciclo: {currentCycle.title} | Prazo: {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Period Alert */}
          {getCyclePeriodMessage() && (
            <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
              getCyclePeriodMessage()?.type === 'error'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
            }`}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{getCyclePeriodMessage()?.message}</p>
            </div>
          )}

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
            <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o Colaborador
            </label>
            <div className="relative">
              <select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 text-sm sm:text-base appearance-none text-gray-700 dark:text-gray-200"
                disabled={loading}
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
              <Info className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
                  {Array.isArray(selectedEmployee.departments)
                    ? selectedEmployee.departments.length > 0
                      ? selectedEmployee.departments.map(dep => dep.name).join(', ')
                      : 'Não definido'
                    : selectedEmployee.departments || 'Não definido'}
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

        {/* Nine Box Result */}
        {selectedEmployee && employeeNineBox && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <Grid3x3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resultado Nine Box</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuadrantColor(pdiData.nineBoxQuadrante)}`}>
                    {pdiData.nineBoxQuadrante}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pdiData.nineBoxDescricao}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period for PDI */}
        {selectedEmployee && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              Período do PDI
            </label>
            <input
              type="text"
              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
              value={pdiData.periodo}
              onChange={(e) => setPdiData(prev => ({ ...prev, periodo: e.target.value }))}
              placeholder="Ex: 2024-2025"
            />
          </div>
        )}


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
            <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">PDI</span>
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
                          <span className="truncate">Competências Técnicas</span>
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
                        exit={{ opacity: 0, height: 0 }}
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
                  disabled={progress === 0 || isSaving || loading}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
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
                  { value: 2, color: 'bg-accent-500', darkColor: 'dark:bg-accent-600', bgColor: 'bg-accent-50', darkBgColor: 'dark:bg-accent-900/20', borderColor: 'border-accent-200', darkBorderColor: 'dark:border-accent-700' },
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
                      Complete todas as avaliações de potencial para prosseguir
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Avaliação de potencial completa! Prossiga para o PDI.
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
                  disabled={isSaving || loading}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  icon={<ArrowRight size={18} />}
                  size="lg"
                  disabled={!canProceedToStep3()}
                  className="w-full sm:w-auto"
                >
                  Próxima Etapa
                </Button>
              </div>
            </motion.div>
          </>
        )}
        {/* Step 3: PDI (Plano de Desenvolvimento Individual) */}
{selectedEmployeeId && currentStep === 3 && (
  <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Formulário para adicionar novo Item de Desenvolvimento (condicional) */}
      <AnimatePresence>
        {editingPdiItemPrazo && (
          <motion.div
            id="pdi-add-form" // Added ID for scrolling
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
                Adicionar Novo Item de Desenvolvimento
              </h3>
              <button
                onClick={closeAddPdiItemForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="competencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Lightbulb size={16} className="mr-1 text-accent-500" />
                  Competência a desenvolver
                </label>
                <input
                  type="text"
                  id="competencia"
                  name="competencia"
                  value={newPdiItem.competencia}
                  onChange={handleNewPdiItemChange}
                  placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calendarizacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Calendar size={16} className="mr-1 text-primary-500" />
                    Calendarização (Mês/Ano)
                  </label>
                  <input
                    type="month"
                    id="calendarizacao"
                    name="calendarizacao"
                    value={newPdiItem.calendarizacao}
                    onChange={handleNewPdiItemChange}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="comoDesenvolver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FileText size={16} className="mr-1 text-secondary-500" />
                  Como desenvolver as competências
                </label>
                <textarea
                  id="comoDesenvolver"
                  name="comoDesenvolver"
                  value={newPdiItem.comoDesenvolver}
                  onChange={handleNewPdiItemChange}
                  placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                ></textarea>
              </div>

              <div>
                <label htmlFor="resultadosEsperados" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <TrendingUp size={16} className="mr-1 text-green-500" />
                  Resultados Esperados
                </label>
                <textarea
                  id="resultadosEsperados"
                  name="resultadosEsperados"
                  value={newPdiItem.resultadosEsperados}
                  onChange={handleNewPdiItemChange}
                  placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <CheckCircle size={16} className="mr-1 text-cyan-500" />
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={newPdiItem.status}
                    onChange={handleNewPdiItemChange}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <MessageSquare size={16} className="mr-1 text-gray-500" />
                    Observação
                  </label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    value={newPdiItem.observacao}
                    onChange={handleNewPdiItemChange}
                    placeholder="Observações adicionais..."
                    rows={1}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                  ></textarea>
                </div>
              </div>
              <div>
                <label htmlFor="prazo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Calendar size={16} className="mr-1 text-orange-500" />
                  Prazo
                </label>
                <select
                  id="prazo"
                  name="prazo"
                  value={newPdiItem.prazo}
                  onChange={handleNewPdiItemChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                  disabled={!!editingPdiItemPrazo} // Disable if already pre-set by button click
                >
                  <option value="">Selecione o prazo...</option>
                  <option value="curto">Curto Prazo (0-6 meses)</option>
                  <option value="medio">Médio Prazo (6-12 meses)</option>
                  <option value="longo">Longo Prazo (12-24 meses)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={closeAddPdiItemForm}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={addPdiItem}
                  icon={<Plus size={18} />}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Adicionar Item
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* PDI Sections by Term */}
      {categories.map((category, index) => (
        <motion.div
          key={category.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
        >
          {renderActionItems(category.key)}
        </motion.div>
      ))}

    </motion.div>

    {/* Step 3 Action Buttons */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
    >
      <div className="flex items-center space-x-2 text-sm">
        {(pdiData.curtosPrazos.length === 0 && pdiData.mediosPrazos.length === 0 && pdiData.longosPrazos.length === 0) ? (
          <>
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">
              Adicione pelo menos um item de desenvolvimento para continuar
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-600 dark:text-green-400 font-medium">
              PDI definido! Total de {pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length} itens adicionados.
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
          disabled={isSaving || loading}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          icon={<Send size={18} />}
          size="lg"
          disabled={(pdiData.curtosPrazos.length === 0 && pdiData.mediosPrazos.length === 0 && pdiData.longosPrazos.length === 0) || isSaving || loading}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Enviando...' : 'Enviar Avaliação'}
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
              <Info className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-600 dark:text-secondary-400" />
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
