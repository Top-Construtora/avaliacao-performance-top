import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileDown, 
  Download, 
  Printer, 
  Share2,
  MoreVertical,
  X,
  Filter,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import Button from '../../components/Button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { toast } from 'react-hot-toast';
import { useEvaluation } from '../../hooks/useEvaluation';
import { evaluationService } from '../../services/evaluation.service';
import { departmentsService, usersService, teamsService } from '../../services/supabase.service';
import type { Department, UserWithDetails, Team } from '../../types/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CycleDashboard, EvaluationCycle } from '../../types/evaluation.types';
import LoadingSpinner from '../../components/LoadingSpinner';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const Reports = () => {
  const { 
    currentCycle, 
    loadCurrentCycle, 
    loading: evaluationLoading 
  } = useEvaluation();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'extract'>('overview');
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [dashboard, setDashboard] = useState<CycleDashboard[]>([]);

  // Estados para os cards de visão geral
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 0,
    completedEvaluations: 0,
    inProgress: 0,
    pending: 0,
    completionRate: 0
  });

  // Estados para times e departamentos expandidos
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  // Estados para o progresso por departamento (com times)
  const [departmentProgress, setDepartmentProgress] = useState<Array<{
    id: string;
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    teams: Array<{
      id: string;
      name: string;
      total: number;
      completed: number;
      completionRate: number;
    }>;
  }>>([]);

  // === OTIMIZAÇÃO: Criar Maps para lookups rápidos (O(1) em vez de O(n)) ===
  const usersMap = useMemo(() => {
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  const departmentsMap = useMemo(() => {
    return new Map(departments.map(d => [d.id, d]));
  }, [departments]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar dashboard quando o ciclo mudar
  useEffect(() => {
    if (currentCycle) {
      loadDashboardData(currentCycle.id);
    }
  }, [currentCycle]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Carregar ciclo atual se não estiver carregado
      if (!currentCycle) {
        await loadCurrentCycle();
      }

      // Carregar departamentos
      const depts = await departmentsService.getAll();
      setDepartments(depts);

      // Carregar times
      const allTeams = await teamsService.getAll();
      setTeams(allTeams);

      // Carregar usuários
      const allUsers = await usersService.getAll();
      setUsers(allUsers.filter(u => u.active));

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (cycleId: string) => {
    try {
      const dashboardData = await evaluationService.getCycleDashboard(cycleId);
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  // Calcular dados do resumo sempre que o dashboard mudar
  useEffect(() => {
    if (dashboard && dashboard.length > 0) {
      const totalEmployees = dashboard.length;

      // COMPLETO: autoavaliação + líder + consenso + PDI (ninebox_position) todos completos
      const completedEvaluations = dashboard.filter(
        (d: CycleDashboard) => {
          const isDirector = d.self_evaluation_status === 'n/a' && d.consensus_status === 'n/a';
          if (isDirector) {
            return d.leader_evaluation_status === 'completed' && d.ninebox_position;
          }
          return d.self_evaluation_status === 'completed' &&
                 d.leader_evaluation_status === 'completed' &&
                 d.consensus_status === 'completed' &&
                 d.ninebox_position;
        }
      ).length;

      // EM ANDAMENTO: pelo menos UMA avaliação completa mas não tudo
      const inProgress = dashboard.filter(
        (d: CycleDashboard) => {
          const isDirector = d.self_evaluation_status === 'n/a' && d.consensus_status === 'n/a';

          // Se já está completo, não conta como em andamento
          if (isDirector) {
            const isComplete = d.leader_evaluation_status === 'completed' && d.ninebox_position;
            if (isComplete) return false;
            // Em andamento se leader foi iniciado ou completo sem ninebox
            return d.leader_evaluation_status === 'completed' || d.leader_evaluation_status === 'in-progress';
          } else {
            const isComplete = d.self_evaluation_status === 'completed' &&
                              d.leader_evaluation_status === 'completed' &&
                              d.consensus_status === 'completed' &&
                              d.ninebox_position;
            if (isComplete) return false;
            // Em andamento se pelo menos autoavaliação OU líder está completo
            return d.self_evaluation_status === 'completed' || d.leader_evaluation_status === 'completed';
          }
        }
      ).length;

      // PENDENTE: nada foi iniciado
      const pending = totalEmployees - completedEvaluations - inProgress;

      const completionRate = totalEmployees > 0
        ? Math.round((completedEvaluations / totalEmployees) * 100)
        : 0;

      setSummaryData({
        totalEmployees,
        completedEvaluations,
        inProgress,
        pending,
        completionRate
      });
    }
  }, [dashboard]);

  // Função auxiliar para verificar se avaliação está completa
  const isEvaluationCompleted = (d: CycleDashboard): boolean => {
    const isDirector = d.self_evaluation_status === 'n/a' && d.consensus_status === 'n/a';
    if (isDirector) {
      return d.leader_evaluation_status === 'completed' && !!d.ninebox_position;
    }
    return d.self_evaluation_status === 'completed' &&
           d.leader_evaluation_status === 'completed' &&
           d.consensus_status === 'completed' &&
           !!d.ninebox_position;
  };

  // Calcular progresso por departamento (com times) - OTIMIZADO com useMemo
  const calculatedDepartmentProgress = useMemo(() => {
    if (!dashboard || dashboard.length === 0 || departments.length === 0 || teams.length === 0) {
      return [];
    }

    // Criar índice de departamento por nome (lowercase) para lookup rápido
    const deptNameMap = new Map(departments.map(d => [d.name.toLowerCase(), d]));

    // Agrupar dashboard por departamento (uma única passagem)
    const dashboardByDept = new Map<string, CycleDashboard[]>();
    dashboard.forEach((d: CycleDashboard) => {
      const deptNameLower = d.department_name?.toLowerCase() || '';
      if (!dashboardByDept.has(deptNameLower)) {
        dashboardByDept.set(deptNameLower, []);
      }
      dashboardByDept.get(deptNameLower)!.push(d);
    });

    // Agrupar times por departamento
    const teamsByDept = new Map<string, Team[]>();
    teams.forEach(t => {
      if (!teamsByDept.has(t.department_id)) {
        teamsByDept.set(t.department_id, []);
      }
      teamsByDept.get(t.department_id)!.push(t);
    });

    return departments.map(dept => {
      const deptEmployees = dashboardByDept.get(dept.name.toLowerCase()) || [];
      const total = deptEmployees.length;
      const completed = deptEmployees.filter(isEvaluationCompleted).length;

      const inProgress = deptEmployees.filter((d: CycleDashboard) => {
        if (isEvaluationCompleted(d)) return false;
        const isDirector = d.self_evaluation_status === 'n/a' && d.consensus_status === 'n/a';
        if (isDirector) {
          return d.leader_evaluation_status === 'completed' || d.leader_evaluation_status === 'in-progress';
        }
        return d.self_evaluation_status === 'completed' || d.leader_evaluation_status === 'completed';
      }).length;

      const pending = total - completed - inProgress;

      // Calcular progresso por time
      const deptTeams = teamsByDept.get(dept.id) || [];

      // Criar índice de employees por team_name
      const employeesByTeam = new Map<string, CycleDashboard[]>();
      deptEmployees.forEach(d => {
        const teamNameLower = d.team_name?.toLowerCase() || '';
        if (!employeesByTeam.has(teamNameLower)) {
          employeesByTeam.set(teamNameLower, []);
        }
        employeesByTeam.get(teamNameLower)!.push(d);
      });

      const teamsProgress = deptTeams.map(team => {
        const teamEmployees = employeesByTeam.get(team.name.toLowerCase()) || [];
        const teamTotal = teamEmployees.length;
        const teamCompleted = teamEmployees.filter(isEvaluationCompleted).length;

        return {
          id: team.id,
          name: team.name,
          total: teamTotal,
          completed: teamCompleted,
          completionRate: teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0
        };
      }).filter(t => t.total > 0);

      return {
        id: dept.id,
        name: dept.name,
        total,
        completed,
        inProgress,
        pending,
        teams: teamsProgress
      };
    });
  }, [dashboard, departments, teams]);

  // Atualizar estado quando o cálculo mudar
  useEffect(() => {
    setDepartmentProgress(calculatedDepartmentProgress);
  }, [calculatedDepartmentProgress]);

  // Memoizar lista ordenada para renderização
  const sortedDepartmentProgress = useMemo(() => {
    return departmentProgress
      .filter(dept => dept.total > 0)
      .sort((a, b) => {
        const rateA = a.total > 0 ? (a.completed / a.total) * 100 : 0;
        const rateB = b.total > 0 ? (b.completed / b.total) * 100 : 0;
        return rateB - rateA;
      });
  }, [departmentProgress]);

  // Filtrar dados para a visão detalhada (OTIMIZADO com useMemo e Map)
  const filteredData = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();

    return dashboard.filter((item: CycleDashboard) => {
      // Não mostrar diretores na tabela
      if (item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a') {
        return false;
      }

      // Usar Map para lookup O(1) em vez de O(n)
      const user = usersMap.get(item.employee_id);
      if (!user) return false;

      const matchesSearch = !searchTerm ||
        user.name.toLowerCase().includes(searchTermLower) ||
        user.position.toLowerCase().includes(searchTermLower);

      const matchesDepartment = !selectedDepartment ||
        user.teams?.some(t => t.department_id === selectedDepartment);

      const matchesStatus = !selectedStatus ||
        item.self_evaluation_status === selectedStatus ||
        item.leader_evaluation_status === selectedStatus ||
        item.consensus_status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [dashboard, usersMap, searchTerm, selectedDepartment, selectedStatus]);

  // Função auxiliar para obter nome do departamento (usa Map)
  const getDeptName = (item: CycleDashboard, user: UserWithDetails | undefined): string => {
    if (item.department_name) return item.department_name;
    if (user?.teams && user.teams[0]) {
      return departmentsMap.get(user.teams[0].department_id)?.name || '-';
    }
    return '-';
  };

  // Emails de contas de sistema/teste que não devem aparecer nos relatórios
  const excludedEmails = new Set(['admintop@sistema.com', 'usuarioteste1@topconstrutora.com']);

  // === Estilos compartilhados para exportação Excel ===
  const headerStyle = {
    fill: { fgColor: { rgb: '1E6076' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
    alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { rgb: '164E5F' } },
      bottom: { style: 'thin' as const, color: { rgb: '164E5F' } },
      left: { style: 'thin' as const, color: { rgb: '164E5F' } },
      right: { style: 'thin' as const, color: { rgb: '164E5F' } },
    },
  };

  const cellStyle = {
    alignment: { vertical: 'center' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      left: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      right: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
    },
  };

  const cellStyleCenter = {
    alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      left: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
      right: { style: 'thin' as const, color: { rgb: 'E5E7EB' } },
    },
  };

  const applySheetStyles = (
    ws: XLSX.WorkSheet,
    numCols: number,
    numRows: number,
    colWidths: { wch: number }[],
    centerCols?: number[]
  ) => {
    ws['!cols'] = colWidths;
    // Header row height
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 30 };

    for (let col = 0; col < numCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }
    for (let row = 1; row <= numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = centerCols?.includes(col) ? cellStyleCenter : cellStyle;
        }
      }
    }
  };

  const buildResumoSheet = (stats: { label: string; value: string | number }[]) => {
    const resumoData = [
      ...stats,
      { label: '', value: '' },
      { label: 'Ciclo', value: currentCycle?.title || '-' },
      { label: 'Data de Exportação', value: new Date().toLocaleString('pt-BR') },
    ].map(r => ({ 'Indicador': r.label, 'Valor': r.value }));

    const wsResumo = XLSX.utils.json_to_sheet(resumoData);
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 25 }];
    for (let col = 0; col < 2; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (wsResumo[cellRef]) wsResumo[cellRef].s = headerStyle;
    }
    for (let row = 1; row <= resumoData.length; row++) {
      for (let col = 0; col < 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (wsResumo[cellRef]) wsResumo[cellRef].s = cellStyle;
      }
    }
    return wsResumo;
  };

  // === Funções de exportação da tab Extrair ===
  const exportEvaluationsExcel = () => {
    const data = dashboard.filter((item: CycleDashboard) => {
      const email = usersMap.get(item.employee_id)?.email || item.employee_email || '';
      return !excludedEmails.has(email.toLowerCase());
    }).map((item: CycleDashboard) => {
      const user = usersMap.get(item.employee_id);
      const deptName = getDeptName(item, user);

      return {
        'Nome': user?.name || item.employee_name || '-',
        'Cargo': user?.position || item.employee_position || '-',
        'Departamento': deptName,
        'Email': user?.email || item.employee_email || '-',
        'Status Autoavaliação': getStatusLabel(item.self_evaluation_status),
        'Nota Autoavaliação': item.self_evaluation_score != null ? Number(item.self_evaluation_score.toFixed(1)) : '-',
        'Status Líder': getStatusLabel(item.leader_evaluation_status),
        'Nota Líder': item.leader_evaluation_score != null ? Number(item.leader_evaluation_score.toFixed(1)) : '-',
        'Status Consenso': getStatusLabel(item.consensus_status),
        'Nota Consenso': (item.consensus_performance_score ?? item.consensus_score) != null ? Number((item.consensus_performance_score ?? item.consensus_score)!.toFixed(1)) : '-',
        'Posição Nine Box': item.ninebox_position || 'Pendente',
      };
    }).sort((a, b) => a['Nome'].localeCompare(b['Nome'], 'pt-BR'));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 25 }, // Cargo
      { wch: 20 }, // Departamento
      { wch: 35 }, // Email
      { wch: 18 }, // Status Autoavaliação
      { wch: 16 }, // Nota Autoavaliação
      { wch: 14 }, // Status Líder
      { wch: 12 }, // Nota Líder
      { wch: 16 }, // Status Consenso
      { wch: 14 }, // Nota Consenso
      { wch: 16 }, // Posição Nine Box
    ];
    applySheetStyles(ws, 11, data.length, colWidths, [4, 5, 6, 7, 8, 9, 10]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');

    const wsResumo = buildResumoSheet([
      { label: 'Total de Avaliações', value: data.length },
      { label: 'Completas', value: data.filter(d => d['Status Consenso'] === 'Completo').length },
      { label: 'Em Andamento', value: data.filter(d => d['Status Consenso'] === 'Em Andamento').length },
      { label: 'Pendentes', value: data.filter(d => d['Status Consenso'] === 'Pendente' || d['Status Consenso'] === 'Aguardando').length },
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_avaliacoes_${dataAtual}.xlsx`);
    toast.success('Relatório de Avaliações gerado!');
  };

  const exportEmployeesExcel = () => {
    const data = users.filter(u => !excludedEmails.has(u.email.toLowerCase())).map((user: UserWithDetails) => {
      const deptName = user.teams?.[0]?.department_id
        ? departmentsMap.get(user.teams[0].department_id)?.name || '-'
        : '-';
      const teamNames = user.teams?.map(t => t.name).join(', ') || '-';

      return {
        'Nome': user.name,
        'Email': user.email,
        'Cargo': user.position || '-',
        'Departamento': deptName,
        'Time(s)': teamNames,
        'Líder': user.manager?.name || '-',
        'Data Admissão': user.admission_date
          ? new Date(user.admission_date).toLocaleDateString('pt-BR')
          : user.join_date
            ? new Date(user.join_date).toLocaleDateString('pt-BR')
            : '-',
        'Tipo Contrato': user.contract_type || '-',
        'Ativo': user.active ? 'Sim' : 'Não',
      };
    }).sort((a, b) => a['Nome'].localeCompare(b['Nome'], 'pt-BR'));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 35 }, // Email
      { wch: 25 }, // Cargo
      { wch: 20 }, // Departamento
      { wch: 22 }, // Time(s)
      { wch: 25 }, // Líder
      { wch: 16 }, // Data Admissão
      { wch: 14 }, // Tipo Contrato
      { wch: 8 },  // Ativo
    ];
    applySheetStyles(ws, 9, data.length, colWidths, [6, 7, 8]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');

    const wsResumo = buildResumoSheet([
      { label: 'Total de Colaboradores', value: data.length },
      { label: 'Ativos', value: data.filter(d => d['Ativo'] === 'Sim').length },
      { label: 'Inativos', value: data.filter(d => d['Ativo'] === 'Não').length },
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_colaboradores_${dataAtual}.xlsx`);
    toast.success('Relatório de Colaboradores gerado!');
  };

  const exportSalaryExcel = () => {
    const data = users.filter(u => !excludedEmails.has(u.email.toLowerCase())).map((user: UserWithDetails) => {
      const deptName = user.teams?.[0]?.department_id
        ? departmentsMap.get(user.teams[0].department_id)?.name || '-'
        : '-';

      return {
        'Nome': user.name,
        'Cargo': user.position || '-',
        'Departamento': deptName,
        'Trilha': user.track?.name || '-',
        'Classe Salarial': user.track_position?.class?.name || '-',
        'Nível': user.salary_level?.name || '-',
        'Salário Atual': user.current_salary
          ? `R$ ${user.current_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '-',
        'Tipo Contrato': user.contract_type || '-',
      };
    }).sort((a, b) => a['Nome'].localeCompare(b['Nome'], 'pt-BR'));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 25 }, // Cargo
      { wch: 20 }, // Departamento
      { wch: 18 }, // Trilha
      { wch: 16 }, // Classe Salarial
      { wch: 12 }, // Nível
      { wch: 18 }, // Salário Atual
      { wch: 14 }, // Tipo Contrato
    ];
    applySheetStyles(ws, 8, data.length, colWidths, [3, 4, 5, 6, 7]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestão Salarial');

    const comSalario = users.filter(u => u.current_salary);
    const wsResumo = buildResumoSheet([
      { label: 'Total de Colaboradores', value: data.length },
      { label: 'Com Salário Definido', value: comSalario.length },
      { label: 'Sem Salário Definido', value: data.length - comSalario.length },
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_gestao_salarial_${dataAtual}.xlsx`);
    toast.success('Relatório de Gestão Salarial gerado!');
  };

  const getPromotedQuadrantLabel = (quadrant: number | null | undefined): string => {
    switch (quadrant) {
      case 1: return 'Baixo';
      case 2: return 'Médio';
      case 3: return 'Alto';
      default: return '-';
    }
  };

  const exportNineBoxExcel = () => {
    const nineBoxData = dashboard.filter((item: CycleDashboard) => {
      const email = usersMap.get(item.employee_id)?.email || item.employee_email || '';
      return !excludedEmails.has(email.toLowerCase()) &&
        item.consensus_performance_score && item.consensus_potential_score;
    });

    const data = nineBoxData.map((item: CycleDashboard) => {
      const user = usersMap.get(item.employee_id);
      const deptName = getDeptName(item, user);

      return {
        'Nome': user?.name || item.employee_name || '-',
        'Cargo': user?.position || item.employee_position || '-',
        'Departamento': deptName,
        'Nota Performance': item.consensus_performance_score != null ? Number(item.consensus_performance_score.toFixed(1)) : '-',
        'Nota Potencial': item.consensus_potential_score != null ? Number(item.consensus_potential_score.toFixed(1)) : '-',
        'Posição Nine Box': item.ninebox_position || '-',
        'Quadrante Promovido': getPromotedQuadrantLabel(item.promoted_potential_quadrant),
        'Deliberações do Comitê': item.committee_deliberations || '-',
      };
    }).sort((a, b) => a['Nome'].localeCompare(b['Nome'], 'pt-BR'));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 25 }, // Cargo
      { wch: 20 }, // Departamento
      { wch: 16 }, // Nota Performance
      { wch: 14 }, // Nota Potencial
      { wch: 16 }, // Posição Nine Box
      { wch: 20 }, // Quadrante Promovido
      { wch: 35 }, // Deliberações do Comitê
    ];
    applySheetStyles(ws, 8, data.length, colWidths, [3, 4, 5, 6]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nine Box');

    const wsResumo = buildResumoSheet([
      { label: 'Total no Nine Box', value: data.length },
      { label: 'Com Promoção de Quadrante', value: nineBoxData.filter(d => d.promoted_potential_quadrant).length },
      { label: 'Com Deliberações', value: nineBoxData.filter(d => d.committee_deliberations).length },
    ]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_ninebox_${dataAtual}.xlsx`);
    toast.success('Relatório Nine Box gerado!');
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Avaliações', 14, 15);

    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    if (currentCycle) {
      doc.text(`Ciclo: ${currentCycle.title}`, 14, 32);
    }

    const tableData = filteredData.map((item: CycleDashboard) => {
      const user = usersMap.get(item.employee_id);
      const deptName = getDeptName(item, user);

      return [
        user?.name || '-',
        user?.position || '-',
        deptName,
        getStatusLabel(item.self_evaluation_status),
        getStatusLabel(item.leader_evaluation_status),
        getStatusLabel(item.consensus_status),
        item.ninebox_position || 'Pendente'
      ];
    });

    doc.autoTable({
      head: [['Nome', 'Cargo', 'Departamento', 'Autoavaliação', 'Líder', 'Consenso', 'Nine Box']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] }
    });

    doc.save('relatorio_avaliacoes.pdf');
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const exportExcel = () => {
    const data = filteredData.filter((item: CycleDashboard) => {
      const email = usersMap.get(item.employee_id)?.email || item.employee_email || '';
      return !excludedEmails.has(email.toLowerCase());
    }).map((item: CycleDashboard) => {
      const user = usersMap.get(item.employee_id);
      const deptName = getDeptName(item, user);

      return {
        'Nome': user?.name || '-',
        'Cargo': user?.position || '-',
        'Departamento': deptName,
        'Autoavaliação': getStatusLabel(item.self_evaluation_status),
        'Avaliação do Líder': getStatusLabel(item.leader_evaluation_status),
        'Consenso': getStatusLabel(item.consensus_status),
        'PDI': item.ninebox_position ? 'Definido' : 'Pendente',
        'Posição Nine Box': item.ninebox_position || 'Pendente'
      };
    }).sort((a, b) => a['Nome'].localeCompare(b['Nome'], 'pt-BR'));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 25 }, // Cargo
      { wch: 20 }, // Departamento
      { wch: 16 }, // Autoavaliação
      { wch: 18 }, // Avaliação do Líder
      { wch: 14 }, // Consenso
      { wch: 10 }, // PDI
      { wch: 16 }, // Posição Nine Box
    ];
    applySheetStyles(ws, 8, data.length, colWidths, [3, 4, 5, 6, 7]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_avaliacoes_${dataAtual}.xlsx`);
    toast.success('Relatório Excel gerado com sucesso!');
  };

  const printReport = () => {
    window.print();
    toast.success('Preparando impressão...');
  };

  const shareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link do relatório copiado!');
  };

  const getStatusLabel = (status: string | null | undefined): string => {
    switch (status) {
      case 'completed': return 'Completo';
      case 'in-progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'n/a': return 'N/A';
      default: return 'Aguardando';
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const label = getStatusLabel(status);
    const statusConfig = {
      'Completo': {
        bgColor: 'bg-status-success/10',
        textColor: 'text-status-success',
        borderColor: 'border-status-success/20',
        icon: CheckCircle
      },
      'Em Andamento': {
        bgColor: 'bg-status-warning/10',
        textColor: 'text-status-warning',
        borderColor: 'border-status-warning/20',
        icon: Clock
      },
      'Pendente': {
        bgColor: 'bg-status-danger/10',
        textColor: 'text-status-danger',
        borderColor: 'border-status-danger/20',
        icon: AlertTriangle
      },
      'N/A': {
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        textColor: 'text-gray-500 dark:text-gray-400',
        borderColor: 'border-gray-300 dark:border-gray-600',
        icon: Target
      },
      'Definido': {
        bgColor: 'bg-status-success/10',
        textColor: 'text-status-success',
        borderColor: 'border-status-success/20',
        icon: Target
      },
      'Aguardando': {
        bgColor: 'bg-status-info/10',
        textColor: 'text-status-info',
        borderColor: 'border-status-info/20',
        icon: Clock
      }
    };

    const config = statusConfig[label as keyof typeof statusConfig] || statusConfig['Pendente'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
        <Icon size={10} className="mr-1 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  };

  const getScoreBadge = (score: number | null | undefined) => {
    if (!score) {
      return (
        <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
      );
    }

    const getScoreColor = () => {
      if (score >= 9) return 'text-primary-500 dark:text-primary-400';
      if (score >= 7) return 'text-gray-600 dark:text-gray-500';
      if (score >= 5) return 'text-yellow-600 dark:text-yellow-500';
      return 'text-red-600 dark:text-red-500';
    };

    return (
      <span className={`text-lg font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}
      </span>
    );
  };

  const getNineBoxBadge = (position: string | null | undefined, item?: CycleDashboard) => {
    if (!position) {
      // Se for diretor (autoavaliação e consenso são n/a), mostrar N/A ao invés de Pendente
      if (item && item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a') {
        return (
          <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
        );
      }
      return (
        <span className="text-sm text-gray-400 dark:text-gray-600">Pendente</span>
      );
    }

    // Configuração de cores baseada na posição
    const positionConfig: Record<string, { bg: string; text: string; border: string }> = {
      'B1': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
      'B2': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
      'B3': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
      'B4': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
      'B5': { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' },
      'B6': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
      'B7': { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700' },
      'B8': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700' },
      'B9': { bg: 'bg-primary-500 dark:bg-primary-600', text: 'text-white', border: 'border-primary-500 dark:border-primary-700' },
    };

    const config = positionConfig[position] || {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
        {position}
      </span>
    );
  };

  if (loading || evaluationLoading) {
    return <LoadingSpinner minHeight="min-h-[60vh]" />;
  }

  if (!currentCycle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhum ciclo de avaliação ativo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center flex-wrap">
              <BarChart3 className="text-primary-500 dark:text-primary-400 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Central de Relatórios</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Acompanhe o progresso das avaliações - {currentCycle.title}
            </p>
          </div>
          
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={printReport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-600/20 rounded-lg transition-all duration-200"
              title="Imprimir"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={shareReport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-600/20 rounded-lg transition-all duration-200"
              title="Compartilhar"
            >
              <Share2 size={18} />
            </button>
            <Button
              variant="outline"
              onClick={exportPDF}
              icon={<FileDown size={16} />}
              size="sm"
            >
              PDF
            </Button>
            <Button
              variant="primary"
              onClick={exportExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Excel
            </Button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-600/20 rounded-lg transition-all duration-200"
            >
              {showMobileActions ? <X size={20} /> : <MoreVertical size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Actions Menu */}
        {showMobileActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2"
          >
            <Button
              variant="outline"
              onClick={printReport}
              icon={<Printer size={16} />}
              size="sm"
            >
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={shareReport}
              icon={<Share2 size={16} />}
              size="sm"
            >
              Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={exportPDF}
              icon={<FileDown size={16} />}
              size="sm"
            >
              PDF
            </Button>
            <Button
              variant="primary"
              onClick={exportExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Excel
            </Button>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-naue-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'overview'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 size={16} />
            <span>Visão Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'detailed'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users size={16} />
            <span>Detalhado</span>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'extract'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FileDown size={16} />
            <span>Extrair</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'extract' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Relatório de Avaliações */}
          <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-top-teal-light dark:bg-top-teal/20 rounded-lg">
                <FileSpreadsheet className="text-top-teal dark:text-top-teal" size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Relatório de Avaliações</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
              Exporta nome, cargo, departamento, email, status e notas de cada etapa (autoavaliação, líder, consenso) e posição Nine Box.
            </p>
            <Button
              variant="primary"
              onClick={exportEvaluationsExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Baixar Excel
            </Button>
          </div>

          {/* Relatório de Colaboradores */}
          <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-top-blue-light dark:bg-top-blue/20 rounded-lg">
                <Users className="text-top-blue dark:text-top-blue" size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Relatório de Colaboradores</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
              Exporta dados cadastrais: nome, email, cargo, departamento, time(s), líder, data de admissão, tipo de contrato e status.
            </p>
            <Button
              variant="primary"
              onClick={exportEmployeesExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Baixar Excel
            </Button>
          </div>

          {/* Relatório de Gestão Salarial */}
          <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-accent-50 dark:bg-accent-500/20 rounded-lg">
                <BarChart3 className="text-accent-500 dark:text-accent-400" size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Relatório de Gestão Salarial</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
              Exporta dados salariais: nome, cargo, departamento, trilha, classe salarial, nível, salário atual e tipo de contrato.
            </p>
            <Button
              variant="primary"
              onClick={exportSalaryExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Baixar Excel
            </Button>
          </div>

          {/* Relatório Nine Box */}
          <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-top-gold-light dark:bg-top-gold/20 rounded-lg">
                <Target className="text-top-gold-dark dark:text-top-gold" size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Relatório Nine Box</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
              Exporta dados do Nine Box: nome, cargo, departamento, notas de performance e potencial, posição, quadrante promovido e deliberações do comitê.
            </p>
            <Button
              variant="primary"
              onClick={exportNineBoxExcel}
              icon={<Download size={16} />}
              size="sm"
            >
              Baixar Excel
            </Button>
          </div>
        </motion.div>
      ) : activeTab === 'overview' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-xl shadow-lg text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                  {summaryData.completionRate}%
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{summaryData.totalEmployees}</h3>
              <p className="text-sm opacity-90">Total de Colaboradores</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {summaryData.totalEmployees > 0 ? Math.round((summaryData.completedEvaluations / summaryData.totalEmployees) * 100) : 0}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {summaryData.completedEvaluations}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avaliações Completas</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {summaryData.totalEmployees > 0 ? Math.round((summaryData.inProgress / summaryData.totalEmployees) * 100) : 0}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {summaryData.inProgress}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                  {summaryData.totalEmployees > 0 ? Math.round((summaryData.pending / summaryData.totalEmployees) * 100) : 0}%
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{summaryData.pending}</h3>
              <p className="text-sm opacity-90">Pendentes</p>
            </motion.div>

          </div>

          {/* Progress by Department */}
          <div className="bg-naue-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <BarChart3 className="mr-2 text-primary-500 dark:text-primary-400" size={20} />
              Progresso por Departamento
            </h2>

            <div className="space-y-3">
              {/* OTIMIZADO: Usar lista já ordenada e memoizada */}
              {sortedDepartmentProgress.map((dept, index) => {
                const completionRate = dept.total > 0
                  ? Math.round((dept.completed / dept.total) * 100)
                  : 0;
                const isExpanded = expandedDepts.has(dept.id);
                const hasTeams = dept.teams && dept.teams.length > 0;

                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    {/* Header do departamento (clicável) */}
                    <div
                      className={`flex items-center gap-4 p-4 ${hasTeams ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} transition-colors`}
                      onClick={() => {
                        if (hasTeams) {
                          setExpandedDepts(prev => {
                            const next = new Set(prev);
                            if (next.has(dept.id)) {
                              next.delete(dept.id);
                            } else {
                              next.add(dept.id);
                            }
                            return next;
                          });
                        }
                      }}
                    >
                      {/* Ícone de expandir */}
                      <div className="w-6 flex-shrink-0">
                        {hasTeams && (
                          isExpanded
                            ? <ChevronDown size={18} className="text-gray-500" />
                            : <ChevronRight size={18} className="text-gray-500" />
                        )}
                      </div>

                      {/* Nome do departamento */}
                      <div className="w-36 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {dept.name}
                        </span>
                      </div>

                      {/* Barra de progresso */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionRate}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05 }}
                            className="h-full rounded-full flex items-center justify-end pr-2"
                            style={{
                              backgroundColor: completionRate === 100
                                ? '#1e40af'
                                : completionRate >= 70
                                  ? '#3b82f6'
                                  : completionRate >= 40
                                    ? '#60a5fa'
                                    : '#93c5fd'
                            }}
                          >
                            {completionRate >= 20 && (
                              <span className="text-xs font-semibold text-white">
                                {completionRate}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                        {completionRate < 20 && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {completionRate}%
                          </span>
                        )}
                      </div>

                      {/* Contador */}
                      <div className="w-16 flex-shrink-0 text-right">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {dept.completed}/{dept.total}
                        </span>
                      </div>
                    </div>

                    {/* Times expandidos */}
                    {isExpanded && hasTeams && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="p-4 pl-14 space-y-3">
                          {dept.teams
                            .sort((a, b) => b.completionRate - a.completionRate)
                            .map((team) => (
                            <div key={team.id} className="flex items-center gap-4">
                              {/* Nome do time */}
                              <div className="w-32 flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate block">
                                  {team.name}
                                </span>
                              </div>

                              {/* Barra de progresso do time */}
                              <div className="flex-1 relative">
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${team.completionRate}%`,
                                      backgroundColor: team.completionRate === 100
                                        ? '#1e40af'
                                        : team.completionRate >= 70
                                          ? '#3b82f6'
                                          : team.completionRate >= 40
                                            ? '#60a5fa'
                                            : '#93c5fd'
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Porcentagem e contador */}
                              <div className="w-24 flex-shrink-0 text-right flex items-center justify-end gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {team.completionRate}% ({team.completed}/{team.total})
                                </span>
                                {team.completionRate === 100 && (
                                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {sortedDepartmentProgress.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhum departamento com colaboradores
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filters */}
          <div className="bg-naue-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">Todos os departamentos</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">Todos os status</option>
                  <option value="completed">Completo</option>
                  <option value="in-progress">Em Andamento</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-naue-light-gray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Colaborador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Autoavaliação
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Líder
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Consenso
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PDI
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posição Nine Box
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-naue-border-gray dark:divide-gray-700">
                  {filteredData.map((item: CycleDashboard) => {
                    // OTIMIZADO: Usar Map para lookup O(1)
                    const user = usersMap.get(item.employee_id);
                    const deptName = getDeptName(item, user);

                    return (
                      <tr key={item.employee_id} className="hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-naue-black dark:text-gray-100">
                              {user?.name || '-'}
                            </div>
                            <div className="text-sm text-naue-text-gray dark:text-gray-400">
                              {user?.position || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-naue-text-gray dark:text-gray-400">
                          {deptName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(item.self_evaluation_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(item.leader_evaluation_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(item.consensus_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a'
                            ? getStatusBadge('n/a')
                            : getStatusBadge(item.ninebox_position ? 'completed' : 'pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getNineBoxBadge(item.ninebox_position, item)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredData.map((item: CycleDashboard, index: number) => {
              // OTIMIZADO: Usar Map para lookup O(1)
              const user = usersMap.get(item.employee_id);
              const deptName = getDeptName(item, user);

              return (
                <motion.div
                  key={item.employee_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-naue-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-600/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-500 dark:text-primary-400">
                        {user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user?.name || '-'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.position || '-'} • {deptName}
                          </p>
                        </div>
                        <div className="ml-3 text-right">
                          {getNineBoxBadge(item.ninebox_position, item)}
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Autoavaliação</p>
                          {getStatusBadge(item.self_evaluation_status)}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Líder</p>
                          {getStatusBadge(item.leader_evaluation_status)}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consenso</p>
                          {getStatusBadge(item.consensus_status)}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">PDI</p>
                          {item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a'
                            ? getStatusBadge('n/a')
                            : getStatusBadge(item.ninebox_position ? 'completed' : 'pending')}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;