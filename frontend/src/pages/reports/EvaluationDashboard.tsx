import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  FileText,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Grid3x3,
  Filter,
  Download,
  Search,
  Award,
} from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useNavigate, useParams } from 'react-router-dom';
import { usersService, departmentsService } from '../../services/supabase.service';
import type { CycleDashboard } from '../../types/evaluation.types';
import type { UserWithDetails, Department } from '../../types/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

const EvaluationDashboard: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { dashboard, currentCycle, loading, loadDashboard } = useEvaluation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (cycleId) {
      loadDashboard(cycleId);
    }
  }, [cycleId, loadDashboard]);

  // Carregar usuários e departamentos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allUsers, allDepts] = await Promise.all([
          usersService.getAll(),
          departmentsService.getAll(),
        ]);
        setUsers(allUsers.filter((u) => u.active));
        setDepartments(allDepts);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, []);

  // Debug: Log dashboard data when it changes
  useEffect(() => {
    if (dashboard.length > 0) {
      console.log(
        'Dashboard state in component:',
        dashboard.map((emp) => ({
          name: emp.employee_name,
          leader_potential_score: emp.leader_potential_score,
          ninebox_position: emp.ninebox_position,
        })),
      );
    }
  }, [dashboard]);

  // Calculate statistics
  const stats = {
    // Total: apenas colaboradores e líderes (sem diretores)
    totalEmployees: dashboard.filter((d) => d.self_evaluation_status !== 'n/a').length,

    // Autoavaliações: apenas colaboradores e líderes (excluir diretores que têm status n/a)
    selfCompleted: dashboard.filter(
      (d) => d.self_evaluation_status === 'completed' && d.consensus_status !== 'n/a',
    ).length,

    // Avaliações de Líder: todos (colaboradores, líderes e diretores)
    leaderCompleted: dashboard.filter((d) => d.leader_evaluation_status === 'completed').length,

    // Consenso: apenas colaboradores e líderes (excluir diretores)
    consensusCompleted: dashboard.filter(
      (d) => d.consensus_status === 'completed' && d.consensus_status !== 'n/a',
    ).length,
  };

  // Filter employees (excluir diretores)
  const filteredEmployees = dashboard.filter((employee) => {
    // Não mostrar diretores na tabela
    if (employee.self_evaluation_status === 'n/a' && employee.consensus_status === 'n/a') {
      return false;
    }

    const matchesSearch =
      employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_position.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && !employee.self_evaluation_id;
    if (filterStatus === 'in-progress')
      return matchesSearch && employee.self_evaluation_id && !employee.consensus_id;
    if (filterStatus === 'completed')
      return matchesSearch && employee.consensus_status === 'completed';

    return matchesSearch;
  });

  const getStatusLabel = (status: string | null | undefined): string => {
    switch (status) {
      case 'completed':
        return 'Completo';
      case 'in-progress':
        return 'Em Andamento';
      case 'pending':
        return 'Pendente';
      case 'n/a':
        return 'N/A';
      default:
        return 'Aguardando';
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const label = getStatusLabel(status);
    const statusConfig = {
      Completo: {
        bgColor: 'bg-success/10',
        textColor: 'text-success',
        borderColor: 'border-success/20',
        icon: CheckCircle,
      },
      'Em Andamento': {
        bgColor: 'bg-warning/10',
        textColor: 'text-warning',
        borderColor: 'border-warning/20',
        icon: Clock,
      },
      Pendente: {
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/20',
        icon: AlertTriangle,
      },
      'N/A': {
        bgColor: 'bg-secondary',
        textColor: 'text-muted-foreground',
        borderColor: 'border-border',
        icon: Target,
      },
      Aguardando: {
        bgColor: 'bg-secondary',
        textColor: 'text-muted-foreground',
        borderColor: 'border-border',
        icon: Clock,
      },
    };

    const config = statusConfig[label as keyof typeof statusConfig] || statusConfig['Pendente'];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
      >
        <Icon size={10} className="mr-1 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  };

  const getNineBoxBadge = (position: string | null | undefined, item?: CycleDashboard) => {
    if (!position) {
      // Se for diretor (autoavaliação e consenso são n/a), mostrar N/A ao invés de Pendente
      if (item && item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a') {
        return <span className="text-sm text-muted-foreground">N/A</span>;
      }
      return <span className="text-sm text-muted-foreground">Pendente</span>;
    }

    // Configuração de cores baseada na posição
    const positionConfig: Record<string, { bg: string; text: string; border: string }> = {
      B1: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-700',
      },
      B2: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-700',
      },
      B3: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-700',
      },
      B4: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-700',
      },
      B5: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-700',
      },
      B6: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700',
      },
      B7: {
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-700',
      },
      B8: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-700',
      },
      B9: {
        bg: 'bg-green-800 dark:bg-green-800',
        text: 'text-white',
        border: 'border-green-800 dark:border-green-700',
      },
    };

    const config = positionConfig[position] || {
      bg: 'bg-secondary',
      text: 'text-muted-foreground',
      border: 'border-border',
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}
      >
        {position}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
              <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Dashboard de Avaliações
            </h1>
            <p className="text-muted-foreground mt-1 truncate">
              {currentCycle?.title || 'Ciclo de Avaliação'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="flex h-11 w-11 flex-shrink-0 items-center justify-center hover:bg-accent rounded-lg transition-all duration-200">
              <Download className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate('/nine-box')}
              className="flex h-11 flex-1 sm:flex-none items-center justify-center px-4 bg-lime text-obsidian rounded-lg hover:bg-lime/90 transition-colors"
            >
              <Grid3x3 className="h-5 w-5 mr-2" />
              Ver Matriz 9-Box
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total de Colaboradores</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Autoavaliações</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.selfCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                  <div
                    className="bg-lime h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.selfCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avaliações do Líder</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.leaderCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                  <div
                    className="bg-lime h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.leaderCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Consensos Finalizados</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.consensusCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                  <div
                    className="bg-lime h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.consensusCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] focus:bg-background"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-border bg-secondary text-foreground rounded-lg focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] focus:bg-background"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="in-progress">Em Andamento</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card rounded-2xl shadow-sm hover:shadow-md border border-border overflow-hidden">
        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Autoavaliação
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Consenso
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  PDI
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Posição Nine Box
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredEmployees.map((item: CycleDashboard) => {
                const user = users.find((u) => u.id === item.employee_id);
                const deptName =
                  item.department_name ||
                  (user?.teams && user.teams[0]
                    ? departments.find((d) => d.id === user.teams![0].department_id)?.name || '-'
                    : '-');

                return (
                  <tr key={item.employee_id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {item.employee_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.employee_position || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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

        {/* Mobile: cards empilhados (um por colaborador) */}
        <div className="divide-y divide-border md:hidden">
          {filteredEmployees.map((item: CycleDashboard) => {
            const user = users.find((u) => u.id === item.employee_id);
            const deptName =
              item.department_name ||
              (user?.teams && user.teams[0]
                ? departments.find((d) => d.id === user.teams![0].department_id)?.name || '-'
                : '-');

            return (
              <div key={item.employee_id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.employee_name || '-'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.employee_position || '-'}
                      {deptName && deptName !== '-' ? ` · ${deptName}` : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getNineBoxBadge(item.ninebox_position, item)}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <span className="text-xs text-muted-foreground">Autoaval.</span>
                    {getStatusBadge(item.self_evaluation_status)}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <span className="text-xs text-muted-foreground">Líder</span>
                    {getStatusBadge(item.leader_evaluation_status)}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <span className="text-xs text-muted-foreground">Consenso</span>
                    {getStatusBadge(item.consensus_status)}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <span className="text-xs text-muted-foreground">PDI</span>
                    {item.self_evaluation_status === 'n/a' && item.consensus_status === 'n/a'
                      ? getStatusBadge('n/a')
                      : getStatusBadge(item.ninebox_position ? 'completed' : 'pending')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDashboard;
