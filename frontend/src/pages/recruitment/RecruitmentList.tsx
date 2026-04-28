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
  Pencil,
  Trash2,
  PlayCircle,
  StopCircle,
  FileText,
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {[
            { value: stats.total, label: 'Total Vagas', icon: Briefcase, gradient: 'linear-gradient(135deg, #1e6076 0%, #12b0a0 100%)' },
            { value: stats.open, label: 'Abertas', icon: PlayCircle, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
            { value: stats.totalCandidates, label: 'Currículos', icon: Users, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
            { value: stats.totalInterviews, label: 'Entrevistas', icon: Calendar, gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
            { value: stats.closed, label: 'Fechadas', icon: CheckCircle, gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative bg-white dark:bg-yt-surface rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-yt-border shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 inline-flex p-2 rounded-lg shadow-sm"
                    style={{ background: stat.gradient }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-lemon-milk tracking-wide leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-1 truncate">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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

        {filteredOpenings.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Solicite uma nova vaga para começar</p>
            <Button variant="primary" onClick={() => navigate('/recruitment/new')} icon={<Plus size={18} />}>
              Solicitar Vaga
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-yt-border">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-yt-border text-sm">
              <thead className="bg-gray-50 dark:bg-yt-elevated/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th scope="col" className="px-4 py-3">Vaga</th>
                  <th scope="col" className="px-4 py-3">Departamento</th>
                  <th scope="col" className="px-4 py-3">Local</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-center">Currículos</th>
                  <th scope="col" className="px-4 py-3 text-center">Entrevistas</th>
                  <th scope="col" className="px-4 py-3 text-center">Posições</th>
                  <th scope="col" className="px-4 py-3">Solicitante</th>
                  <th scope="col" className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-yt-border bg-white dark:bg-yt-surface">
                {filteredOpenings.map(opening => {
                  const statusInfo = statusConfig[opening.status] || statusConfig.draft;
                  const StatusIcon = statusInfo.icon;
                  const prioInfo = priorityConfig[opening.priority] || priorityConfig.normal;

                  return (
                    <tr
                      key={opening.id}
                      className="hover:bg-gray-50 dark:hover:bg-yt-elevated/40 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{opening.title}</span>
                          {opening.priority !== 'normal' && (
                            <span className={`inline-flex items-center text-xs font-medium ${prioInfo.color}`}>
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              {prioInfo.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300">
                        {opening.department?.name || '—'}
                      </td>
                      <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300">
                        {opening.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {opening.location}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-gray-700 dark:text-gray-200 tabular-nums">
                        {opening.candidate_count || 0}
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-gray-700 dark:text-gray-200 tabular-nums">
                        {opening.interview_count || 0}
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-gray-700 dark:text-gray-200 tabular-nums">
                        {opening.positions_count || 1}
                      </td>
                      <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-300">
                        {opening.requester?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/recruitment/${opening.id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-600 transition-colors"
                            title="Visualizar vaga"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/recruitment/${opening.id}/edit`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-600 transition-colors"
                            title="Editar vaga"
                          >
                            <Pencil className="h-4 w-4" />
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentList;
