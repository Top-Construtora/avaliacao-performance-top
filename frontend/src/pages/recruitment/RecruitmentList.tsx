import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  StopCircle,
  FileText,
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { recruitmentService, JobOpening } from '../../services/recruitment.service';
import { useUserRole } from '../../context/AuthContext';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 dark:bg-yt-elevated text-gray-700 dark:text-gray-300', icon: FileText },
  open: { label: 'Aberta', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: PlayCircle },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Clock },
  closed: { label: 'Fechada', color: 'bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: StopCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-amber-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
};

const RecruitmentList = () => {
  const navigate = useNavigate();
  const { isDirector, isAdmin } = useUserRole();
  const canDelete = isDirector || isAdmin;
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOpenings();
  }, []);

  const loadOpenings = async () => {
    try {
      setLoading(true);
      const data = await recruitmentService.getJobOpenings();
      setOpenings(data);
    } catch (error) {
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await recruitmentService.updateJobOpening(id, { status: newStatus } as any);
      setOpenings(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vaga?')) return;
    try {
      await recruitmentService.deleteJobOpening(id);
      setOpenings(prev => prev.filter(o => o.id !== id));
      toast.success('Vaga excluída');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const filteredOpenings = useMemo(() => {
    return openings.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return o.title.toLowerCase().includes(s) ||
          o.department?.name?.toLowerCase().includes(s) ||
          o.requester?.name?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [openings, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: openings.length,
    open: openings.filter(o => ['open', 'in_progress'].includes(o.status)).length,
    totalCandidates: openings.reduce((sum, o) => sum + (o.candidate_count || 0), 0),
    totalInterviews: openings.reduce((sum, o) => sum + (o.interview_count || 0), 0),
    closed: openings.filter(o => o.status === 'closed').length,
  }), [openings]);

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
              <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-900 dark:text-primary-300 mr-2 sm:mr-3 flex-shrink-0" />
              Recrutamento e Seleção
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Gerencie vagas, candidatos e processos seletivos
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/recruitment/new')}
            icon={<Plus size={18} />}
            size="lg"
          >
            Solicitar Vaga
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-300 font-medium">Total Vagas</p>
            </div>
            <Briefcase className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.open}</p>
              <p className="text-sm text-green-100 font-medium">Abertas</p>
            </div>
            <PlayCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-green-400 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.totalCandidates}</p>
              <p className="text-sm text-primary-100 font-medium">Currículos</p>
            </div>
            <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-primary-600 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.totalInterviews}</p>
              <p className="text-sm text-blue-100 font-medium">Entrevistas</p>
            </div>
            <Calendar className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-400 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.closed}</p>
              <p className="text-sm text-stone-100 font-medium">Fechadas</p>
            </div>
            <CheckCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-stone-600 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Filters & List */}
      <div className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center bg-gray-100/80 dark:bg-yt-elevated/50 rounded-xl p-1.5">
            {['all', 'open', 'in_progress', 'draft', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-yt-elevated text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {s === 'all' ? 'Todas' : s === 'open' ? 'Abertas' : s === 'in_progress' ? 'Em Andamento' : s === 'draft' ? 'Rascunhos' : 'Fechadas'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar vagas, departamentos, solicitantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3"
          />
        </div>

        <div className="space-y-3">
          {filteredOpenings.map(opening => {
            const statusInfo = statusConfig[opening.status] || statusConfig.draft;
            const StatusIcon = statusInfo.icon;
            const prioInfo = priorityConfig[opening.priority] || priorityConfig.normal;

            return (
              <motion.div
                key={opening.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-yt-elevated/50 rounded-xl border border-gray-100 dark:border-yt-border hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <Briefcase className="h-5 w-5 text-primary-700 dark:text-primary-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{opening.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </span>
                      {opening.priority !== 'normal' && (
                        <span className={`text-xs font-medium ${prioInfo.color}`}>
                          <AlertCircle className="h-3 w-3 inline mr-0.5" />
                          {prioInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      {opening.department && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {opening.department.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {opening.candidate_count || 0} currículos
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {opening.interview_count || 0} entrevistas
                      </span>
                      {opening.positions_count > 1 && (
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3.5 w-3.5" />
                          {opening.positions_count} posições
                        </span>
                      )}
                      {opening.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {opening.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Solicitado por: {opening.requester?.name || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/recruitment/${opening.id}`)}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {opening.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(opening.id, 'open')}
                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-gray-500 hover:text-green-600 transition-colors"
                        title="Abrir vaga"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}

                    {opening.status === 'open' && (
                      <button
                        onClick={() => handleStatusChange(opening.id, 'in_progress')}
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Iniciar processo"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    )}

                    {['open', 'in_progress'].includes(opening.status) && (
                      <button
                        onClick={() => handleStatusChange(opening.id, 'closed')}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900/20 text-gray-500 hover:text-stone-600 transition-colors"
                        title="Fechar vaga"
                      >
                        <StopCircle className="h-4 w-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(opening.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredOpenings.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Solicite uma nova vaga para começar</p>
            <Button variant="primary" onClick={() => navigate('/recruitment/new')} icon={<Plus size={18} />}>
              Solicitar Vaga
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentList;
