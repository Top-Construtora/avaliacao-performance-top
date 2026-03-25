import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Filter,
  UserMinus,
  UserCheck,
} from 'lucide-react';
import { interviewService, Interview } from '../../services/interview.service';
import { useAuth } from '../../context/AuthContext';

type TabFilter = 'all' | 'ninety_days' | 'exit';
type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const statusConfig = {
  scheduled: { label: 'Agendada', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Calendar },
  in_progress: { label: 'Em Andamento', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  completed: { label: 'Concluída', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: XCircle },
};

const InterviewList = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getInterviews();
      setInterviews(data);
    } catch (error) {
      toast.error('Erro ao carregar entrevistas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrevista?')) return;
    try {
      await interviewService.deleteInterview(id);
      setInterviews(prev => prev.filter(i => i.id !== id));
      toast.success('Entrevista excluída com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir entrevista');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await interviewService.updateInterview(id, { status: newStatus } as any);
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (tabFilter !== 'all' && interview.type !== tabFilter) return false;
      if (statusFilter !== 'all' && interview.status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          interview.employee?.name?.toLowerCase().includes(search) ||
          interview.employee?.position?.toLowerCase().includes(search) ||
          interview.interviewer?.name?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [interviews, tabFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: interviews.length,
    ninetyDays: interviews.filter(i => i.type === 'ninety_days').length,
    exit: interviews.filter(i => i.type === 'exit').length,
    scheduled: interviews.filter(i => i.status === 'scheduled').length,
    completed: interviews.filter(i => i.status === 'completed').length,
  }), [interviews]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-900 dark:text-primary-700 mr-2 sm:mr-3 flex-shrink-0" />
              Entrevistas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Entrevistas de 90 dias e desligamento
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/interviews/new')}
            icon={<Plus size={18} />}
            size="lg"
          >
            Nova Entrevista
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-300 font-medium">Total</p>
            </div>
            <ClipboardList className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.ninetyDays}</p>
              <p className="text-sm text-primary-100 font-medium">90 Dias</p>
            </div>
            <UserCheck className="absolute -bottom-2 -right-2 h-16 w-16 text-primary-600 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.exit}</p>
              <p className="text-sm text-stone-100 font-medium">Desligamento</p>
            </div>
            <UserMinus className="absolute -bottom-2 -right-2 h-16 w-16 text-stone-600 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
              <p className="text-sm text-blue-100 font-medium">Agendadas</p>
            </div>
            <Calendar className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-400 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-sm text-green-100 font-medium">Concluídas</p>
            </div>
            <CheckCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-green-400 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Filters & List */}
      <div className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            {/* Tabs de tipo */}
            <div className="flex items-center bg-gray-100/80 dark:bg-yt-elevated/50 backdrop-blur-sm rounded-xl p-1.5">
              <button
                onClick={() => setTabFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tabFilter === 'all'
                    ? 'bg-white dark:bg-yt-elevated text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setTabFilter('ninety_days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tabFilter === 'ninety_days'
                    ? 'bg-white dark:bg-yt-elevated text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                90 Dias
              </button>
              <button
                onClick={() => setTabFilter('exit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tabFilter === 'exit'
                    ? 'bg-white dark:bg-yt-elevated text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Desligamento
              </button>
            </div>

            {/* Filtro de status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="scheduled">Agendadas</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por colaborador, cargo ou entrevistador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredInterviews.map(interview => {
            const statusInfo = statusConfig[interview.status];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-yt-elevated/50 rounded-xl border border-gray-100 dark:border-yt-border hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center p-4 gap-4">
                  {/* Tipo badge */}
                  <div className={`flex-shrink-0 p-2.5 rounded-xl ${
                    interview.type === 'ninety_days'
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-stone-100 dark:bg-stone-900/30'
                  }`}>
                    {interview.type === 'ninety_days' ? (
                      <UserCheck className={`h-5 w-5 ${
                        interview.type === 'ninety_days'
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-stone-700 dark:text-stone-400'
                      }`} />
                    ) : (
                      <UserMinus className="h-5 w-5 text-stone-700 dark:text-stone-400" />
                    )}
                  </div>

                  {/* Info do colaborador */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {interview.employee?.name || 'Colaborador'}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        interview.type === 'ninety_days'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300'
                      }`}>
                        {interview.type === 'ninety_days' ? '90 Dias' : 'Desligamento'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {interview.employee?.position || ''}
                      {interview.interviewer && ` • Entrevistador: ${interview.interviewer.name}`}
                    </p>
                  </div>

                  {/* Data agendada */}
                  <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[140px]">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {interview.scheduled_date
                        ? new Date(interview.scheduled_date).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:flex items-center min-w-[130px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/interviews/${interview.id}`)}
                      className="p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {interview.status !== 'completed' && interview.status !== 'cancelled' && (
                      <button
                        onClick={() => navigate(`/interviews/${interview.id}/edit`)}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Preencher entrevista"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(interview.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredInterviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
              <ClipboardList className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma entrevista encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Crie uma nova entrevista para começar</p>
            <Button
              variant="primary"
              onClick={() => navigate('/interviews/new')}
              icon={<Plus size={18} />}
            >
              Nova Entrevista
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InterviewList;
