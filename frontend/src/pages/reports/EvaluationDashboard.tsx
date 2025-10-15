import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, FileText, Target, CheckCircle, Clock,
  AlertCircle, AlertTriangle, TrendingUp, Grid3x3, Calendar, Filter,
  Download, Search, ChevronRight, Info, Award
} from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useUserRole } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { usersService, departmentsService } from '../../services/supabase.service';
import type { CycleDashboard } from '../../types/evaluation.types';
import type { UserWithDetails, Department } from '../../types/supabase';

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
          departmentsService.getAll()
        ]);
        setUsers(allUsers.filter(u => u.active));
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
      console.log('Dashboard state in component:', dashboard.map(emp => ({
        name: emp.employee_name,
        leader_potential_score: emp.leader_potential_score,
        ninebox_position: emp.ninebox_position
      })));
    }
  }, [dashboard]);

  // Calculate statistics
  const stats = {
    // Total: apenas colaboradores e líderes (sem diretores)
    totalEmployees: dashboard.filter(d => d.self_evaluation_status !== 'n/a').length,

    // Autoavaliações: apenas colaboradores e líderes (excluir diretores que têm status n/a)
    selfCompleted: dashboard.filter(d =>
      d.self_evaluation_status === 'completed' && d.consensus_status !== 'n/a'
    ).length,

    // Avaliações de Líder: todos (colaboradores, líderes e diretores)
    leaderCompleted: dashboard.filter(d => d.leader_evaluation_status === 'completed').length,

    // Consenso: apenas colaboradores e líderes (excluir diretores)
    consensusCompleted: dashboard.filter(d =>
      d.consensus_status === 'completed' && d.consensus_status !== 'n/a'
    ).length
  };

  // Filter employees (excluir diretores)
  const filteredEmployees = dashboard.filter(employee => {
    // Não mostrar diretores na tabela
    if (employee.self_evaluation_status === 'n/a' && employee.consensus_status === 'n/a') {
      return false;
    }

    const matchesSearch = employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_position.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && !employee.self_evaluation_id;
    if (filterStatus === 'in-progress') return matchesSearch && employee.self_evaluation_id && !employee.consensus_id;
    if (filterStatus === 'completed') return matchesSearch && employee.consensus_status === 'completed';

    return matchesSearch;
  });

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
      'B9': { bg: 'bg-green-800 dark:bg-green-800', text: 'text-white', border: 'border-green-800 dark:border-green-700' },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <BarChart3 className="h-7 w-7 text-primary-500 mr-3" />
              Dashboard de Avaliações
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentCycle?.title || 'Ciclo de Avaliação'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <Download className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/nine-box')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
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
            className="bg-gradient-to-br from-gray-900 to-gray-900 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Total de Colaboradores</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Autoavaliações</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.selfCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-a-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.selfCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Avaliações do Líder</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.leaderCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-secondary-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.leaderCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Target className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Consensos Finalizados</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.consensusCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-accent-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-accent-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.consensusCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Award className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
      <div className="bg-naue-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-naue-border-gray dark:border-gray-700 overflow-hidden">
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
              {filteredEmployees.map((item: CycleDashboard) => {
                const user = users.find(u => u.id === item.employee_id);
                const deptName = item.department_name ||
                  (user?.teams && user.teams[0] ?
                    departments.find(d => d.id === user.teams![0].department_id)?.name || '-' : '-');

                return (
                  <tr key={item.employee_id} className="hover:bg-green-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-naue-black dark:text-gray-100">
                          {item.employee_name || '-'}
                        </div>
                        <div className="text-sm text-naue-text-gray dark:text-gray-400">
                          {item.employee_position || '-'}
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

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum colaborador encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDashboard;