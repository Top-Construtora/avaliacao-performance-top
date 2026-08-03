import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  MessagesSquare,
  Send,
  Inbox,
  HandHelping,
  ShieldCheck,
  Plus,
  Loader2,
  Check,
  CheckCheck,
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth, useUserRole } from '../../context/AuthContext';
import {
  feedbackApiService,
  Feedback,
  FeedbackRequest,
  FeedbackType,
} from '../../services/feedback.service';
import { userService } from '../../services/user.service';
import { competencyService } from '../../services/competency.service';
import { sanitizeSheetData } from '../../utils/exportSafety';

type Tab = 'received' | 'sent' | 'requests' | 'admin';

// Competências fixas do modelo de avaliação (técnicas + comportamentais)
const FIXED_COMPETENCIES = [
  'Gestão do Conhecimento',
  'Orientação a Resultados',
  'Pensamento Crítico',
  'Aderência aos Processos',
  'Comunicação',
  'Inteligência Emocional',
  'Colaboração',
  'Flexibilidade',
];

const TYPE_COLOR_CLASSES: Record<string, string> = {
  green: 'bg-success/15 text-success',
  lime: 'bg-lime/20 text-lime-deep dark:text-lime',
  blue: 'bg-info/15 text-info',
  amber: 'bg-warning/15 text-warning',
  red: 'bg-destructive/15 text-destructive',
  gray: 'bg-secondary text-muted-foreground',
};

function typeBadgeClasses(color?: string) {
  return TYPE_COLOR_CLASSES[color || 'gray'] || TYPE_COLOR_CLASSES.gray;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Feedbacks = () => {
  const { profile } = useAuth();
  const { isAdmin, isDirector } = useUserRole();
  const privileged = isAdmin || isDirector;

  const [tab, setTab] = useState<Tab>('received');
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [requests, setRequests] = useState<{
    received: FeedbackRequest[];
    sent: FeedbackRequest[];
  }>({ received: [], sent: [] });
  const [types, setTypes] = useState<FeedbackType[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; position?: string | null }>>(
    [],
  );
  const [competencyOptions, setCompetencyOptions] = useState<string[]>(FIXED_COMPETENCIES);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total: number; by_type: Record<string, number> }>({
    total: 0,
    by_type: {},
  });

  // Modal de envio
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipient_id: '',
    type_id: '',
    message: '',
    competencies: [] as string[],
    internal_note: '',
    request_id: undefined as string | undefined,
  });
  const [sending, setSending] = useState(false);

  // Modal de solicitação
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ requested_id: '', message: '' });
  const [requesting, setRequesting] = useState(false);

  // Ciência com comentário
  const [ackTarget, setAckTarget] = useState<Feedback | null>(null);
  const [ackComment, setAckComment] = useState('');
  const [acking, setAcking] = useState(false);

  // Filtros da visão admin
  const [adminTypeFilter, setAdminTypeFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadTab = useCallback(
    async (targetTab: Tab, pageNum = 1) => {
      setLoading(true);
      try {
        if (targetTab === 'requests') {
          setRequests(await feedbackApiService.listRequests());
        } else if (targetTab === 'admin') {
          const result = await feedbackApiService.adminList({
            page: pageNum,
            type_id: adminTypeFilter || undefined,
          });
          setFeedbacks(result.data);
          setPage(result.page);
          setTotalPages(result.totalPages);
        } else {
          const [result, summaryResult] = await Promise.all([
            feedbackApiService.list(targetTab, pageNum, typeFilter || undefined),
            feedbackApiService.summary(targetTab),
          ]);
          setFeedbacks(result.data);
          setPage(result.page);
          setTotalPages(result.totalPages);
          setSummary(summaryResult);
        }
      } catch {
        toast.error('Erro ao carregar feedbacks');
      } finally {
        setLoading(false);
      }
    },
    [adminTypeFilter, typeFilter],
  );

  useEffect(() => {
    loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, typeFilter]);

  // Dados de apoio (tipos, usuários, competências) — uma vez
  useEffect(() => {
    feedbackApiService
      .listTypes()
      .then(setTypes)
      .catch(() => toast.error('Erro ao carregar tipos de feedback'));
    userService
      .getUsers({ active: true })
      .then((list: any[]) =>
        setUsers(
          list
            .filter((u) => u.id !== profile?.id)
            .map((u) => ({ id: u.id, name: u.name, position: u.position })),
        ),
      )
      .catch(() => undefined);
    competencyService
      .getOrganizationalCompetencies()
      .then((orgs) => {
        const names = (orgs || []).map((o) => o.name).filter(Boolean);
        setCompetencyOptions([...FIXED_COMPETENCIES, ...names]);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingRequestsCount = requests.received.filter((r) => r.status === 'pending').length;

  const openSendModal = (prefill?: { recipient_id?: string; request_id?: string }) => {
    setSendForm({
      recipient_id: prefill?.recipient_id || '',
      type_id: types[0]?.id || '',
      message: '',
      competencies: [],
      internal_note: '',
      request_id: prefill?.request_id,
    });
    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!sendForm.recipient_id || !sendForm.type_id || sendForm.message.trim().length < 3) {
      toast.error('Preencha destinatário, tipo e mensagem');
      return;
    }
    setSending(true);
    try {
      await feedbackApiService.create({
        recipient_id: sendForm.recipient_id,
        type_id: sendForm.type_id,
        message: sendForm.message.trim(),
        competencies: sendForm.competencies,
        internal_note: privileged && sendForm.internal_note ? sendForm.internal_note : undefined,
        request_id: sendForm.request_id,
      });
      toast.success('Feedback enviado!');
      setShowSendModal(false);
      if (sendForm.request_id) {
        loadTab('requests');
      } else if (tab === 'sent') {
        loadTab('sent');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar feedback');
    } finally {
      setSending(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.requested_id) {
      toast.error('Escolha para quem pedir o feedback');
      return;
    }
    setRequesting(true);
    try {
      await feedbackApiService.createRequest(
        requestForm.requested_id,
        requestForm.message || undefined,
      );
      toast.success('Solicitação enviada!');
      setShowRequestModal(false);
      setRequestForm({ requested_id: '', message: '' });
      if (tab === 'requests') loadTab('requests');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao solicitar feedback');
    } finally {
      setRequesting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!ackTarget) return;
    setAcking(true);
    try {
      await feedbackApiService.acknowledge(ackTarget.id, ackComment || undefined);
      toast.success('Recebimento confirmado');
      setAckTarget(null);
      setAckComment('');
      loadTab('received', page);
    } catch {
      toast.error('Erro ao confirmar');
    } finally {
      setAcking(false);
    }
  };

  const handleMarkRead = (feedback: Feedback) => {
    if (tab !== 'received' || feedback.read_at) return;
    feedbackApiService.markRead(feedback.id).catch(() => undefined);
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === feedback.id ? { ...f, read_at: new Date().toISOString() } : f)),
    );
  };

  const handleDelete = async (feedback: Feedback) => {
    if (!window.confirm('Excluir este feedback?')) return;
    try {
      await feedbackApiService.remove(feedback.id);
      toast.success('Feedback excluído');
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id));
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível excluir');
    }
  };

  const handleDecline = async (request: FeedbackRequest) => {
    try {
      await feedbackApiService.declineRequest(request.id);
      toast.success('Solicitação recusada');
      loadTab('requests');
    } catch {
      toast.error('Erro ao recusar solicitação');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const pages: Feedback[] = [];
      for (let p = 1; p <= 10; p++) {
        const result = await feedbackApiService.adminList({
          page: p,
          limit: 100,
          type_id: adminTypeFilter || undefined,
        });
        pages.push(...result.data);
        if (p >= result.totalPages) break;
      }
      const rows = pages.map((f) => ({
        Data: formatDateTime(f.created_at),
        Tipo: f.type?.name || '',
        De: f.author?.name || '',
        Para: f.recipient?.name || '',
        Mensagem: f.message,
        Competências: (f.competencies || []).join(', '),
        Lido: f.read_at ? 'Sim' : 'Não',
        Confirmado: f.acknowledged_at ? 'Sim' : 'Não',
        'Comentário do destinatário': f.recipient_comment || '',
        'Observação interna': f.internal_note || '',
      }));
      const ws = XLSX.utils.json_to_sheet(sanitizeSheetData(rows));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Feedbacks');
      XLSX.writeFile(wb, `feedbacks_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${rows.length} feedbacks exportados`);
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const tabs = useMemo(
    () =>
      [
        { id: 'received' as Tab, label: 'Recebidos', icon: Inbox },
        { id: 'sent' as Tab, label: 'Enviados', icon: Send },
        {
          id: 'requests' as Tab,
          label: 'Solicitações',
          icon: HandHelping,
          badge: pendingRequestsCount || undefined,
        },
        ...(privileged ? [{ id: 'admin' as Tab, label: 'Administração', icon: ShieldCheck }] : []),
      ] as Array<{ id: Tab; label: string; icon: any; badge?: number }>,
    [privileged, pendingRequestsCount],
  );

  const toggleCompetency = (name: string) => {
    setSendForm((f) => ({
      ...f,
      competencies: f.competencies.includes(name)
        ? f.competencies.filter((c) => c !== name)
        : f.competencies.length < 10
          ? [...f.competencies, name]
          : f.competencies,
    }));
  };

  const renderFeedbackCard = (feedback: Feedback) => {
    const isReceived = tab === 'received';
    const counterpart = isReceived ? feedback.author : feedback.recipient;
    return (
      <div
        key={feedback.id}
        onClick={() => handleMarkRead(feedback)}
        className={`bg-card border rounded-xl p-4 md:p-5 transition-colors ${
          isReceived && !feedback.read_at
            ? 'border-[#D2FF00]/60 shadow-[0_0_0_1px_rgba(210,255,0,0.2)]'
            : 'border-border'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
              {counterpart?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {isReceived ? counterpart?.name : `Para: ${counterpart?.name}`}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(feedback.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {feedback.type && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeClasses(feedback.type.color)}`}
              >
                {feedback.type.name}
              </span>
            )}
            {feedback.acknowledged_at ? (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <CheckCheck className="h-3.5 w-3.5" /> Confirmado
              </span>
            ) : feedback.read_at ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" /> Lido
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{feedback.message}</p>

        {feedback.competencies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {feedback.competencies.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {feedback.recipient_comment && (
          <div className="mt-3 p-3 rounded-lg bg-secondary text-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Comentário de {feedback.recipient?.name?.split(' ')[0]}
            </p>
            <p className="text-foreground">{feedback.recipient_comment}</p>
          </div>
        )}

        {tab === 'admin' && feedback.internal_note && (
          <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
            <p className="text-xs font-semibold text-warning mb-1">Observação interna</p>
            <p className="text-foreground">{feedback.internal_note}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-3">
          {isReceived && !feedback.acknowledged_at && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAckTarget(feedback);
                setAckComment('');
              }}
              icon={<CheckCheck size={14} />}
            >
              Confirmar recebimento
            </Button>
          )}
          {((tab === 'sent' && !feedback.read_at) || tab === 'admin') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(feedback)}
              icon={<Trash2 size={14} />}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderRequests = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pedidos que você recebeu
        </h3>
        {requests.received.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém pediu feedback seu ainda.</p>
        ) : (
          <div className="space-y-2">
            {requests.received.map((r) => (
              <div
                key={r.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {r.requester?.name}
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      pediu um feedback seu
                    </span>
                  </p>
                  {r.message && <p className="text-xs text-muted-foreground mt-1">"{r.message}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(r.created_at)} ·{' '}
                    {r.status === 'pending'
                      ? 'Pendente'
                      : r.status === 'fulfilled'
                        ? 'Atendida'
                        : 'Recusada'}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        openSendModal({ recipient_id: r.requester_id, request_id: r.id })
                      }
                      icon={<Send size={14} />}
                    >
                      Responder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecline(r)}
                      icon={<X size={14} />}
                    >
                      Recusar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pedidos que você fez
        </h3>
        {requests.sent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não pediu feedback a ninguém.</p>
        ) : (
          <div className="space-y-2">
            {requests.sent.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm font-medium text-foreground">
                  Para {r.requested?.name}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      r.status === 'pending'
                        ? 'bg-warning/15 text-warning'
                        : r.status === 'fulfilled'
                          ? 'bg-success/15 text-success'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {r.status === 'pending'
                      ? 'Pendente'
                      : r.status === 'fulfilled'
                        ? 'Atendida'
                        : 'Recusada'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(r.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 md:p-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center flex-wrap">
              <MessagesSquare className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Feedbacks</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Reconheça, oriente e desenvolva as pessoas no dia a dia
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowRequestModal(true)}
              icon={<HandHelping size={16} />}
            >
              Pedir feedback
            </Button>
            <Button variant="primary" onClick={() => openSendModal()} icon={<Plus size={16} />}>
              Enviar feedback
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-[#D2FF00] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge ? (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-lime text-obsidian font-bold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Filtro admin */}
        {tab === 'admin' && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <select
              value={adminTypeFilter}
              onChange={(e) => setAdminTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
            >
              <option value="">Todos os tipos</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => loadTab('admin')}>
              Filtrar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              icon={
                exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />
              }
            >
              Exportar XLSX
            </Button>
          </div>
        )}
      </div>

      {/* Cards de contagem por tipo (clicáveis = filtro) */}
      {(tab === 'received' || tab === 'sent') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`bg-card border rounded-xl p-4 text-left transition-colors ${
              !typeFilter
                ? 'border-[#D2FF00] ring-1 ring-[#D2FF00]/40'
                : 'border-border hover:border-[#D2FF00]/40'
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Todos</p>
          </button>
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t.id ? null : t.id)}
              className={`bg-card border rounded-xl p-4 text-left transition-colors ${
                typeFilter === t.id
                  ? 'border-[#D2FF00] ring-1 ring-[#D2FF00]/40'
                  : 'border-border hover:border-[#D2FF00]/40'
              }`}
            >
              <p className="text-2xl font-bold text-foreground">{summary.by_type[t.id] || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando...
        </div>
      ) : tab === 'requests' ? (
        renderRequests()
      ) : feedbacks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
          {tab === 'received'
            ? 'Você ainda não recebeu feedbacks.'
            : tab === 'sent'
              ? 'Você ainda não enviou feedbacks.'
              : 'Nenhum feedback registrado.'}
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(renderFeedbackCard)}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadTab(tab, page - 1)}
                  icon={<ChevronLeft size={14} />}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadTab(tab, page + 1)}
                  icon={<ChevronRight size={14} />}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: enviar feedback */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">Enviar feedback</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Para quem?
                </label>
                <select
                  value={sendForm.recipient_id}
                  onChange={(e) => setSendForm((f) => ({ ...f, recipient_id: e.target.value }))}
                  disabled={!!sendForm.request_id}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00] disabled:opacity-60"
                >
                  <option value="">Selecione...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.position ? ` — ${u.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSendForm((f) => ({ ...f, type_id: t.id }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        sendForm.type_id === t.id
                          ? `${typeBadgeClasses(t.color)} border-transparent ring-2 ring-[#D2FF00]/40`
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Mensagem
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  maxLength={5000}
                  placeholder="Seja específico: o que a pessoa fez, qual foi o impacto e o que manter ou ajustar."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Competências relacionadas <span className="text-xs">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {competencyOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCompetency(c)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        sendForm.competencies.includes(c)
                          ? 'bg-lime/20 text-lime-deep dark:text-lime border-transparent'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {privileged && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Observação interna <span className="text-xs">(visível só ao RH/diretoria)</span>
                  </label>
                  <textarea
                    value={sendForm.internal_note}
                    onChange={(e) => setSendForm((f) => ({ ...f, internal_note: e.target.value }))}
                    rows={2}
                    maxLength={2000}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSendModal(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={sending}
                icon={sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: pedir feedback */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Pedir feedback</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Para quem pedir?
                </label>
                <select
                  value={requestForm.requested_id}
                  onChange={(e) => setRequestForm((f) => ({ ...f, requested_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                >
                  <option value="">Selecione...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.position ? ` — ${u.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Contexto <span className="text-xs">(opcional)</span>
                </label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                  placeholder="Ex.: gostaria de um feedback sobre minha condução do último projeto."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRequestModal(false)}
                disabled={requesting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateRequest}
                disabled={requesting}
                icon={
                  requesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HandHelping size={16} />
                  )
                }
              >
                Pedir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar recebimento */}
      {ackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">Confirmar recebimento</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Você confirma que leu e compreendeu o feedback de {ackTarget.author?.name}?
            </p>
            <textarea
              value={ackComment}
              onChange={(e) => setAckComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Comentário (opcional)"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAckTarget(null)} disabled={acking}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAcknowledge}
                disabled={acking}
                icon={
                  acking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck size={16} />
                }
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Feedbacks;
