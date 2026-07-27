import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  SmilePlus,
  Plus,
  Search,
  Trash2,
  BarChart3,
  FileText,
  PlayCircle,
  StopCircle,
  Send,
  Pencil,
  Link2,
} from 'lucide-react';
import { satisfactionService, SatisfactionSurvey } from '../../services/satisfaction.service';
import { useUserRole } from '../../context/AuthContext';
import { formatDateBR } from '../../utils/date';

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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await satisfactionService.updateSurvey(id, { status: newStatus } as any);
      setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus as any } : s)));
      toast.success(`Pesquisa ${newStatus === 'active' ? 'ativada' : 'encerrada'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const copyPublicLink = (surveyId: string) => {
    const url = `${window.location.origin}/p/${surveyId}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success('Link público copiado!'),
        () => toast.error('Não foi possível copiar o link'),
      );
    } else {
      // Fallback: mostra a URL para cópia manual
      toast(url, { duration: 8000 });
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

  if (loading) return <LoadingSpinner />;

  // Visão do colaborador: apenas as pesquisas ativas para responder, nada mais.
  if (!canManage) {
    const available = surveys.filter((s) => s.status === 'active');
    return (
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
            <SmilePlus className="h-6 w-6 sm:h-7 sm:w-7 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
            Pesquisas de Satisfação
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Responda as pesquisas disponíveis para você
          </p>
        </motion.div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-6">
          {available.length > 0 ? (
            <div className="space-y-3">
              {available.map((survey) => (
                <motion.button
                  key={survey.id}
                  type="button"
                  onClick={() => navigate(`/satisfaction/${survey.id}/respond`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left bg-secondary rounded-xl border border-border hover:border-[#D2FF00] transition-all duration-300 p-4 flex items-center gap-4"
                >
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-lime/20">
                    <SmilePlus className="h-5 w-5 text-lime-deep dark:text-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{survey.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {survey.question_count || 0} perguntas
                      {survey.is_anonymous && ' • Anônima'}
                    </p>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime text-obsidian text-sm font-semibold">
                    <Send className="h-4 w-4" />
                    <span className="hidden xs:inline">Responder</span>
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <SmilePlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Nenhuma pesquisa disponível
              </h3>
              <p className="text-muted-foreground">
                Quando houver uma pesquisa para responder, ela aparecerá aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              onClick={() => navigate('/satisfaction/new')}
              icon={<Plus size={18} />}
              size="lg"
            >
              Nova Pesquisa
            </Button>
          )}
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
                      {survey.end_date && ` • Até ${formatDateBR(survey.end_date)}`}
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
                        onClick={() => copyPublicLink(survey.id)}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                        title="Copiar link público (sem login)"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => navigate(`/satisfaction/${survey.id}/edit`)}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-lime-deep dark:hover:text-lime transition-colors"
                        title="Editar pesquisa"
                      >
                        <Pencil className="h-4 w-4" />
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
    </div>
  );
};

export default SatisfactionSurveys;
