import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Save,
  UserCheck,
  UserMinus,
  CheckCircle,
  MessageSquare,
  Video,
  Link2,
  ClipboardList,
  Clock,
} from 'lucide-react';
import {
  interviewService,
  Interview,
  InterviewType,
  INTERVIEW_TYPE_LABELS,
  NinetyDaysAnswers,
  ExitAnswers,
} from '../../services/interview.service';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../context/AuthContext';

type FormMode = 'create' | 'edit';

const ratingLabels: Record<number, string> = {
  1: 'Muito Insatisfeito',
  2: 'Insatisfeito',
  3: 'Neutro',
  4: 'Satisfeito',
  5: 'Muito Satisfeito',
};

const RatingInput = ({
  label,
  value,
  onChange,
  commentValue,
  onCommentChange,
  commentPlaceholder,
}: {
  label: string;
  value: number | null;
  onChange: (val: number) => void;
  commentValue: string;
  onCommentChange: (val: string) => void;
  commentPlaceholder?: string;
}) => (
  <div className="space-y-3 p-4 bg-secondary rounded-xl border border-border">
    <label className="block text-sm font-semibold text-foreground">{label}</label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all text-sm font-bold ${
            value === rating
              ? 'border-[#D2FF00] bg-lime text-obsidian shadow-md'
              : 'border-border text-muted-foreground hover:border-[#D2FF00]/50'
          }`}
          title={ratingLabels[rating]}
        >
          {rating}
        </button>
      ))}
      {value && <span className="ml-2 text-xs text-muted-foreground">{ratingLabels[value]}</span>}
    </div>
    <textarea
      value={commentValue}
      onChange={(e) => onCommentChange(e.target.value)}
      placeholder={commentPlaceholder || 'Comentários...'}
      rows={2}
      className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
    />
  </div>
);

const InterviewForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const { users } = useSupabaseData();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);

  // Create form
  const [type, setType] = useState<InterviewType>('ninety_days');
  const [employeeId, setEmployeeId] = useState('');
  const [interviewerId, setInterviewerId] = useState(profile?.id || '');
  const [scheduledDate, setScheduledDate] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [observations, setObservations] = useState('');

  // 90 days answers
  const [ninetyDaysAnswers, setNinetyDaysAnswers] = useState<NinetyDaysAnswers>({
    adaptation_rating: null,
    adaptation_comments: '',
    team_integration_rating: null,
    team_integration_comments: '',
    role_clarity_rating: null,
    role_clarity_comments: '',
    leadership_support_rating: null,
    leadership_support_comments: '',
    tools_and_resources_rating: null,
    tools_and_resources_comments: '',
    expectations_met: null,
    expectations_comments: '',
    challenges: '',
    suggestions: '',
    overall_satisfaction_rating: null,
    recommend_company: null,
    additional_comments: '',
  });

  // Exit answers
  const [exitAnswers, setExitAnswers] = useState<ExitAnswers>({
    departure_reason: '',
    departure_reason_details: '',
    work_environment_rating: null,
    work_environment_comments: '',
    leadership_rating: null,
    leadership_comments: '',
    growth_opportunities_rating: null,
    growth_opportunities_comments: '',
    compensation_rating: null,
    compensation_comments: '',
    workload_rating: null,
    workload_comments: '',
    what_liked_most: '',
    what_could_improve: '',
    would_return: null,
    would_recommend: null,
    destination: '',
    additional_comments: '',
  });

  useEffect(() => {
    if (id) {
      loadInterview();
    }
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getInterviewById(id!);
      setInterview(data);
      setType(data.type);
      setEmployeeId(data.employee_id);
      setInterviewerId(data.interviewer_id);
      setScheduledDate(data.scheduled_date || '');
      setMeetingUrl(data.meeting_url || '');
      setObservations(data.observations || '');

      if (data.answers) {
        if (data.type === 'ninety_days') {
          setNinetyDaysAnswers(data.answers as NinetyDaysAnswers);
        } else {
          setExitAnswers(data.answers as ExitAnswers);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar entrevista');
      navigate('/interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!employeeId || !interviewerId) {
      toast.error('Selecione o colaborador e o entrevistador');
      return;
    }

    try {
      setSaving(true);
      const data = await interviewService.createInterview({
        type,
        employee_id: employeeId,
        interviewer_id: interviewerId,
        scheduled_date: scheduledDate || undefined,
        meeting_url: meetingUrl.trim() || undefined,
      });
      toast.success('Entrevista criada! Copie o link e envie ao colaborador.');
      navigate(`/interviews/${data.id}`);
    } catch (error) {
      toast.error('Erro ao criar entrevista');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnswers = async () => {
    if (!id) return;

    try {
      setSaving(true);
      if (type === 'ninety_days') {
        await interviewService.saveNinetyDaysAnswers(id, ninetyDaysAnswers);
      } else {
        await interviewService.saveExitAnswers(id, exitAnswers);
      }
      toast.success('Respostas salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar respostas');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      setSaving(true);
      // Salvar respostas primeiro
      if (type === 'ninety_days') {
        await interviewService.saveNinetyDaysAnswers(id, ninetyDaysAnswers);
      } else {
        await interviewService.saveExitAnswers(id, exitAnswers);
      }
      // Marcar como concluída
      await interviewService.updateInterview(id, { status: 'completed' } as any);
      toast.success('Entrevista concluída com sucesso!');
      navigate('/interviews');
    } catch (error) {
      toast.error('Erro ao concluir entrevista');
    } finally {
      setSaving(false);
    }
  };

  // Entrevistas novas carregam um snapshot de perguntas (modelo personalizável);
  // as antigas usam os formulários fixos legados de 90 dias/desligamento.
  const hasGenericQuestions = (interview?.questions?.length || 0) > 0;
  const answersByQuestion = new Map(
    (interview?.question_answers || []).map((a) => [a.question_id, a]),
  );

  const copyExternalLink = () => {
    if (!interview?.public_token) return;
    const url = `${window.location.origin}/i/${interview.public_token}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success('Link copiado! Envie ao colaborador.'),
        () => toast.error('Não foi possível copiar o link'),
      );
    } else {
      toast(url, { duration: 8000 });
    }
  };

  const handleSaveDetails = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await interviewService.updateInterview(id, {
        observations,
        meeting_url: meetingUrl.trim() || null,
      } as any);
      toast.success('Dados salvos');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteGeneric = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await interviewService.updateInterview(id, {
        status: 'completed',
        observations,
        meeting_url: meetingUrl.trim() || null,
      } as any);
      toast.success('Entrevista concluída!');
      navigate('/interviews');
    } catch {
      toast.error('Erro ao concluir entrevista');
    } finally {
      setSaving(false);
    }
  };

  const activeUsers = users.filter((u) => u.active !== false && !u.is_admin);
  const leadersAndDirectors = users.filter(
    (u) => (u.is_leader || u.is_director) && u.active !== false,
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
                {isEditing ? (
                  <>
                    <ClipboardList className="h-6 w-6 text-lime-deep dark:text-lime mr-2" />
                    Entrevista de {INTERVIEW_TYPE_LABELS[type] || type}
                  </>
                ) : (
                  'Nova Entrevista'
                )}
              </h1>
              {interview?.employee && (
                <p className="text-sm text-muted-foreground mt-1">
                  {interview.employee.name} - {interview.employee.position}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Form */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Dados da Entrevista</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Tipo de Entrevista
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: 'onboarding', icon: UserCheck },
                    { key: 'sixty_days', icon: Clock },
                    { key: 'ninety_days', icon: CheckCircle },
                    { key: 'exit', icon: UserMinus },
                  ] as { key: InterviewType; icon: typeof UserCheck }[]
                ).map(({ key, icon: TypeIcon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      type === key
                        ? 'border-[#D2FF00] bg-lime/20 text-lime-deep dark:text-lime'
                        : 'border-border text-muted-foreground hover:border-[#D2FF00]/50'
                    }`}
                  >
                    <TypeIcon className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{INTERVIEW_TYPE_LABELS[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Data Agendada
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Colaborador
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
              >
                <option value="">Selecione o colaborador</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Entrevistador
              </label>
              <select
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
              >
                <option value="">Selecione o entrevistador</option>
                {leadersAndDirectors.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Link da reunião (Teams, Google Meet...)
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://teams.microsoft.com/... ou https://meet.google.com/..."
                  className="w-full pl-10 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={saving}
              icon={<Save size={18} />}
              size="lg"
            >
              {saving ? 'Criando...' : 'Criar Entrevista'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Entrevista nova (modelo personalizável): link externo, reunião e respostas */}
      {isEditing && hasGenericQuestions && interview && (
        <>
          {/* Link externo + reunião */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Link2 className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
              Link do colaborador
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Envie este link ao colaborador para ele responder as perguntas — não precisa de login.
              Cada entrevista tem um link único.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={<Link2 size={16} />} onClick={copyExternalLink}>
                Copiar link de resposta
              </Button>
              {interview.meeting_url && (
                <a
                  href={interview.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground hover:border-[#D2FF00] transition-colors"
                >
                  <Video className="h-4 w-4" /> Entrar na reunião
                </a>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Link da reunião (Teams, Google Meet...)
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://teams.microsoft.com/... ou https://meet.google.com/..."
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
              />
            </div>
          </motion.div>

          {/* Respostas do colaborador */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
              Respostas do colaborador
            </h2>
            {(interview.question_answers?.length || 0) === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Aguardando respostas do colaborador</p>
                <p className="text-xs mt-1">Envie o link de resposta acima</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(interview.questions || []).map((q, index) => {
                  const answer = answersByQuestion.get(q.id);
                  return (
                    <div key={q.id} className="p-4 bg-secondary rounded-xl border border-border">
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {index + 1}. {q.question_text}
                      </p>
                      {q.question_type === 'rating' && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                            answer?.rating_value != null
                              ? 'bg-lime/20 text-lime-deep dark:text-lime'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {answer?.rating_value != null
                            ? `${answer.rating_value} / ${q.rating_scale === 10 ? 10 : 5}`
                            : 'Sem resposta'}
                        </span>
                      )}
                      {q.question_type === 'yes_no' && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                            answer?.boolean_value === true
                              ? 'bg-success/15 text-success'
                              : answer?.boolean_value === false
                                ? 'bg-destructive/15 text-destructive'
                                : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {answer?.boolean_value === true
                            ? 'Sim'
                            : answer?.boolean_value === false
                              ? 'Não'
                              : 'Sem resposta'}
                        </span>
                      )}
                      {q.question_type === 'text' && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {answer?.text_value?.trim() || 'Sem resposta'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Observações + concluir */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Observações do entrevistador
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Anotações da conversa, pontos de atenção..."
              rows={4}
              className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-y"
            />
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => navigate('/interviews')}>
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSaveDetails}
                  disabled={saving}
                  icon={<Save size={18} />}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
                {interview.status !== 'completed' && (
                  <Button
                    variant="primary"
                    onClick={handleCompleteGeneric}
                    disabled={saving}
                    icon={<CheckCircle size={18} />}
                  >
                    Concluir Entrevista
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Edit Form - 90 Days (legado, entrevistas antigas sem snapshot) */}
      {isEditing && !hasGenericQuestions && type === 'ninety_days' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-lime-deep dark:text-lime" />
            Questionário - 90 Dias
          </h2>

          <div className="space-y-4">
            <RatingInput
              label="Adaptação à empresa"
              value={ninetyDaysAnswers.adaptation_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, adaptation_rating: val }))
              }
              commentValue={ninetyDaysAnswers.adaptation_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, adaptation_comments: val }))
              }
              commentPlaceholder="Como foi sua adaptação à cultura e rotina da empresa?"
            />

            <RatingInput
              label="Integração com a equipe"
              value={ninetyDaysAnswers.team_integration_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, team_integration_rating: val }))
              }
              commentValue={ninetyDaysAnswers.team_integration_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, team_integration_comments: val }))
              }
              commentPlaceholder="Como está a integração com os colegas de equipe?"
            />

            <RatingInput
              label="Clareza do cargo e responsabilidades"
              value={ninetyDaysAnswers.role_clarity_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, role_clarity_rating: val }))
              }
              commentValue={ninetyDaysAnswers.role_clarity_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, role_clarity_comments: val }))
              }
              commentPlaceholder="As responsabilidades do cargo estão claras?"
            />

            <RatingInput
              label="Suporte da liderança"
              value={ninetyDaysAnswers.leadership_support_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, leadership_support_rating: val }))
              }
              commentValue={ninetyDaysAnswers.leadership_support_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, leadership_support_comments: val }))
              }
              commentPlaceholder="Como avalia o suporte recebido da liderança?"
            />

            <RatingInput
              label="Ferramentas e recursos"
              value={ninetyDaysAnswers.tools_and_resources_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, tools_and_resources_rating: val }))
              }
              commentValue={ninetyDaysAnswers.tools_and_resources_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, tools_and_resources_comments: val }))
              }
              commentPlaceholder="Tem acesso às ferramentas necessárias para o trabalho?"
            />

            {/* Expectativas */}
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-3">
                As expectativas em relação à empresa foram atendidas?
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setNinetyDaysAnswers((prev) => ({ ...prev, expectations_met: true }))
                  }
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.expectations_met === true
                      ? 'border-success bg-success/15 text-success'
                      : 'border-border text-muted-foreground hover:border-success/50'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNinetyDaysAnswers((prev) => ({ ...prev, expectations_met: false }))
                  }
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.expectations_met === false
                      ? 'border-destructive bg-destructive/15 text-destructive'
                      : 'border-border text-muted-foreground hover:border-destructive/50'
                  }`}
                >
                  Não
                </button>
              </div>
              <textarea
                value={ninetyDaysAnswers.expectations_comments}
                onChange={(e) =>
                  setNinetyDaysAnswers((prev) => ({
                    ...prev,
                    expectations_comments: e.target.value,
                  }))
                }
                placeholder="Comente sobre suas expectativas..."
                rows={2}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            {/* Campos de texto */}
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Principais desafios
              </label>
              <textarea
                value={ninetyDaysAnswers.challenges}
                onChange={(e) =>
                  setNinetyDaysAnswers((prev) => ({ ...prev, challenges: e.target.value }))
                }
                placeholder="Quais foram os principais desafios até agora?"
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Sugestões de melhoria
              </label>
              <textarea
                value={ninetyDaysAnswers.suggestions}
                onChange={(e) =>
                  setNinetyDaysAnswers((prev) => ({ ...prev, suggestions: e.target.value }))
                }
                placeholder="O que poderia ser melhorado?"
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <RatingInput
              label="Satisfação geral"
              value={ninetyDaysAnswers.overall_satisfaction_rating}
              onChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, overall_satisfaction_rating: val }))
              }
              commentValue={ninetyDaysAnswers.additional_comments}
              onCommentChange={(val) =>
                setNinetyDaysAnswers((prev) => ({ ...prev, additional_comments: val }))
              }
              commentPlaceholder="Comentários adicionais..."
            />

            {/* Recomendaria */}
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Recomendaria a empresa para amigos/conhecidos?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setNinetyDaysAnswers((prev) => ({ ...prev, recommend_company: true }))
                  }
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.recommend_company === true
                      ? 'border-success bg-success/15 text-success'
                      : 'border-border text-muted-foreground hover:border-success/50'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNinetyDaysAnswers((prev) => ({ ...prev, recommend_company: false }))
                  }
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.recommend_company === false
                      ? 'border-destructive bg-destructive/15 text-destructive'
                      : 'border-border text-muted-foreground hover:border-destructive/50'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSaveAnswers}
                disabled={saving}
                icon={<Save size={18} />}
              >
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={saving}
                icon={<CheckCircle size={18} />}
              >
                Concluir Entrevista
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Form - Exit (legado, entrevistas antigas sem snapshot) */}
      {isEditing && !hasGenericQuestions && type === 'exit' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
            Questionário - Desligamento
          </h2>

          <div className="space-y-4">
            {/* Motivo da saída */}
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Principal motivo da saída
              </label>
              <select
                value={exitAnswers.departure_reason}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, departure_reason: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm mb-3"
              >
                <option value="">Selecione o motivo</option>
                <option value="new_opportunity">Nova oportunidade profissional</option>
                <option value="compensation">Remuneração / benefícios</option>
                <option value="career_growth">Crescimento profissional limitado</option>
                <option value="leadership">Relação com liderança</option>
                <option value="work_environment">Ambiente de trabalho</option>
                <option value="personal">Motivos pessoais</option>
                <option value="relocation">Mudança de cidade / país</option>
                <option value="health">Saúde</option>
                <option value="termination">Desligamento pela empresa</option>
                <option value="other">Outro</option>
              </select>
              <textarea
                value={exitAnswers.departure_reason_details}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, departure_reason_details: e.target.value }))
                }
                placeholder="Detalhe o motivo..."
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <RatingInput
              label="Ambiente de trabalho"
              value={exitAnswers.work_environment_rating}
              onChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, work_environment_rating: val }))
              }
              commentValue={exitAnswers.work_environment_comments}
              onCommentChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, work_environment_comments: val }))
              }
              commentPlaceholder="Como avalia o ambiente de trabalho?"
            />

            <RatingInput
              label="Liderança"
              value={exitAnswers.leadership_rating}
              onChange={(val) => setExitAnswers((prev) => ({ ...prev, leadership_rating: val }))}
              commentValue={exitAnswers.leadership_comments}
              onCommentChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, leadership_comments: val }))
              }
              commentPlaceholder="Como avalia a liderança direta?"
            />

            <RatingInput
              label="Oportunidades de crescimento"
              value={exitAnswers.growth_opportunities_rating}
              onChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, growth_opportunities_rating: val }))
              }
              commentValue={exitAnswers.growth_opportunities_comments}
              onCommentChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, growth_opportunities_comments: val }))
              }
              commentPlaceholder="Como avalia as oportunidades de crescimento?"
            />

            <RatingInput
              label="Remuneração e benefícios"
              value={exitAnswers.compensation_rating}
              onChange={(val) => setExitAnswers((prev) => ({ ...prev, compensation_rating: val }))}
              commentValue={exitAnswers.compensation_comments}
              onCommentChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, compensation_comments: val }))
              }
              commentPlaceholder="Como avalia a remuneração e os benefícios?"
            />

            <RatingInput
              label="Carga de trabalho"
              value={exitAnswers.workload_rating}
              onChange={(val) => setExitAnswers((prev) => ({ ...prev, workload_rating: val }))}
              commentValue={exitAnswers.workload_comments}
              onCommentChange={(val) =>
                setExitAnswers((prev) => ({ ...prev, workload_comments: val }))
              }
              commentPlaceholder="Como avalia a carga de trabalho?"
            />

            {/* Campos de texto */}
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                O que mais gostou na empresa?
              </label>
              <textarea
                value={exitAnswers.what_liked_most}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, what_liked_most: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                O que poderia ser melhorado?
              </label>
              <textarea
                value={exitAnswers.what_could_improve}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, what_could_improve: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            {/* Voltaria / Recomendaria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Voltaria a trabalhar na empresa?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExitAnswers((prev) => ({ ...prev, would_return: true }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_return === true
                        ? 'border-success bg-success/15 text-success'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitAnswers((prev) => ({ ...prev, would_return: false }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_return === false
                        ? 'border-destructive bg-destructive/15 text-destructive'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-xl border border-border">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Recomendaria a empresa?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExitAnswers((prev) => ({ ...prev, would_recommend: true }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_recommend === true
                        ? 'border-success bg-success/15 text-success'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitAnswers((prev) => ({ ...prev, would_recommend: false }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_recommend === false
                        ? 'border-destructive bg-destructive/15 text-destructive'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Destino (próximo emprego/planos)
              </label>
              <input
                type="text"
                value={exitAnswers.destination}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, destination: e.target.value }))
                }
                placeholder="Opcional"
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
              />
            </div>

            <div className="p-4 bg-secondary rounded-xl border border-border">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Comentários adicionais
              </label>
              <textarea
                value={exitAnswers.additional_comments}
                onChange={(e) =>
                  setExitAnswers((prev) => ({ ...prev, additional_comments: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSaveAnswers}
                disabled={saving}
                icon={<Save size={18} />}
              >
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={saving}
                icon={<CheckCircle size={18} />}
              >
                Concluir Entrevista
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewForm;
