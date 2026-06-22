import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  SmilePlus,
  Plus,
  Search,
  Trash2,
  BarChart3,
  Users,
  FileText,
  PlayCircle,
  StopCircle,
  Send,
  X,
} from 'lucide-react';
import { satisfactionService, SatisfactionSurvey } from '../../services/satisfaction.service';
import { useUserRole } from '../../context/AuthContext';

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-warning/15 text-warning', icon: FileText },
  active: { label: 'Ativa', color: 'bg-success/15 text-success', icon: PlayCircle },
  closed: { label: 'Encerrada', color: 'bg-destructive/15 text-destructive', icon: StopCircle },
};

const SatisfactionSurveys = () => {
  const navigate = useNavigate();
  const { isDirector, isAdmin } = useUserRole();
  const canManage = isDirector || isAdmin;
  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal de criação rápida
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAnonymous, setNewAnonymous] = useState(true);
  const [newQuestions, setNewQuestions] = useState<
    { question_text: string; question_type: string }[]
  >([{ question_text: '', question_type: 'rating' }]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await satisfactionService.getSurveys();
      setSurveys(data);
    } catch (error) {
      toast.error('Erro ao carregar pesquisas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const validQuestions = newQuestions.filter((q) => q.question_text.trim());
    if (validQuestions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta');
      return;
    }

    try {
      setCreating(true);
      await satisfactionService.createSurvey({
        title: newTitle,
        description: newDescription,
        is_anonymous: newAnonymous,
        questions: validQuestions,
      });
      toast.success('Pesquisa criada com sucesso!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewQuestions([{ question_text: '', question_type: 'rating' }]);
      loadSurveys();
    } catch (error) {
      toast.error('Erro ao criar pesquisa');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await satisfactionService.updateSurvey(id, { status: newStatus } as any);
      setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus as any } : s)));
      toast.success(`Pesquisa ${newStatus === 'active' ? 'ativada' : 'encerrada'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pesquisa e todas as respostas?'))
      return;
    try {
      await satisfactionService.deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success('Pesquisa excluída');
    } catch (error) {
      toast.error('Erro ao excluir pesquisa');
    }
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchTerm) {
        return (
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });
  }, [surveys, statusFilter, searchTerm]);

  const stats = useMemo(
    () => ({
      total: surveys.length,
      active: surveys.filter((s) => s.status === 'active').length,
      totalResponses: surveys.reduce((sum, s) => sum + (s.response_count || 0), 0),
      closed: surveys.filter((s) => s.status === 'closed').length,
    }),
    [surveys],
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
              <SmilePlus className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              Pesquisas de Satisfação
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Meça o nível de satisfação dos colaboradores
            </p>
          </div>

          {canManage && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={18} />}
              size="lg"
            >
              Nova Pesquisa
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground font-medium">Total</p>
            </div>
            <FileText className="absolute -bottom-2 -right-2 h-16 w-16 text-muted-foreground opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-sm text-muted-foreground font-medium">Ativas</p>
            </div>
            <PlayCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-muted-foreground opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-foreground">{stats.totalResponses}</p>
              <p className="text-sm text-muted-foreground font-medium">Respostas</p>
            </div>
            <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-muted-foreground opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-card border border-border rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-foreground">{stats.closed}</p>
              <p className="text-sm text-muted-foreground font-medium">Encerradas</p>
            </div>
            <StopCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-muted-foreground opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* List */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center bg-secondary backdrop-blur-sm rounded-xl p-1.5">
            {['all', 'active', 'draft', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-card text-lime-deep dark:text-lime shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'all'
                  ? 'Todas'
                  : s === 'active'
                    ? 'Ativas'
                    : s === 'draft'
                      ? 'Rascunhos'
                      : 'Encerradas'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar pesquisas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
          />
        </div>

        <div className="space-y-3">
          {filteredSurveys.map((survey) => {
            const statusInfo = statusConfig[survey.status];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary rounded-xl border border-border hover:border-[#D2FF00] transition-all duration-300 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-lime/20">
                    <SmilePlus className="h-5 w-5 text-lime-deep dark:text-lime" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{survey.title}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </span>
                      {survey.is_anonymous && (
                        <span className="text-xs text-muted-foreground">Anônima</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {survey.question_count || 0} perguntas • {survey.response_count || 0}{' '}
                      respostas
                      {survey.end_date &&
                        ` • Até ${new Date(survey.end_date).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Responder - se ativa e não é gestor */}
                    {survey.status === 'active' && (
                      <button
                        onClick={() => navigate(`/satisfaction/${survey.id}/respond`)}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                        title="Responder pesquisa"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}

                    {/* Ver resultados - gestores */}
                    {canManage && (
                      <button
                        onClick={() => navigate(`/satisfaction/${survey.id}/results`)}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                        title="Ver resultados"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Ativar/Encerrar - gestores */}
                    {canManage && survey.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(survey.id, 'active')}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-success transition-colors"
                        title="Ativar pesquisa"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}
                    {canManage && survey.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(survey.id, 'closed')}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                        title="Encerrar pesquisa"
                      >
                        <StopCircle className="h-4 w-4" />
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => handleDelete(survey.id)}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
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

        {filteredSurveys.length === 0 && (
          <div className="text-center py-12">
            <SmilePlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma pesquisa encontrada
            </h3>
            <p className="text-muted-foreground mb-6">Crie uma nova pesquisa de satisfação</p>
          </div>
        )}
      </div>

      {/* Modal de criação */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Nova Pesquisa de Satisfação</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-accent rounded-lg"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Pesquisa de Satisfação Q1 2026"
                      className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Descrição opcional..."
                      rows={2}
                      className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewAnonymous(!newAnonymous)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                        newAnonymous ? 'bg-lime border-[#D2FF00]' : 'bg-secondary border-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                          newAnonymous ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-muted-foreground font-medium">
                      Pesquisa anônima
                    </span>
                  </div>

                  {/* Perguntas */}
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Perguntas
                    </label>
                    <div className="space-y-3">
                      {newQuestions.map((q, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="mt-3 text-sm font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={q.question_text}
                              onChange={(e) => {
                                const updated = [...newQuestions];
                                updated[index].question_text = e.target.value;
                                setNewQuestions(updated);
                              }}
                              placeholder="Digite a pergunta..."
                              className="flex-1 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
                            />
                            <select
                              value={q.question_type}
                              onChange={(e) => {
                                const updated = [...newQuestions];
                                updated[index].question_type = e.target.value;
                                setNewQuestions(updated);
                              }}
                              className="w-28 rounded-xl border border-border bg-secondary text-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
                            >
                              <option value="rating">Nota 1-5</option>
                              <option value="text">Texto</option>
                              <option value="yes_no">Sim/Não</option>
                            </select>
                          </div>
                          {newQuestions.length > 1 && (
                            <button
                              onClick={() =>
                                setNewQuestions((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="mt-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setNewQuestions((prev) => [
                          ...prev,
                          { question_text: '', question_type: 'rating' },
                        ])
                      }
                      className="mt-3 text-sm text-lime-deep dark:text-lime hover:text-lime-deep font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Adicionar pergunta
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Pesquisa'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SatisfactionSurveys;
