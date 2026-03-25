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
  Star,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { interviewService, Interview, NinetyDaysAnswers, ExitAnswers } from '../../services/interview.service';
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
  <div className="space-y-3 p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map(rating => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all text-sm font-bold ${
            value === rating
              ? 'border-primary-500 bg-primary-500 text-white shadow-md'
              : 'border-gray-200 dark:border-yt-border text-gray-500 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600'
          }`}
          title={ratingLabels[rating]}
        >
          {rating}
        </button>
      ))}
      {value && (
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{ratingLabels[value]}</span>
      )}
    </div>
    <textarea
      value={commentValue}
      onChange={(e) => onCommentChange(e.target.value)}
      placeholder={commentPlaceholder || 'Comentários...'}
      rows={2}
      className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
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
  const [type, setType] = useState<'ninety_days' | 'exit'>('ninety_days');
  const [employeeId, setEmployeeId] = useState('');
  const [interviewerId, setInterviewerId] = useState(profile?.id || '');
  const [scheduledDate, setScheduledDate] = useState('');

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
      });
      toast.success('Entrevista criada com sucesso!');
      navigate(`/interviews/${data.id}/edit`);
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

  const activeUsers = users.filter(u => u.active !== false && !u.is_admin);
  const leadersAndDirectors = users.filter(u => (u.is_leader || u.is_director) && u.active !== false);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                {isEditing ? (
                  type === 'ninety_days' ? (
                    <><UserCheck className="h-6 w-6 text-primary-700 dark:text-primary-400 mr-2" /> Entrevista de 90 Dias</>
                  ) : (
                    <><UserMinus className="h-6 w-6 text-stone-700 dark:text-stone-400 mr-2" /> Entrevista de Desligamento</>
                  )
                ) : (
                  'Nova Entrevista'
                )}
              </h1>
              {interview?.employee && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
          className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">Dados da Entrevista</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Entrevista
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('ninety_days')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                    type === 'ninety_days'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-primary-300'
                  }`}
                >
                  <UserCheck className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">90 Dias</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('exit')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                    type === 'exit'
                      ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-stone-300'
                  }`}
                >
                  <UserMinus className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Desligamento</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Data Agendada
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Colaborador
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3"
              >
                <option value="">Selecione o colaborador</option>
                {activeUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} - {user.position}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Entrevistador
              </label>
              <select
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3"
              >
                <option value="">Selecione o entrevistador</option>
                {leadersAndDirectors.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
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

      {/* Edit Form - 90 Days */}
      {isEditing && type === 'ninety_days' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary-700 dark:text-primary-400" />
            Questionário - 90 Dias
          </h2>

          <div className="space-y-4">
            <RatingInput
              label="Adaptação à empresa"
              value={ninetyDaysAnswers.adaptation_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, adaptation_rating: val }))}
              commentValue={ninetyDaysAnswers.adaptation_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, adaptation_comments: val }))}
              commentPlaceholder="Como foi sua adaptação à cultura e rotina da empresa?"
            />

            <RatingInput
              label="Integração com a equipe"
              value={ninetyDaysAnswers.team_integration_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, team_integration_rating: val }))}
              commentValue={ninetyDaysAnswers.team_integration_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, team_integration_comments: val }))}
              commentPlaceholder="Como está a integração com os colegas de equipe?"
            />

            <RatingInput
              label="Clareza do cargo e responsabilidades"
              value={ninetyDaysAnswers.role_clarity_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, role_clarity_rating: val }))}
              commentValue={ninetyDaysAnswers.role_clarity_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, role_clarity_comments: val }))}
              commentPlaceholder="As responsabilidades do cargo estão claras?"
            />

            <RatingInput
              label="Suporte da liderança"
              value={ninetyDaysAnswers.leadership_support_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, leadership_support_rating: val }))}
              commentValue={ninetyDaysAnswers.leadership_support_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, leadership_support_comments: val }))}
              commentPlaceholder="Como avalia o suporte recebido da liderança?"
            />

            <RatingInput
              label="Ferramentas e recursos"
              value={ninetyDaysAnswers.tools_and_resources_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, tools_and_resources_rating: val }))}
              commentValue={ninetyDaysAnswers.tools_and_resources_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, tools_and_resources_comments: val }))}
              commentPlaceholder="Tem acesso às ferramentas necessárias para o trabalho?"
            />

            {/* Expectativas */}
            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                As expectativas em relação à empresa foram atendidas?
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setNinetyDaysAnswers(prev => ({ ...prev, expectations_met: true }))}
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.expectations_met === true
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-green-300'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setNinetyDaysAnswers(prev => ({ ...prev, expectations_met: false }))}
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.expectations_met === false
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-red-300'
                  }`}
                >
                  Não
                </button>
              </div>
              <textarea
                value={ninetyDaysAnswers.expectations_comments}
                onChange={(e) => setNinetyDaysAnswers(prev => ({ ...prev, expectations_comments: e.target.value }))}
                placeholder="Comente sobre suas expectativas..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            {/* Campos de texto */}
            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Principais desafios</label>
              <textarea
                value={ninetyDaysAnswers.challenges}
                onChange={(e) => setNinetyDaysAnswers(prev => ({ ...prev, challenges: e.target.value }))}
                placeholder="Quais foram os principais desafios até agora?"
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Sugestões de melhoria</label>
              <textarea
                value={ninetyDaysAnswers.suggestions}
                onChange={(e) => setNinetyDaysAnswers(prev => ({ ...prev, suggestions: e.target.value }))}
                placeholder="O que poderia ser melhorado?"
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <RatingInput
              label="Satisfação geral"
              value={ninetyDaysAnswers.overall_satisfaction_rating}
              onChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, overall_satisfaction_rating: val }))}
              commentValue={ninetyDaysAnswers.additional_comments}
              onCommentChange={(val) => setNinetyDaysAnswers(prev => ({ ...prev, additional_comments: val }))}
              commentPlaceholder="Comentários adicionais..."
            />

            {/* Recomendaria */}
            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Recomendaria a empresa para amigos/conhecidos?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNinetyDaysAnswers(prev => ({ ...prev, recommend_company: true }))}
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.recommend_company === true
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-green-300'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setNinetyDaysAnswers(prev => ({ ...prev, recommend_company: false }))}
                  className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    ninetyDaysAnswers.recommend_company === false
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400 hover:border-red-300'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-yt-border">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleSaveAnswers} disabled={saving} icon={<Save size={18} />}>
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button variant="primary" onClick={handleComplete} disabled={saving} icon={<CheckCircle size={18} />}>
                Concluir Entrevista
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Form - Exit */}
      {isEditing && type === 'exit' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-stone-700 dark:text-stone-400" />
            Questionário - Desligamento
          </h2>

          <div className="space-y-4">
            {/* Motivo da saída */}
            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Principal motivo da saída
              </label>
              <select
                value={exitAnswers.departure_reason}
                onChange={(e) => setExitAnswers(prev => ({ ...prev, departure_reason: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm mb-3"
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
                onChange={(e) => setExitAnswers(prev => ({ ...prev, departure_reason_details: e.target.value }))}
                placeholder="Detalhe o motivo..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <RatingInput
              label="Ambiente de trabalho"
              value={exitAnswers.work_environment_rating}
              onChange={(val) => setExitAnswers(prev => ({ ...prev, work_environment_rating: val }))}
              commentValue={exitAnswers.work_environment_comments}
              onCommentChange={(val) => setExitAnswers(prev => ({ ...prev, work_environment_comments: val }))}
              commentPlaceholder="Como avalia o ambiente de trabalho?"
            />

            <RatingInput
              label="Liderança"
              value={exitAnswers.leadership_rating}
              onChange={(val) => setExitAnswers(prev => ({ ...prev, leadership_rating: val }))}
              commentValue={exitAnswers.leadership_comments}
              onCommentChange={(val) => setExitAnswers(prev => ({ ...prev, leadership_comments: val }))}
              commentPlaceholder="Como avalia a liderança direta?"
            />

            <RatingInput
              label="Oportunidades de crescimento"
              value={exitAnswers.growth_opportunities_rating}
              onChange={(val) => setExitAnswers(prev => ({ ...prev, growth_opportunities_rating: val }))}
              commentValue={exitAnswers.growth_opportunities_comments}
              onCommentChange={(val) => setExitAnswers(prev => ({ ...prev, growth_opportunities_comments: val }))}
              commentPlaceholder="Como avalia as oportunidades de crescimento?"
            />

            <RatingInput
              label="Remuneração e benefícios"
              value={exitAnswers.compensation_rating}
              onChange={(val) => setExitAnswers(prev => ({ ...prev, compensation_rating: val }))}
              commentValue={exitAnswers.compensation_comments}
              onCommentChange={(val) => setExitAnswers(prev => ({ ...prev, compensation_comments: val }))}
              commentPlaceholder="Como avalia a remuneração e os benefícios?"
            />

            <RatingInput
              label="Carga de trabalho"
              value={exitAnswers.workload_rating}
              onChange={(val) => setExitAnswers(prev => ({ ...prev, workload_rating: val }))}
              commentValue={exitAnswers.workload_comments}
              onCommentChange={(val) => setExitAnswers(prev => ({ ...prev, workload_comments: val }))}
              commentPlaceholder="Como avalia a carga de trabalho?"
            />

            {/* Campos de texto */}
            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">O que mais gostou na empresa?</label>
              <textarea
                value={exitAnswers.what_liked_most}
                onChange={(e) => setExitAnswers(prev => ({ ...prev, what_liked_most: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">O que poderia ser melhorado?</label>
              <textarea
                value={exitAnswers.what_could_improve}
                onChange={(e) => setExitAnswers(prev => ({ ...prev, what_could_improve: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>

            {/* Voltaria / Recomendaria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Voltaria a trabalhar na empresa?</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExitAnswers(prev => ({ ...prev, would_return: true }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_return === true
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitAnswers(prev => ({ ...prev, would_return: false }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_return === false
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Recomendaria a empresa?</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExitAnswers(prev => ({ ...prev, would_recommend: true }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_recommend === true
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitAnswers(prev => ({ ...prev, would_recommend: false }))}
                    className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      exitAnswers.would_recommend === false
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-gray-200 dark:border-yt-border text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Destino (próximo emprego/planos)</label>
              <input
                type="text"
                value={exitAnswers.destination}
                onChange={(e) => setExitAnswers(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Opcional"
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-yt-elevated/30 rounded-xl border border-gray-100 dark:border-yt-border">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Comentários adicionais</label>
              <textarea
                value={exitAnswers.additional_comments}
                onChange={(e) => setExitAnswers(prev => ({ ...prev, additional_comments: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-yt-border bg-gray-50 dark:bg-yt-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors py-2.5 px-3 text-sm resize-none"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-yt-border">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleSaveAnswers} disabled={saving} icon={<Save size={18} />}>
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button variant="primary" onClick={handleComplete} disabled={saving} icon={<CheckCircle size={18} />}>
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
