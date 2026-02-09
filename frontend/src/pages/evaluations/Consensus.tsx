import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { useEvaluation } from '../../hooks/useEvaluation';
import { pdiService } from '../../services/pdiService';
import { evaluationService } from '../../services/evaluation.service';
import { userService } from '../../services/user.service';
import PotentialAndPDI from '../../components/PotentialAndPDI';
import PDIViewer from '../../components/PDIViewer';
import { UserWithDetails } from '../../types/supabase';
import {
  ArrowLeft,
  Save,
  BookOpen,
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
  ChevronDown,
  ChevronUp,
  FileText,
  Brain,
  Wrench,
  Zap,
} from 'lucide-react';

interface ScoreMap {
  [key: string]: number;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'Técnica' | 'Comportamental' | 'Organizacional';
  icon: React.ElementType;
}

interface ToolkitData {
  knowledge: string[];
  tools: string[];
  strengths_internal: string[];
  qualities: string[];
}

// Define ActionItem and PdiData interfaces here to ensure consistency
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


const Consensus = () => {
  const navigate = useNavigate();
  const { deliveriesCriteria } = useEvaluation();

  const [leaders, setLeaders] = useState<UserWithDetails[]>([]);
  const [employees, setEmployees] = useState<UserWithDetails[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [consensusScores, setConsensusScores] = useState<ScoreMap>({});
  const [consensusObservations, setConsensusObservations] = useState<Record<string, string>>({});
  const [selfScores, setSelfScores] = useState<ScoreMap>({});
  const [leaderScores, setLeaderScores] = useState<ScoreMap>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPDI, setLoadingPDI] = useState(false);
  const [employeeToolkit, setEmployeeToolkit] = useState<ToolkitData | null>(null);

  // Estados para armazenar IDs das avaliações e nota de potencial
  const [selfEvaluationId, setSelfEvaluationId] = useState<string | null>(null);
  const [leaderEvaluationId, setLeaderEvaluationId] = useState<string | null>(null);
  const [potentialScore, setPotentialScore] = useState<number | null>(null);
  const [hasExistingConsensus, setHasExistingConsensus] = useState<boolean>(false);
  const [existingConsensusData, setExistingConsensusData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  
  // Novos estados para controle do PDI
  const [showPDI, setShowPDI] = useState(false);
  const [pdiViewMode, setPdiViewMode] = useState<'view' | 'edit'>('view');
  
  const [pdiData, setPdiData] = useState<PdiData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });


  const [criteria, setCriteria] = useState<Criterion[]>([
    // Competências Técnicas
    {
      id: 'gestao-conhecimento',
      name: 'GESTÃO DO CONHECIMENTO',
      description: 'Demonstra domínio técnico sobre a sua área de atuação e atua de maneira a favorecer o bom andamento de todos os processos e procedimentos.',
      category: 'Técnica',
      icon: Target
    },
    {
      id: 'orientacao-resultados',
      name: 'ORIENTAÇÃO A RESULTADOS',
      description: 'Atua com capacidade de focar na concretização dos objetivos, com intuito de garantir que os resultados sejam alcançados conforme o esperado. ',
      category: 'Técnica',
      icon: TrendingUp
    },
    {
      id: 'pensamento-critico',
      name: 'PENSAMENTO CRÍTICO',
      description: 'Capacidade de analisar cenários para buscar soluções superando desafios.',
      category: 'Técnica',
      icon: Target
    },
    {
      id: 'aderencia-processos',
      name: 'ADERÊNCIA AOS PROCESSOS',
      description: 'Trabalha em aderência aos processos de gestão da empresa, esforçando-se para compreender e atender os objetivos, cumprindo com os resutlados da área.',
      category: 'Técnica',
      icon: Target
    },
    // Competências Comportamentais
    {
      id: 'comunicacao',
      name: 'COMUNICAÇÃO',
      description: 'Possui capacidade de se expressar de forma clara e apropriada (seja escrita, verbal ou não verbal), entendo os questionamentos e sendo compreendido por seus colegas e clientes.',
      category: 'Comportamental',
      icon: Users
    },
    {
      id: 'inteligencia-emocional',
      name: 'INTELIGÊNCIA EMOCIONAL', 
      description: 'Apresenta capacidade de enfrentar situações de estresse e/ou pressão de forma paciente, educada e responsável.',
      category: 'Comportamental', 
      icon: Users 
    },
    { 
      id: 'colaboracao', 
      name: 'COLABORAÇÃO', 
      description: 'Possibilita entre o time uma troca de conhecimento e agilidade no cumprimento de metas e objetivos compartilhados, ou seja, trabalho em equipe.',
      category: 'Comportamental', 
      icon: Users 
    },
    {
      id: 'flexibilidade',
      name: 'FLEXIBILIDADE',
      description: 'Capaz de se adaptar a mudanças e/ou situações inesperadas.',
      category: 'Comportamental',
      icon: Users
    }
    // Competências Organizacionais serão carregadas dinamicamente do deliveriesCriteria
  ]);

  // Carregar competências organizacionais dinâmicas
  useEffect(() => {
    if (deliveriesCriteria && deliveriesCriteria.length > 0) {
      setCriteria(prevCriteria => {
        // Remover competências organizacionais antigas
        const withoutOrganizational = prevCriteria.filter(c => c.category !== 'Organizacional');

        // Adicionar competências organizacionais dinâmicas
        const organizationalCompetencies = deliveriesCriteria.map((comp: any) => ({
          id: comp.id,
          name: comp.name.toUpperCase(),
          description: comp.description,
          category: 'Organizacional' as const,
          icon: Award
        }));

        return [...withoutOrganizational, ...organizationalCompetencies];
      });
    }
  }, [deliveriesCriteria]);

  const categoryConfig = {
    'Técnica': {
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-600/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800'
    },
    'Comportamental': {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-700',
      gradient: 'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'
    },
    'Organizacional': {
      color: 'text-stone-700 dark:text-stone-600',
      bgColor: 'bg-stone-50 dark:bg-stone-900/20',
      borderColor: 'border-stone-200 dark:border-stone-700',
      gradient: 'from-stone-500 to-stone-600 dark:from-stone-700 dark:to-stone-800'
    }
  };

  const loadPdiForEmployee = useCallback(async (employeeId: string) => {
    try {
      const employeeProfile = employees.find(emp => emp.id === employeeId);

      // Tentar carregar o PDI, mas sem mostrar erro se não existir
      try {
        const pdi = await pdiService.getPDI(employeeId);

        if (pdi) {
          const transformedPDI = pdiService.transformPDIDataFromAPI(pdi);
          setPdiData({
            ...transformedPDI,
            colaborador: employeeProfile?.name || transformedPDI.colaborador,
            cargo: employeeProfile?.position || transformedPDI.cargo,
            departamento: Array.isArray(employeeProfile?.departments)
              ? employeeProfile.departments.map(dep => dep.name).join(', ')
              : employeeProfile?.departments || transformedPDI.departamento || 'Não definido',
          });
          setShowPDI(false); // Não mostrar automaticamente
          setPdiViewMode('view');
        } else {
          // Reset PDI data if no PDI is found
          setPdiData({
            colaboradorId: employeeId,
            colaborador: employeeProfile?.name || '',
            cargo: employeeProfile?.position || '',
            departamento: Array.isArray(employeeProfile?.departments)
              ? employeeProfile.departments.map(dep => dep.name).join(', ')
              : employeeProfile?.departments || 'Não definido',
            periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            curtosPrazos: [],
            mediosPrazos: [],
            longosPrazos: [],
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
          });
          setShowPDI(false);
          setPdiViewMode('edit'); // Modo criação se não existir PDI
        }
      } catch (pdiError: any) {
        // Se o erro for 404 ou similar, apenas configurar um PDI vazio
        setPdiData({
          colaboradorId: employeeId,
          colaborador: employeeProfile?.name || '',
          cargo: employeeProfile?.position || '',
          departamento: Array.isArray(employeeProfile?.departments)
            ? employeeProfile.departments.map(dep => dep.name).join(', ')
            : employeeProfile?.departments || 'Não definido',
          periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos: [],
          mediosPrazos: [],
          longosPrazos: [],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        });
        setShowPDI(false);
        setPdiViewMode('edit');
      }
    } catch (error) {
      console.error('Erro ao configurar PDI:', error);
      // Não mostrar toast de erro, apenas configurar silenciosamente
      setShowPDI(false);
    }
  }, [employees]);
  // Atualizar handleSavePDI para usar o novo serviço
  const handleSavePDI = async () => {
    if (!pdiData.colaboradorId) {
      toast.error('Selecione um colaborador para salvar o PDI.');
      return;
    }

    const allPdiActionItems = [
      ...pdiData.curtosPrazos,
      ...pdiData.mediosPrazos,
      ...pdiData.longosPrazos
    ];

    if (allPdiActionItems.length === 0) {
      toast.error('Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      // Verificar sessão antes de salvar PDI
      console.log('💾 Iniciando salvamento do PDI...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ Sessão inválida ao tentar salvar PDI:', sessionError);
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      console.log('✅ Sessão válida, salvando PDI...');

      const currentCycle = await evaluationService.getCurrentCycle();
      const pdiParams = pdiService.transformPDIDataForAPI(
        pdiData,
        currentCycle?.id,
        undefined // Não temos o ID da avaliação do líder no contexto de consenso
      );

      await pdiService.savePDI(pdiParams);
      console.log('✅ PDI salvo com sucesso');
      toast.success('PDI atualizado com sucesso!');

      // Recarregar o PDI para mostrar a versão atualizada
      await loadPdiForEmployee(pdiData.colaboradorId);
      setPdiViewMode('view');
    } catch (error: any) {
      console.error('❌ Erro ao salvar PDI:', error);

      // Verificar se é erro de timeout
      if (error?.isTimeout || error?.name === 'AbortError') {
        toast.error('Tempo limite excedido. O servidor demorou para responder. Tente novamente.', {
          duration: 5000
        });
        console.log('⏱️ Timeout ao salvar PDI');
      }
      // Verificar se é erro de autenticação
      else if (error?.message?.includes('JWT') ||
          error?.message?.includes('session') ||
          error?.message?.includes('expired') ||
          error?.code === 'PGRST301') {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        toast.error('Erro ao salvar PDI. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Adicionar funções para controlar a visualização/edição do PDI
  const handleEditPDI = () => {
    setPdiViewMode('edit');
  };

  const handleCancelEditPDI = () => {
    setPdiViewMode('view');
    // Recarregar o PDI original
    if (selectedEmployeeId) {
      loadPdiForEmployee(selectedEmployeeId);
    }
  };

  // Adicionar função para controlar visualização do PDI
  const togglePDIView = async () => {
    if (!showPDI && selectedEmployeeId) {
      setLoadingPDI(true);
      try {
        await loadPdiForEmployee(selectedEmployeeId);
      } finally {
        setLoadingPDI(false);
      }
    }
    setShowPDI(!showPDI);
  };

  // Fetch leaders on component mount
  useEffect(() => {
    fetchLeaders();
  }, []);

  // Fetch employees when leader is selected
  useEffect(() => {
    if (selectedLeaderId) {
      fetchEmployeesByLeader(selectedLeaderId);
      setSelectedEmployeeId('');
    }
  }, [selectedLeaderId]);

  const fetchLeaders = async () => {
    try {
      // Buscar líderes e diretores ativos via API usando o filtro OR
      const leadersData = await userService.getUsers({
        active: true,
        is_leader_or_director: true
      });

      // Filtrar admins
      const filteredLeaders = leadersData.filter(leader => !leader.is_admin);

      setLeaders(filteredLeaders as any[]);
    } catch (error) {
      console.error('Error fetching leaders:', error);
      toast.error('Erro ao carregar líderes');
    }
  };

  const fetchEmployeesByLeader = async (leaderId: string) => {
    try {
      // Buscar subordinados via API (que aplica filtro de usuários restritos)
      const subordinates = await userService.getSubordinates(leaderId);

      setEmployees(subordinates as any[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Erro ao carregar colaboradores');
    }
  };

  const loadEmployeeEvaluations = useCallback(async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      // Declarar variável fora do bloco para uso posterior
      let existingConsensus: any = null;

      // Verificar se já existe consenso para este colaborador no ciclo atual
      const currentCycle = await evaluationService.getCurrentCycle();
      if (currentCycle) {
        const { data: consensusData, error: consensusCheckError } = await supabase
          .from('consensus_evaluations')
          .select('id, consensus_score, potential_score, nine_box_position, evaluation_date, notes, self_evaluation_id, leader_evaluation_id')
          .eq('employee_id', selectedEmployeeId)
          .eq('cycle_id', currentCycle.id)
          .maybeSingle();

        existingConsensus = consensusData;

        if (consensusCheckError && consensusCheckError.code !== 'PGRST116') {
          console.error('Erro ao verificar consenso existente:', consensusCheckError);
        }

        if (existingConsensus) {
          setHasExistingConsensus(true);
          setExistingConsensusData(existingConsensus);
          setViewMode('view');
          toast.success(
            `Visualizando consenso salvo (Nota: ${parseFloat(existingConsensus.consensus_score).toFixed(3)}, Posição: ${existingConsensus.nine_box_position})`,
            { duration: 4000 }
          );

          // Carregar os dados do consenso salvo
          try {
            const notesData = JSON.parse(existingConsensus.notes || '{}');
            if (notesData.criterionScores) {
              setConsensusScores(notesData.criterionScores);
            }
            if (notesData.observations) {
              setConsensusObservations(notesData.observations);
            }
            if (notesData.selfScores) {
              setSelfScores(notesData.selfScores);
            }
            if (notesData.leaderScores) {
              setLeaderScores(notesData.leaderScores);
            }
            setPotentialScore(existingConsensus.potential_score);
            setSelfEvaluationId(existingConsensus.self_evaluation_id);
            setLeaderEvaluationId(existingConsensus.leader_evaluation_id);
          } catch (e) {
            console.error('Erro ao carregar notas do consenso:', e);
          }
        } else {
          setHasExistingConsensus(false);
          setExistingConsensusData(null);
          setViewMode('edit');
        }
      }

      // Buscar a autoavaliação mais recente
      const { data: selfEval, error: selfError } = await supabase
        .from('self_evaluations')
        .select(`
          *,
          evaluation_competencies (*)
        `)
        .eq('employee_id', selectedEmployeeId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Carregar toolkit da autoavaliação
      if (selfEval && !selfError) {
        setEmployeeToolkit({
          knowledge: selfEval.knowledge || [],
          tools: selfEval.tools || [],
          strengths_internal: selfEval.strengths_internal || [],
          qualities: selfEval.qualities || []
        });
      } else {
        setEmployeeToolkit(null);
      }

      // Buscar a avaliação do líder mais recente
      const { data: leaderEval, error: leaderError } = await supabase
        .from('leader_evaluations')
        .select(`
          *,
          evaluation_competencies (*)
        `)
        .eq('employee_id', selectedEmployeeId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Inicializar scores com valores padrão
      const selfScoresMap: ScoreMap = {};
      const leaderScoresMap: ScoreMap = {};

      // Mapear nomes dos critérios para IDs
      const criterionNameToId: Record<string, string> = {
        // Técnicas
        'GESTÃO DO CONHECIMENTO': 'gestao-conhecimento',
        'ORIENTAÇÃO A RESULTADOS': 'orientacao-resultados',
        'PENSAMENTO CRÍTICO': 'pensamento-critico',
        'ADERÊNCIA AOS PROCESSOS': 'aderencia-processos',
        // Comportamentais
        'COMUNICAÇÃO': 'comunicacao',
        'INTELIGÊNCIA EMOCIONAL': 'inteligencia-emocional',
        'COLABORAÇÃO': 'colaboracao',
        'FLEXIBILIDADE': 'flexibilidade'
        // Organizacionais serão mapeadas dinamicamente
      };

      // Adicionar mapeamento dinâmico para competências organizacionais
      if (deliveriesCriteria && deliveriesCriteria.length > 0) {
        deliveriesCriteria.forEach((comp: any) => {
          criterionNameToId[comp.name.toUpperCase()] = comp.id;
        });
      }

      // Processar scores da autoavaliação (apenas se não houver consenso existente)
      if (!existingConsensus && selfEval && !selfError && selfEval.evaluation_competencies) {
        setSelfEvaluationId(selfEval.id);

        selfEval.evaluation_competencies.forEach((comp: any) => {
          const criterionId = criterionNameToId[comp.criterion_name.toUpperCase()];
          if (criterionId && comp.score !== null) {
            selfScoresMap[criterionId] = comp.score;
          }
        });
      } else if (!existingConsensus) {
        setSelfEvaluationId(null);
      }

      // Processar scores da avaliação do líder (apenas se não houver consenso existente)
      if (!existingConsensus && leaderEval && !leaderError && leaderEval.evaluation_competencies) {
        setLeaderEvaluationId(leaderEval.id);
        setPotentialScore(leaderEval.potential_score || null);

        leaderEval.evaluation_competencies.forEach((comp: any) => {
          const criterionId = criterionNameToId[comp.criterion_name.toUpperCase()];
          if (criterionId && comp.score !== null) {
            leaderScoresMap[criterionId] = comp.score;
          }
        });
      } else if (!existingConsensus) {
        setLeaderEvaluationId(null);
        setPotentialScore(null);
      }

      // Apenas limpar scores se não houver consenso existente
      if (!existingConsensus) {
        setSelfScores(selfScoresMap);
        setLeaderScores(leaderScoresMap);

        // Verificar se há dados salvos no autosave antes de limpar
        const autoSaveKey = `consensus_autosave_${selectedEmployeeId}`;
        const savedData = localStorage.getItem(autoSaveKey);

        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            const savedTime = new Date(parsed.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);

            // Se os dados foram salvos há menos de 24 horas, restaurar aqui
            if (hoursDiff < 24) {
              console.log('📝 Restaurando dados do auto-save após carregar avaliações...');
              if (parsed.consensusScores) setConsensusScores(parsed.consensusScores);
              if (parsed.consensusObservations) setConsensusObservations(parsed.consensusObservations);
              if (parsed.potentialScore) setPotentialScore(parsed.potentialScore);
              toast.success('Dados restaurados do último preenchimento', { duration: 3000 });
            } else {
              // Remover dados antigos e limpar scores
              localStorage.removeItem(autoSaveKey);
              setConsensusScores({});
              setConsensusObservations({});
            }
          } catch (error) {
            console.error('Erro ao restaurar auto-save:', error);
            // Em caso de erro, limpar normalmente
            setConsensusScores({});
            setConsensusObservations({});
          }
        } else {
          // Não há autosave, limpar normalmente
          setConsensusScores({});
          setConsensusObservations({});
        }
      }

    } catch (error) {
      console.error('Error loading evaluations:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, deliveriesCriteria]);

  // Auto-save restore foi movido para dentro de loadEmployeeEvaluations
  // para evitar race condition onde os dados restaurados eram sobrescritos

  // Auto-save: Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    if (selectedEmployeeId && (Object.keys(consensusScores).length > 0 || Object.keys(consensusObservations).length > 0)) {
      const autoSaveKey = `consensus_autosave_${selectedEmployeeId}`;
      const dataToSave = {
        consensusScores,
        consensusObservations,
        potentialScore,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(autoSaveKey, JSON.stringify(dataToSave));
      console.log('💾 Auto-save realizado:', {
        numScores: Object.keys(consensusScores).length,
        numObservations: Object.keys(consensusObservations).length,
        potentialScore
      });
    }
  }, [consensusScores, consensusObservations, potentialScore, selectedEmployeeId]);

  // Load evaluations and PDI when employee is selected
  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeEvaluations();
      loadPdiForEmployee(selectedEmployeeId);
    }
  }, [selectedEmployeeId, loadPdiForEmployee, loadEmployeeEvaluations]);

  const handleConsensusChange = (criterionId: string, score: number): void => {
    setConsensusScores(prev => ({
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

    // Aplicar pesos: technical 50%, behavioral 30%, organizational 20%
    const weightedScore = (technical * 0.5) + (behavioral * 0.3) + (organizational * 0.2);

    // Arredondar para 10 casas decimais para eliminar erros de precisão de ponto flutuante
    return Math.round(weightedScore * 10000000000) / 10000000000;
  };

  // Formatar nota com no máximo 3 casas decimais
  const formatScore = (score: number): string => {
    if (score === 0) return '0';
    // Arredondar para 3 casas decimais e remover zeros desnecessários
    return parseFloat(score.toFixed(3)).toString();
  };

  // Função para calcular o código Nine Box (B1-B9)
  const calculateNineBoxCode = (performance: number, potential: number): string => {
    let perfRow: number;
    let potCol: number;

    // Determinar linha baseada na performance (consensus_score)
    // Lógica padronizada: 1.0-1.999 = quadrante 1, 2.0-2.999 = quadrante 2, 3.0-4.0 = quadrante 3
    if (performance < 2) {
      perfRow = 0; // B1, B2, B3
    } else if (performance < 3) {
      perfRow = 1; // B4, B5, B6
    } else {
      perfRow = 2; // B7, B8, B9
    }

    // Determinar coluna baseada no potencial
    if (potential < 2) {
      potCol = 0; // Coluna 1
    } else if (potential < 3) {
      potCol = 1; // Coluna 2
    } else {
      potCol = 2; // Coluna 3
    }

    // Calcular o número do box (1-9)
    const boxNumber = (perfRow * 3) + potCol + 1;
    return `B${boxNumber}`;
  };

  const handleSaveConsensus = async (): Promise<void> => {
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

    if (!potentialScore) {
      toast.error('Nota de potencial não encontrada. Certifique-se de que o líder fez a avaliação.');
      return;
    }

    setLoading(true);

    try {
      // Verificar se a sessão está válida antes de salvar
      console.log('💾 Iniciando salvamento do consenso...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ Sessão inválida ao tentar salvar:', sessionError);
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      console.log('✅ Sessão válida, prosseguindo com salvamento...');
      // Get current cycle
      const currentCycle = await evaluationService.getCurrentCycle();
      if (!currentCycle) {
        toast.error('Nenhum ciclo ativo encontrado');
        return;
      }

      // Verificar se já existe um consenso para este colaborador neste ciclo
      const { data: existingConsensus, error: checkError } = await supabase
        .from('consensus_evaluations')
        .select('id')
        .eq('employee_id', selectedEmployeeId)
        .eq('cycle_id', currentCycle.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows found, que é o esperado
        throw checkError;
      }

      if (existingConsensus) {
        toast.error('Já existe um consenso salvo para este colaborador neste ciclo. Não é possível alterar.');
        return;
      }

      // Calculate final score
      const finalScore = calculateOverallAverage();

      // Calculate nine box position
      const nineBoxPosition = calculateNineBoxCode(finalScore, potentialScore);

      // Create notes with all observations and scores
      const notesContent = {
        criterionScores: consensusScores,
        observations: consensusObservations,
        technicalAverage: calculateCategoryAverage('Técnica'),
        behavioralAverage: calculateCategoryAverage('Comportamental'),
        organizationalAverage: calculateCategoryAverage('Organizacional'),
        selfScores: selfScores,
        leaderScores: leaderScores
      };

      // Prepare the consensus data matching your table structure
      const consensusData = {
        employee_id: selectedEmployeeId,
        cycle_id: currentCycle.id,
        self_evaluation_id: selfEvaluationId,
        leader_evaluation_id: leaderEvaluationId,
        consensus_score: finalScore,
        potential_score: potentialScore, // Usar a nota de potencial da avaliação do líder
        nine_box_position: nineBoxPosition, // Adicionar a posição Nine Box
        notes: JSON.stringify(notesContent),
        evaluation_date: new Date().toISOString().split('T')[0]
      };

      // Insert consensus evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from('consensus_evaluations')
        .insert(consensusData)
        .select()
        .single();

      if (evalError) throw evalError;

      // Limpar auto-save após salvar com sucesso
      const autoSaveKey = `consensus_autosave_${selectedEmployeeId}`;
      localStorage.removeItem(autoSaveKey);
      console.log('🗑️ Auto-save limpo após salvar consenso');
      console.log('✅ Consenso salvo com sucesso!');

      toast.success('Consenso salvo com sucesso!');

      // Reset form
      setSelectedEmployeeId('');
      setSelectedLeaderId('');
      setConsensusScores({});
      setConsensusObservations({});
      setSelfEvaluationId(null);
      setLeaderEvaluationId(null);
      setPotentialScore(null);
    } catch (error: any) {
      console.error('❌ Erro ao salvar consenso:', error);

      // Verificar se é erro de timeout
      if (error?.isTimeout || error?.name === 'AbortError') {
        toast.error('Tempo limite excedido. O servidor demorou para responder. Seus dados foram preservados. Tente novamente.', {
          duration: 5000
        });
        console.log('⏱️ Timeout ao salvar - dados preservados no autosave');
      }
      // Verificar se é erro de autenticação
      else if (error?.message?.includes('JWT') ||
          error?.message?.includes('session') ||
          error?.message?.includes('expired') ||
          error?.code === 'PGRST301') {
        toast.error('Sua sessão expirou. Os dados foram salvos localmente. Por favor, faça login novamente.');
        // Aguardar 3 segundos e redirecionar para login
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        // Erro genérico - dados permanecem no autosave
        toast.error('Erro ao salvar consenso. Seus dados foram preservados. Tente novamente.');
        console.log('💾 Dados preservados no autosave devido ao erro');
      }
    } finally {
      setLoading(false);
    }
  };

  const ScoreButton = ({ score, isSelected, onClick, disabled }: {
    score: number;
    isSelected: boolean;
    onClick?: (score: number) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => onClick && !disabled && onClick(score)}
      disabled={disabled}
      className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed opacity-70'
          : 'transform hover:scale-105 cursor-pointer'
      } ${
        isSelected
          ? 'bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-600 dark:to-gray-700 text-white shadow-lg ring-2 ring-gray-400 dark:ring-gray-500 ring-offset-2 dark:ring-offset-gray-800'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'
      }`}
      title={disabled ? `Nota ${score} (somente leitura)` : `Selecionar nota ${score}`}
      aria-label={`Nota ${score} ${isSelected ? '(selecionada)' : ''} ${disabled ? '(somente leitura)' : ''}`}
    >
      {score}
    </button>
  );

  const ScoreIndicator = ({
    score,
    type,
    criterionId
  }: {
    score: number | null | undefined;
    type: 'self' | 'leader';
    criterionId: string;
  }) => {
    // Usar sempre o mesmo background cinza escuro para ambos os tipos
    const bg = 'bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-600 dark:to-gray-700';

    const config = {
      self: {
        label: 'Autoavaliação',
      },
      leader: {
        label: 'Avaliação do Líder',
      }
    };

    const hasScore = score !== null && score !== undefined && score > 0;
    const displayScore = hasScore ? score : '-';

    return (
      <div className="flex flex-col items-center space-y-4 w-32">
        <h6 className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium text-center h-10 flex items-center justify-center">{config[type].label}</h6>
        <div
          className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center text-white text-xl font-bold shadow-lg dark:shadow-xl`}
          title={`${config[type].label}: ${hasScore ? score : 'Não avaliado'}`}
        >
          {displayScore}
        </div>
      </div>
    );
  };

  const progress = getProgress();
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const selectedLeader = leaders.find(leader => leader.id === selectedLeaderId);

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
        className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <Handshake className="h-6 w-6 sm:h-8 sm:w-8 text-primary-00 dark:text-primary-700 mr-3" />
                Reunião de Consenso
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Definição colaborativa das notas finais</p>
            </div>
          </div>

          {/* Progress Indicator */}
          {selectedEmployeeId && (
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
                      <stop offset="0%" stopColor="#166534" />
                      <stop offset="50%" stopColor="#4b5563" />
                      <stop offset="100%" stopColor="#78716c" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Leader Selection */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Selecione o Líder
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-00 dark:focus:border-primary-700 focus:ring-primary-00 dark:focus:ring-primary-700 appearance-none cursor-pointer"
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                disabled={loading}
              >
                <option value="">Escolha um líder...</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name}
                  </option>
                ))}
              </select>
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
              Selecione o Colaborador
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-00 dark:focus:border-primary-700 focus:ring-primary-00 dark:focus:ring-primary-700 appearance-none cursor-pointer"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={!selectedLeaderId || loading}
              >
                <option value="">
                  {selectedLeaderId ? 'Escolha um colaborador...' : 'Selecione um líder primeiro'}
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Cargo
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-naue-black dark:text-gray-300 font-medium text-sm">
                  {selectedEmployee.position}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data de Admissão
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-naue-black dark:text-gray-300 font-medium text-sm">
                  {selectedEmployee.join_date
                    ? (() => {
                        // Parse da data sem problemas de timezone
                        const [year, month, day] = selectedEmployee.join_date.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        return date.toLocaleDateString('pt-BR');
                      })()
                    : 'Não informada'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data da Reunião
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-naue-black dark:text-gray-300 font-medium text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 dark:border-primary-700"></div>
        </div>
      )}

      {/* Info Banner for Existing Consensus - View Mode */}
      {hasExistingConsensus && selectedEmployeeId && !loading && viewMode === 'view' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Visualizando Consenso Salvo
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Este colaborador já possui um consenso finalizado neste ciclo. Você está visualizando as informações em modo somente leitura.
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-blue-600 dark:text-blue-400">
                <span className="flex items-center">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Nota Final: <strong className="ml-1">{existingConsensusData?.consensus_score ? parseFloat(existingConsensusData.consensus_score).toFixed(3) : 'N/A'}</strong>
                </span>
                <span className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Posição Nine Box: <strong className="ml-1">{existingConsensusData?.nine_box_position}</strong>
                </span>
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Data: <strong className="ml-1">{existingConsensusData?.evaluation_date ? new Date(existingConsensusData.evaluation_date).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toolkit Section */}
      {selectedEmployeeId && !loading && employeeToolkit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 overflow-hidden"
        >
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary-50 via-gray-50 to-stone-50 dark:from-green-900/20 dark:via-gray-900/20 dark:to-stone-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-00 to-primary-600 dark:from-primary-00 dark:to-primary-600 shadow-md dark:shadow-lg">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Toolkit do Colaborador</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Conhecimentos, ferramentas e qualidades declaradas na autoavaliação
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conhecimentos */}
              {employeeToolkit.knowledge.length > 0 && (
                <div className="p-4 bg-primary-50 dark:bg-primary-600/20 rounded-xl border border-primary-200 dark:border-primary-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="h-5 w-5 text-primary-00 dark:text-primary-700" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Conhecimentos</h4>
                  </div>
                  <ul className="space-y-2">
                    {employeeToolkit.knowledge.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary-600 dark:text-primary-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ferramentas */}
              {employeeToolkit.tools.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Ferramentas</h4>
                  </div>
                  <ul className="space-y-2">
                    {employeeToolkit.tools.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Forças Internas */}
              {employeeToolkit.strengths_internal.length > 0 && (
                <div className="p-4 bg-stone-50 dark:bg-stone-900/20 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="h-5 w-5 text-stone-700 dark:text-stone-600" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Forças Internas</h4>
                  </div>
                  <ul className="space-y-2">
                    {employeeToolkit.strengths_internal.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-stone-600 dark:text-stone-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Qualidades */}
              {employeeToolkit.qualities.length > 0 && (
                <div className="p-4 bg-stone-50 dark:bg-stone-900/20 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award className="h-5 w-5 text-stone-700 dark:text-stone-600" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Qualidades</h4>
                  </div>
                  <ul className="space-y-2">
                    {employeeToolkit.qualities.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-stone-600 dark:text-stone-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Criteria by Category */}
      <AnimatePresence>
        {selectedEmployeeId && !loading && (
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
                  className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 overflow-hidden"
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
                          <CheckCircle className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {categoryCriteria.map((criterion) => {
                        const selfScore = selfScores[criterion.id];
                        const leaderScore = leaderScores[criterion.id];
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
                                    <h5 className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium flex items-center">
                                      <Sparkles className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                      Avaliações
                                    </h5>
                                  </div>
                                  <div className="flex items-start justify-center space-x-8">
                                    <ScoreIndicator 
                                      score={selfScore} 
                                      type="self" 
                                      criterionId={criterion.id}
                                    />
                                    <div className="h-14 w-px bg-gray-300 dark:bg-gray-600 mt-14"></div>
                                    <ScoreIndicator 
                                      score={leaderScore} 
                                      type="leader" 
                                      criterionId={criterion.id}
                                    />
                                  </div>
                                </div>

                                {/* Consenso */}
                                <div className="bg-gradient-to-r from-primary-50 to-gray-50 dark:from-green-900/20 dark:to-gray-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-700">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-sm font-medium text-naue-black dark:text-gray-300 font-medium flex items-center">
                                      <Handshake className="h-4 w-4 mr-2 text-primary-00 dark:text-primary-700" />
                                      Nota de Consenso
                                    </h5>
                                    {consensusScore > 0 && (
                                      <div className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400">
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
                                        onClick={(selectedScore: number) => viewMode === 'edit' ? handleConsensusChange(criterion.id, selectedScore) : undefined}
                                        disabled={viewMode === 'view'}
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
                                Observações {viewMode === 'view' && <span className="ml-1 text-xs">(somente leitura)</span>}
                              </label>
                              <textarea
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-00 dark:focus:ring-primary-700 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                rows={2}
                                placeholder={viewMode === 'edit' ? "Adicione observações sobre esta competência..." : "Sem observações"}
                                value={consensusObservations[criterion.id] || ''}
                                onChange={(e) => viewMode === 'edit' && handleObservationChange(criterion.id, e.target.value)}
                                disabled={viewMode === 'view'}
                                readOnly={viewMode === 'view'}
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

            {/* PDI Section - Atualizado */}
            {selectedEmployeeId && (
              <>
                {/* Botão para mostrar/ocultar PDI */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-stone-700 dark:text-stone-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          Plano de Desenvolvimento Individual (PDI)
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {showPDI ? 'Visualize ou edite o PDI do colaborador' : 'Clique para visualizar o PDI'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={togglePDIView}
                      icon={showPDI ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      size="sm"
                    >
                      {showPDI ? 'Ocultar PDI' : 'Visualizar PDI'}
                    </Button>
                  </div>
                </motion.div>

                {/* PDI Viewer/Editor */}
                <AnimatePresence>
                  {showPDI && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {pdiViewMode === 'view' && pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length > 0 ? (
                        <PDIViewer
                          pdiData={pdiData}
                          onEdit={handleEditPDI}
                          readOnly={false}
                        />
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-naue-border-gray dark:border-gray-700 p-8"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-stone-700 dark:text-stone-600" />
                              {pdiViewMode === 'edit' ? 'Editar PDI' : 'Criar PDI'}
                            </h3>
                            {pdiViewMode === 'edit' && (
                              <Button
                                variant="outline"
                                onClick={handleCancelEditPDI}
                                size="sm"
                              >
                                Cancelar Edição
                              </Button>
                            )}
                          </div>
                          
                          <PotentialAndPDI
                            currentStep={3} // Force step 3 to show PDI section
                            potentialItems={[]} // Not used in this context
                            setPotentialItems={() => {}} // Not used in this context
                            pdiData={pdiData}
                            setPdiData={setPdiData}
                            handlePreviousStep={() => {}} // Not used in this context
                            handleNextStep={() => {}} // Not used in this context
                            handleSave={handleSavePDI}
                            handleSubmit={handleSavePDI} // Use save as submit in this context
                            isSaving={loading}
                            loading={loading}
                            canProceedToStep3={() => true} // Always true as it's the PDI section
                            selectedEmployee={employees.find(emp => emp.id === selectedEmployeeId)}
                            hideActionButtons={viewMode === 'view'} // Hide buttons in view mode
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Score Summary - Atualizado com indicador de PDI */}
            {Object.keys(consensusScores).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-primary-50 via-gray-50 to-stone-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-primary-100 dark:border-gray-700 p-4 sm:p-8"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-00 dark:text-primary-700" />
                  Resumo do Consenso
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-primary-200 dark:border-primary-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Técnicas</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-primary-00 dark:text-primary-700">{formatScore(calculateCategoryAverage('Técnica'))}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 50%</p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Comportamentais</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">{formatScore(calculateCategoryAverage('Comportamental'))}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 30%</p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-stone-200 dark:border-stone-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Organizacionais</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-stone-700 dark:text-stone-600">{formatScore(calculateCategoryAverage('Organizacional'))}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 20%</p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-600 dark:to-gray-700 p-4 sm:p-6 rounded-xl text-white">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Nota Final</h4>
                    <p className="text-2xl sm:text-3xl font-bold">{formatScore(calculateOverallAverage())}</p>
                    <p className="text-xs text-gray-100 dark:text-gray-200 mt-1">Média Ponderada</p>
                  </div>

                  {/* Adicionar indicador do PDI */}
                  <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl border border-stone-200 dark:border-stone-700">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status PDI</h4>
                    <div className="flex items-center space-x-2">
                      {pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length > 0 ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-primary-500" />
                          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Definido</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pendente</p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length} itens
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions - Only show in edit mode */}
            {viewMode === 'edit' && (
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
                      <CheckCircle className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        Consenso completo!
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveConsensus}
                    icon={<Save size={18} />}
                    size="lg"
                    disabled={progress < 100 || loading}
                  >
                    Salvar Consenso
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedEmployeeId && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-100 to-gray-100 dark:from-green-900/20 dark:to-gray-900/20 mb-6">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary-00 dark:text-primary-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              Selecione primeiro um líder e depois um colaborador para iniciar a reunião de consenso
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Consensus;