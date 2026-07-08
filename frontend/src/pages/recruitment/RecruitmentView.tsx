import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Users as UsersIcon,
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  UserPlus,
  Mail,
  Phone,
  Pencil,
  Trash2,
} from 'lucide-react';
import { recruitmentService, JobOpening } from '../../services/recruitment.service';
import { formatDateBR } from '../../utils/date';

const candidateStatusConfig: Record<string, { label: string; color: string }> = {
  received: { label: 'Recebido', color: 'bg-secondary text-muted-foreground' },
  screening: { label: 'Triagem', color: 'bg-warning/15 text-warning' },
  interview_scheduled: { label: 'Entrevista Agendada', color: 'bg-warning/15 text-warning' },
  interviewed: { label: 'Entrevistado', color: 'bg-lime/20 text-lime-deep dark:text-lime' },
  approved: { label: 'Aprovado', color: 'bg-success/15 text-success' },
  rejected: { label: 'Reprovado', color: 'bg-destructive/15 text-destructive' },
  hired: { label: 'Contratado', color: 'bg-success/15 text-success' },
};

const statusBadge: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground' },
  open: { label: 'Aberta', color: 'bg-success/15 text-success' },
  in_progress: { label: 'Em Andamento', color: 'bg-warning/15 text-warning' },
  closed: { label: 'Fechada', color: 'bg-destructive/15 text-destructive' },
  cancelled: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive' },
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const contractLabels: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  INTERN: 'Estágio',
};

const formatCurrency = (value: number | null) =>
  value != null
    ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      })
    : '—';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </dt>
    <dd className="text-sm text-foreground">
      {value || <span className="text-muted-foreground">—</span>}
    </dd>
  </div>
);

const InfoBlock = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </dt>
    <dd className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
      {value?.trim() || <span className="text-muted-foreground">—</span>}
    </dd>
  </div>
);

const inputClass =
  'w-full rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background focus:outline-none transition-colors py-2 px-3';

const RecruitmentView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<JobOpening | null>(null);

  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSource, setNewSource] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (id) loadOpening();
  }, [id]);

  const loadOpening = async () => {
    try {
      setLoading(true);
      const data = await recruitmentService.getJobOpeningById(id!);
      setOpening(data);
    } catch (error) {
      toast.error('Erro ao carregar vaga');
      navigate('/recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newName.trim()) {
      toast.error('Nome do candidato é obrigatório');
      return;
    }
    try {
      setAdding(true);
      await recruitmentService.createCandidate({
        job_opening_id: id!,
        name: newName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        source: newSource || null,
      });
      toast.success('Candidato adicionado');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewSource('');
      setShowAddCandidate(false);
      loadOpening();
    } catch {
      toast.error('Erro ao adicionar candidato');
    } finally {
      setAdding(false);
    }
  };

  const handleCandidateStatus = async (candidateId: string, status: string) => {
    try {
      await recruitmentService.updateCandidate(candidateId, { status } as any);
      setOpening((prev) =>
        prev
          ? {
              ...prev,
              candidates: prev.candidates?.map((c) =>
                c.id === candidateId ? { ...c, status } : c,
              ),
            }
          : null,
      );
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!window.confirm('Remover este candidato?')) return;
    try {
      await recruitmentService.deleteCandidate(candidateId);
      setOpening((prev) =>
        prev
          ? {
              ...prev,
              candidates: prev.candidates?.filter((c) => c.id !== candidateId),
            }
          : null,
      );
      toast.success('Candidato removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!opening) return null;

  const status = statusBadge[opening.status] || statusBadge.draft;
  const candidates = opening.candidates || [];
  const salaryDisplay =
    opening.salary_range_min || opening.salary_range_max
      ? `${formatCurrency(opening.salary_range_min)} – ${formatCurrency(opening.salary_range_max)}`
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/recruitment')}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Briefcase className="h-6 w-6 text-lime-deep dark:text-lime flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {opening.title}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              {opening.requester && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Solicitado por {opening.requester.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="primary"
              onClick={() => navigate(`/recruitment/${id}/edit`)}
              icon={<Pencil size={16} />}
              size="sm"
            >
              Editar Vaga
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 50/50 split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Job data (read-only) */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-5 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
              Descrição da Vaga
            </h2>
            <dl className="grid grid-cols-2 gap-4 mb-4">
              <InfoRow label="Departamento" value={opening.department?.name} />
              <InfoRow label="Nº de Posições" value={opening.positions_count} />
              <InfoRow
                label="Tipo de Contrato"
                value={contractLabels[opening.contract_type || ''] || opening.contract_type}
              />
              <InfoRow
                label="Prioridade"
                value={priorityLabels[opening.priority] || opening.priority}
              />
              <InfoRow
                label="Local"
                value={
                  opening.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {opening.location}
                    </span>
                  ) : null
                }
              />
              <InfoRow
                label="Salário"
                value={
                  salaryDisplay ? (
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {salaryDisplay}
                    </span>
                  ) : null
                }
              />
            </dl>
            <div className="space-y-4 pt-4 border-t border-border">
              <InfoBlock label="Descrição" value={opening.description} />
              <InfoBlock label="Requisitos" value={opening.requirements} />
              <InfoBlock label="Benefícios" value={opening.benefits} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-5 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
              Brief do Gestor
            </h2>
            <div className="space-y-4">
              <InfoBlock label="Motivo da abertura" value={opening.brief_reason} />
              <InfoRow
                label="Previsão de início"
                value={
                  opening.brief_expected_start ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateBR(opening.brief_expected_start)}
                    </span>
                  ) : null
                }
              />
              <InfoBlock label="Contexto da equipe" value={opening.brief_team_context} />
              <InfoBlock label="Atividades principais" value={opening.brief_key_activities} />
              <InfoBlock label="Habilidades necessárias" value={opening.brief_required_skills} />
              <InfoBlock label="Diferenciais desejáveis" value={opening.brief_nice_to_have} />
              <InfoBlock label="Observações" value={opening.brief_observations} />
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Candidates (editable) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6 h-fit lg:sticky lg:top-4"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
              Candidatos
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                ({candidates.length})
              </span>
            </h2>
            {!showAddCandidate && (
              <Button
                variant="outline"
                onClick={() => setShowAddCandidate(true)}
                icon={<UserPlus size={16} />}
                size="sm"
              >
                Adicionar
              </Button>
            )}
          </div>

          {/* Add candidate form — improved */}
          {showAddCandidate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 sm:p-5 bg-secondary rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-4 w-4 text-lime-deep dark:text-lime" />
                <h3 className="text-sm font-bold text-foreground">Novo candidato</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome completo"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Fonte
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indicacao">Indicação</option>
                    <option value="site">Site</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddCandidate(false);
                    setNewName('');
                    setNewEmail('');
                    setNewPhone('');
                    setNewSource('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddCandidate}
                  disabled={adding || !newName.trim()}
                  icon={<Plus size={14} />}
                >
                  {adding ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Candidates list */}
          <div className="space-y-2">
            {candidates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum candidato registrado</p>
                {!showAddCandidate && (
                  <button
                    onClick={() => setShowAddCandidate(true)}
                    className="text-xs font-semibold text-lime-deep dark:text-lime hover:underline mt-2"
                  >
                    Adicionar primeiro candidato
                  </button>
                )}
              </div>
            ) : (
              candidates.map((candidate) => {
                const statusInfo =
                  candidateStatusConfig[candidate.status] || candidateStatusConfig.received;
                return (
                  <div
                    key={candidate.id}
                    className="group flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border hover:border-border transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-lime text-obsidian flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {candidate.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {candidate.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground truncate">
                        {candidate.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                          </span>
                        )}
                        {candidate.source && (
                          <span className="capitalize flex-shrink-0">{candidate.source}</span>
                        )}
                      </div>
                    </div>
                    <select
                      value={candidate.status}
                      onChange={(e) => handleCandidateStatus(candidate.id, e.target.value)}
                      className={`text-xs rounded-lg border-0 font-medium px-2 py-1 focus:ring-2 focus:ring-[#D2FF00]/20 ${statusInfo.color}`}
                    >
                      {Object.entries(candidateStatusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/15 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruitmentView;
