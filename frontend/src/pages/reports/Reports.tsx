import { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import Button from '../../components/Button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useEvaluation } from '../../hooks/useEvaluation';
import { evaluationService } from '../../services/evaluation.service';
import { departmentsService, usersService, teamsService } from '../../services/supabase.service';
import type { Department, UserWithDetails, Team } from '../../types/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CycleDashboard, EvaluationCycle } from '../../types/evaluation.types';

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
  
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
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

  // Calcular progresso por departamento (com times)
  useEffect(() => {
    if (dashboard && dashboard.length > 0 && departments.length > 0 && teams.length > 0) {
      const progressByDept = departments.map(dept => {
        // Filtrar colaboradores do departamento
        const deptEmployees = dashboard.filter((d: CycleDashboard) => {
          return d.department_name?.toLowerCase() === dept.name.toLowerCase();
        });

        const total = deptEmployees.length;
        const completed = deptEmployees.filter(isEvaluationCompleted).length;

        // Calcular em andamento
        const inProgress = deptEmployees.filter((d: CycleDashboard) => {
          if (isEvaluationCompleted(d)) return false;
          const isDirector = d.self_evaluation_status === 'n/a' && d.consensus_status === 'n/a';
          if (isDirector) {
            return d.leader_evaluation_status === 'completed' || d.leader_evaluation_status === 'in-progress';
          }
          return d.self_evaluation_status === 'completed' || d.leader_evaluation_status === 'completed';
        }).length;

        const pending = total - completed - inProgress;

        // Calcular progresso por time dentro do departamento
        const deptTeams = teams.filter(t => t.department_id === dept.id);
        const teamsProgress = deptTeams.map(team => {
          const teamEmployees = deptEmployees.filter((d: CycleDashboard) => {
            return d.team_name?.toLowerCase() === team.name.toLowerCase();
          });
          const teamTotal = teamEmployees.length;
          const teamCompleted = teamEmployees.filter(isEvaluationCompleted).length;

          return {
            id: team.id,
            name: team.name,
            total: teamTotal,
            completed: teamCompleted,
            completionRate: teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0
          };
        }).filter(t => t.total > 0); // Apenas times com colaboradores

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

      setDepartmentProgress(progressByDept);
    }
  }, [dashboard, departments, teams]);

  // Filtrar dados para a visão detalhada
  const filteredData = dashboard.filter((item: CycleDashboard) => {
    // Não mostrar diretores na tabela
    if (item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a') {
      return false;
    }

    const user = users.find(u => u.id === item.employee_id);
    if (!user) return false;

    const matchesSearch = !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !selectedDepartment ||
      user.teams?.some(t => t.department_id === selectedDepartment);

    const matchesStatus = !selectedStatus ||
      item.self_evaluation_status === selectedStatus ||
      item.leader_evaluation_status === selectedStatus ||
      item.consensus_status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

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
      const user = users.find(u => u.id === item.employee_id);
      const deptName = item.department_name ||
        (user?.teams && user.teams[0] ?
          departments.find(d => d.id === user.teams![0].department_id)?.name || '-' : '-');

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
    const data = filteredData.map((item: CycleDashboard) => {
      const user = users.find(u => u.id === item.employee_id);
      const deptName = item.department_name ||
        (user?.teams && user.teams[0] ?
          departments.find(d => d.id === user.teams![0].department_id)?.name || '-' : '-');

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
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
    
    XLSX.writeFile(wb, 'relatorio_avaliacoes.xlsx');
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 dark:border-primary-400"></div>
      </div>
    );
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
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
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
              {departmentProgress
                .filter(dept => dept.total > 0)
                .sort((a, b) => {
                  const rateA = a.total > 0 ? (a.completed / a.total) * 100 : 0;
                  const rateB = b.total > 0 ? (b.completed / b.total) * 100 : 0;
                  return rateB - rateA;
                })
                .map((dept, index) => {
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

              {departmentProgress.filter(dept => dept.total > 0).length === 0 && (
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
                    const user = users.find(u => u.id === item.employee_id);
                    // Priorizar department_name do dashboard, depois buscar por teams
                    const deptName = item.department_name ||
                      (user?.teams && user.teams[0] ?
                        departments.find(d => d.id === user.teams![0].department_id)?.name || '-' : '-');

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
              const user = users.find(u => u.id === item.employee_id);
              // Priorizar department_name do dashboard, depois buscar por teams
              const deptName = item.department_name ||
                (user?.teams && user.teams[0] ?
                  departments.find(d => d.id === user.teams![0].department_id)?.name || '-' : '-');
              
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