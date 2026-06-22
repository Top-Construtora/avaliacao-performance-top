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
  draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground', icon: FileText },
  open: { label: 'Aberta', color: 'bg-success/15 text-success', icon: PlayCircle },
  in_progress: { label: 'Em Andamento', color: 'bg-warning/15 text-warning', icon: Clock },
  closed: { label: 'Fechada', color: 'bg-destructive/15 text-destructive', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive', icon: StopCircle },
};

const computeSla = (
  opening: JobOpening,
): { days: number; label: string; color: string; closed: boolean } | null => {
  const start = opening.opened_at || opening.created_at;
  if (!start) return null;
  const isClosed = opening.status === 'closed' || opening.status === 'cancelled';
  const end = isClosed ? opening.closed_at || opening.updated_at : new Date().toISOString();
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  const label = `${days} ${days === 1 ? 'dia' : 'dias'}`;
  if (isClosed) {
    return { days, label, color: 'bg-secondary text-muted-foreground', closed: true };
  }
  const color =
    days >= 60
      ? 'bg-destructive/15 text-destructive'
      : days >= 30
        ? 'bg-warning/15 text-warning'
        : 'bg-success/15 text-success';
  return { days, label, color, closed: false };
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-muted-foreground' },
  normal: { label: 'Normal', color: 'text-muted-foreground' },
  high: { label: 'Alta', color: 'text-warning' },
  urgent: { label: 'Urgente', color: 'text-destructive' },
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
      setOpenings((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus as any } : o)),
      );
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vaga?')) return;
    try {
      await recruitmentService.deleteJobOpening(id);
      setOpenings((prev) => prev.filter((o) => o.id !== id));
      toast.success('Vaga excluída');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const filteredOpenings = useMemo(() => {
    return openings.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          o.title.toLowerCase().includes(s) ||
          o.department?.name?.toLowerCase().includes(s) ||
          o.requester?.name?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [openings, statusFilter, searchTerm]);

  const stats = useMemo(
    () => ({
      total: openings.length,
      open: openings.filter((o) => ['open', 'in_progress'].includes(o.status)).length,
      totalCandidates: openings.reduce((sum, o) => sum + (o.candidate_count || 0), 0),
      totalInterviews: openings.reduce((sum, o) => sum + (o.interview_count || 0), 0),
      closed: openings.filter((o) => o.status === 'closed').length,
    }),
    [openings],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
              <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Recrutamento e Seleção
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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
            { value: stats.total, label: 'Total Vagas', icon: Briefcase },
            { value: stats.open, label: 'Abertas', icon: PlayCircle },
            { value: stats.totalCandidates, label: 'Currículos', icon: Users },
            { value: stats.totalInterviews, label: 'Entrevistas', icon: Calendar },
            { value: stats.closed, label: 'Fechadas', icon: CheckCircle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 inline-flex p-2 rounded-lg shadow-sm bg-secondary text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-foreground font-lemon-milk tracking-wide leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1 truncate">
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
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center bg-secondary rounded-xl p-1.5">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'draft', label: 'Rascunhos' },
              { value: 'open', label: 'Abertas' },
              { value: 'in_progress', label: 'Em Andamento' },
              { value: 'closed', label: 'Fechadas' },
              { value: 'cancelled', label: 'Canceladas' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === s.value
                    ? 'bg-card text-lime-deep dark:text-lime shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar vagas, departamentos, solicitantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
          />
        </div>

        {filteredOpenings.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-muted-foreground mb-6">Solicite uma nova vaga para começar</p>
            <Button
              variant="primary"
              onClick={() => navigate('/recruitment/new')}
              icon={<Plus size={18} />}
            >
              Solicitar Vaga
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-secondary">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-3">
                    Vaga
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Departamento
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Local
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    SLA
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Currículos
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Entrevistas
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Posições
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Solicitante
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredOpenings.map((opening) => {
                  const statusInfo = statusConfig[opening.status] || statusConfig.draft;
                  const StatusIcon = statusInfo.icon;
                  const prioInfo = priorityConfig[opening.priority] || priorityConfig.normal;
                  const sla = computeSla(opening);

                  return (
                    <tr key={opening.id} className="hover:bg-accent transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{opening.title}</span>
                          {opening.priority !== 'normal' && (
                            <span
                              className={`inline-flex items-center text-xs font-medium ${prioInfo.color}`}
                            >
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              {prioInfo.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">
                        {opening.department?.name || '—'}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">
                        {opening.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {opening.location}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        {sla ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${sla.color}`}
                            title={
                              sla.closed ? 'Tempo total até o fechamento' : 'Dias desde a abertura'
                            }
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {sla.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-muted-foreground tabular-nums">
                        {opening.candidate_count || 0}
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-muted-foreground tabular-nums">
                        {opening.interview_count || 0}
                      </td>
                      <td className="px-4 py-3 align-middle text-center text-muted-foreground tabular-nums">
                        {opening.positions_count || 1}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">
                        {opening.requester?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/recruitment/${opening.id}`)}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                            title="Visualizar vaga"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/recruitment/${opening.id}/edit`)}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                            title="Editar vaga"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {opening.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(opening.id, 'open')}
                              className="p-2 rounded-lg hover:bg-success/15 text-muted-foreground hover:text-success transition-colors"
                              title="Abrir vaga"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </button>
                          )}

                          {opening.status === 'open' && (
                            <button
                              onClick={() => handleStatusChange(opening.id, 'in_progress')}
                              className="p-2 rounded-lg hover:bg-warning/15 text-muted-foreground hover:text-warning transition-colors"
                              title="Iniciar processo"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}

                          {['open', 'in_progress'].includes(opening.status) && (
                            <button
                              onClick={() => handleStatusChange(opening.id, 'closed')}
                              className="p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                              title="Fechar vaga"
                            >
                              <StopCircle className="h-4 w-4" />
                            </button>
                          )}

                          {['closed', 'cancelled'].includes(opening.status) && (
                            <button
                              onClick={() => handleStatusChange(opening.id, 'open')}
                              className="p-2 rounded-lg hover:bg-success/15 text-muted-foreground hover:text-success transition-colors"
                              title="Reabrir vaga"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(opening.id)}
                              className="p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
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
