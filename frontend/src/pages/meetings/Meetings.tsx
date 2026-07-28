import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CalendarClock,
  Plus,
  Loader2,
  Video,
  MapPin,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Trash2,
  ListChecks,
  StickyNote,
  ClipboardList,
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { meetingApiService, Meeting, MeetingType } from '../../services/meeting.service';
import { userService } from '../../services/user.service';

type Tab = 'upcoming' | 'past';

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Única',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Meetings = () => {
  const { profile } = useAuth();
  const myId = profile?.id;

  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; position?: string | null }>>(
    [],
  );

  // Detalhe expandido
  const [expanded, setExpanded] = useState<Meeting | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notePrivate, setNotePrivate] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', assignee_id: '', due_date: '' });

  // Modal de criação
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type_id: '',
    title: '',
    date: '',
    time: '',
    duration_minutes: 30,
    location: '',
    meeting_url: '',
    participant_ids: [] as string[],
    recurrence: 'none',
    topics: '' as string,
  });

  const load = useCallback(async (targetTab: Tab) => {
    setLoading(true);
    try {
      setMeetings(await meetingApiService.list(targetTab));
    } catch {
      toast.error('Erro ao carregar reuniões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
    setExpanded(null);
  }, [tab, load]);

  useEffect(() => {
    meetingApiService
      .listTypes()
      .then((list) => {
        setTypes(list);
        setForm((f) => ({ ...f, type_id: list[0]?.id || '' }));
      })
      .catch(() => undefined);
    userService
      .getUsers({ active: true })
      .then((list: any[]) =>
        setUsers(
          list
            .filter((u) => u.id !== myId)
            .map((u) => ({ id: u.id, name: u.name, position: u.position })),
        ),
      )
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Relação do usuário com a reunião, para o badge do card. */
  const relationBadge = (meeting: Meeting): string | null => {
    if (!myId) return null;
    if (meeting.organizer_id === myId) {
      const anySubordinate = meeting.participants.some((p) => p.user?.reports_to === myId);
      return anySubordinate ? 'Com liderado' : 'Organizada por mim';
    }
    if (meeting.organizer?.id && profile?.reports_to === meeting.organizer.id) {
      return 'Com minha liderança';
    }
    return null;
  };

  const openDetail = async (meeting: Meeting) => {
    if (expanded?.id === meeting.id) {
      setExpanded(null);
      return;
    }
    setDetailLoading(true);
    setExpanded(meeting);
    try {
      setExpanded(await meetingApiService.getById(meeting.id));
    } catch {
      toast.error('Erro ao carregar detalhes');
      setExpanded(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async (id: string) => {
    try {
      setExpanded(await meetingApiService.getById(id));
    } catch {
      /* mantém estado atual */
    }
  };

  const handleCreate = async () => {
    if (!form.type_id || !form.date || !form.time || form.participant_ids.length === 0) {
      toast.error('Preencha tipo, data, horário e participantes');
      return;
    }
    setSaving(true);
    try {
      await meetingApiService.create({
        type_id: form.type_id,
        title: form.title || undefined,
        scheduled_at: new Date(`${form.date}T${form.time}:00`).toISOString(),
        duration_minutes: form.duration_minutes,
        location: form.location || undefined,
        meeting_url: form.meeting_url || undefined,
        participant_ids: form.participant_ids,
        recurrence: form.recurrence,
        topics: form.topics
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success('Reunião agendada!');
      setShowModal(false);
      setForm((f) => ({
        ...f,
        title: '',
        date: '',
        time: '',
        location: '',
        meeting_url: '',
        participant_ids: [],
        recurrence: 'none',
        topics: '',
      }));
      if (tab === 'upcoming') load('upcoming');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao agendar');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (meeting: Meeting, status: 'completed' | 'cancelled') => {
    const label = status === 'completed' ? 'concluir' : 'cancelar';
    if (!window.confirm(`Deseja ${label} esta reunião?`)) return;
    try {
      await meetingApiService.setStatus(meeting.id, status);
      toast.success(
        status === 'completed'
          ? meeting.recurrence !== 'none'
            ? 'Reunião concluída — próxima ocorrência criada'
            : 'Reunião concluída'
          : 'Reunião cancelada',
      );
      setExpanded(null);
      load(tab);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar');
    }
  };

  const toggleParticipant = (id: string) => {
    setForm((f) => ({
      ...f,
      participant_ids: f.participant_ids.includes(id)
        ? f.participant_ids.filter((p) => p !== id)
        : [...f.participant_ids, id],
    }));
  };

  const renderDetail = (meeting: Meeting) => (
    <div className="border-t border-border mt-4 pt-4 space-y-5">
      {detailLoading ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <>
          {/* Pauta */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Pauta
            </h4>
            <div className="space-y-1.5">
              {(meeting.topics || []).map((topic) => (
                <label key={topic.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={topic.covered}
                    onChange={async (e) => {
                      await meetingApiService
                        .setTopicCovered(meeting.id, topic.id, e.target.checked)
                        .catch(() => undefined);
                      refreshDetail(meeting.id);
                    }}
                    className="rounded border-border accent-[#D2FF00]"
                  />
                  <span
                    className={
                      topic.covered ? 'line-through text-muted-foreground' : 'text-foreground'
                    }
                  >
                    {topic.text}
                  </span>
                </label>
              ))}
              {meeting.status === 'scheduled' && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Novo tópico de pauta..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newTopic.trim()) {
                        await meetingApiService
                          .addTopic(meeting.id, newTopic.trim())
                          .catch(() => toast.error('Erro ao adicionar'));
                        setNewTopic('');
                        refreshDetail(meeting.id);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Anotações */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5" /> Anotações
            </h4>
            <div className="space-y-2">
              {(meeting.notes || []).map((note) => (
                <div key={note.id} className="bg-secondary rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {note.is_private && <Lock className="h-3 w-3" />}
                      {note.author?.name} · {formatDateTime(note.created_at)}
                      {note.is_private && ' · privada'}
                    </p>
                    {note.author_id === myId && (
                      <button
                        onClick={async () => {
                          await meetingApiService
                            .deleteNote(meeting.id, note.id)
                            .catch(() => undefined);
                          refreshDetail(meeting.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  placeholder="Nova anotação..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notePrivate}
                      onChange={(e) => setNotePrivate(e.target.checked)}
                      className="rounded border-border accent-[#D2FF00]"
                    />
                    <Lock className="h-3 w-3" /> Privada (só você vê)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newNote.trim()}
                    onClick={async () => {
                      await meetingApiService
                        .addNote(meeting.id, newNote.trim(), notePrivate)
                        .catch(() => toast.error('Erro ao salvar anotação'));
                      setNewNote('');
                      setNotePrivate(false);
                      refreshDetail(meeting.id);
                    }}
                  >
                    Salvar anotação
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Tarefas
            </h4>
            <div className="space-y-1.5">
              {(meeting.tasks || []).map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!task.done_at}
                    onChange={async (e) => {
                      await meetingApiService
                        .setTaskDone(meeting.id, task.id, e.target.checked)
                        .catch(() => undefined);
                      refreshDetail(meeting.id);
                    }}
                    className="rounded border-border accent-[#D2FF00]"
                  />
                  <span
                    className={
                      task.done_at ? 'line-through text-muted-foreground' : 'text-foreground'
                    }
                  >
                    {task.description}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {task.assignee?.name?.split(' ')[0]}
                    {task.due_date
                      ? ` · ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString('pt-BR')}`
                      : ''}
                  </span>
                </label>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mt-2">
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                  placeholder="Nova tarefa..."
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
                />
                <select
                  value={newTask.assignee_id}
                  onChange={(e) => setNewTask((t) => ({ ...t, assignee_id: e.target.value }))}
                  className="px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                >
                  <option value="">Responsável...</option>
                  {[{ id: myId || '', name: 'Eu' }, ...users].map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask((t) => ({ ...t, due_date: e.target.value }))}
                  className="px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!newTask.description.trim()}
                  onClick={async () => {
                    await meetingApiService
                      .addTask(meeting.id, {
                        description: newTask.description.trim(),
                        assignee_id: newTask.assignee_id || undefined,
                        due_date: newTask.due_date || undefined,
                      })
                      .catch(() => toast.error('Erro ao criar tarefa'));
                    setNewTask({ description: '', assignee_id: '', due_date: '' });
                    refreshDetail(meeting.id);
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Ações */}
          {meeting.status === 'scheduled' && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatus(meeting, 'cancelled')}
                icon={<X size={14} />}
              >
                Cancelar reunião
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatus(meeting, 'completed')}
                icon={<Check size={14} />}
              >
                Concluir
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 md:p-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center flex-wrap">
              <CalendarClock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Reuniões</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              1:1s, alinhamentos e devolutivas — com pauta, anotações e tarefas
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)} icon={<Plus size={16} />}>
            Agendar reunião
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-border">
          {(
            [
              { id: 'upcoming', label: 'Próximas' },
              { id: 'past', label: 'Anteriores' },
            ] as Array<{ id: Tab; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-[#D2FF00] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
          {tab === 'upcoming' ? 'Nenhuma reunião agendada.' : 'Nenhuma reunião anterior.'}
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const badge = relationBadge(meeting);
            const others =
              meeting.organizer_id === myId
                ? meeting.participants.map((p) => p.user?.name).filter(Boolean)
                : [
                    meeting.organizer?.name,
                    ...meeting.participants
                      .filter((p) => p.user_id !== myId)
                      .map((p) => p.user?.name),
                  ].filter(Boolean);
            const isExpanded = expanded?.id === meeting.id;
            return (
              <div key={meeting.id} className="bg-card border border-border rounded-xl p-4 md:p-5">
                <button
                  type="button"
                  onClick={() => openDetail(meeting)}
                  className="w-full text-left"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {meeting.type?.name}
                        {meeting.title ? ` — ${meeting.title}` : ''}
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          com {(others as string[]).join(', ')}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span>{formatDateTime(meeting.scheduled_at)}</span>
                        <span>{meeting.duration_minutes} min</span>
                        {meeting.recurrence !== 'none' && (
                          <span className="inline-flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" />
                            {RECURRENCE_LABELS[meeting.recurrence]}
                          </span>
                        )}
                        {meeting.meeting_url && (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-3 w-3" /> Online
                          </span>
                        )}
                        {meeting.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {meeting.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime/20 text-lime-deep dark:text-lime">
                          {badge}
                        </span>
                      )}
                      {meeting.status !== 'scheduled' && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            meeting.status === 'completed'
                              ? 'bg-success/15 text-success'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {meeting.status === 'completed' ? 'Concluída' : 'Cancelada'}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>
                {isExpanded && renderDetail(expanded!)}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de agendamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">Agendar reunião</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Tipo
                  </label>
                  <select
                    value={form.type_id}
                    onChange={(e) => setForm((f) => ({ ...f, type_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Recorrência
                  </label>
                  <select
                    value={form.recurrence}
                    onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                  >
                    {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Título <span className="text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Duração
                  </label>
                  <select
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                  >
                    {[15, 30, 45, 60, 90, 120].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Link da chamada <span className="text-xs">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.meeting_url}
                    onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))}
                    placeholder="Meet, Teams, Zoom..."
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Local <span className="text-xs">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Sala, endereço..."
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Participantes
                </label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={form.participant_ids.includes(u.id)}
                        onChange={() => toggleParticipant(u.id)}
                        className="rounded border-border accent-[#D2FF00]"
                      />
                      <span className="text-foreground">{u.name}</span>
                      {u.position && (
                        <span className="text-xs text-muted-foreground">— {u.position}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Pauta inicial <span className="text-xs">(um tópico por linha, opcional)</span>
                </label>
                <textarea
                  value={form.topics}
                  onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={saving}
                icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              >
                Agendar
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Meetings;
