import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Plus, X, SmilePlus } from 'lucide-react';
import { satisfactionService } from '../../services/satisfaction.service';

const SatisfactionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [questions, setQuestions] = useState<
    { question_text: string; question_type: string; required: boolean }[]
  >([{ question_text: '', question_type: 'rating', required: true }]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const survey = await satisfactionService.getSurveyById(id);
        setTitle(survey.title || '');
        setDescription(survey.description || '');
        setAnonymous(survey.is_anonymous !== false);
        const loaded = (survey.questions || []).map((q) => ({
          question_text: q.question_text,
          // Reconstrói o pseudo-tipo da UI: rating com escala 10 vira 'rating_10'.
          question_type:
            q.question_type === 'rating' && q.rating_scale === 10 ? 'rating_10' : q.question_type,
          required: q.required !== false,
        }));
        if (loaded.length > 0) setQuestions(loaded);
      } catch (error) {
        toast.error('Erro ao carregar pesquisa');
        navigate('/satisfaction');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateQuestion = (
    index: number,
    patch: Partial<{ question_text: string; question_type: string; required: boolean }>,
  ) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const validQuestions = questions
      .filter((q) => q.question_text.trim())
      .map((q) => {
        // 'rating_10' é um pseudo-tipo só da UI: vira 'rating' com escala 10.
        if (q.question_type === 'rating_10') {
          return {
            question_text: q.question_text,
            question_type: 'rating',
            rating_scale: 10,
            required: q.required,
          };
        }
        if (q.question_type === 'rating') {
          return {
            question_text: q.question_text,
            question_type: 'rating',
            rating_scale: 5,
            required: q.required,
          };
        }
        return {
          question_text: q.question_text,
          question_type: q.question_type,
          required: q.required,
        };
      });

    if (validQuestions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await satisfactionService.updateSurvey(id!, {
          title,
          description,
          is_anonymous: anonymous,
          questions: validQuestions,
        } as any);
        toast.success('Pesquisa atualizada com sucesso!');
      } else {
        await satisfactionService.createSurvey({
          title,
          description,
          is_anonymous: anonymous,
          questions: validQuestions,
        });
        toast.success('Pesquisa criada com sucesso!');
      }
      navigate('/satisfaction');
    } catch (error) {
      toast.error(isEditing ? 'Erro ao atualizar pesquisa' : 'Erro ao criar pesquisa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/satisfaction')}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
                <SmilePlus className="h-6 w-6 text-lime-deep dark:text-lime mr-2 flex-shrink-0" />
                {isEditing ? 'Editar Pesquisa de Satisfação' : 'Nova Pesquisa de Satisfação'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing
                  ? 'Ajuste as perguntas e salve as alterações'
                  : 'Monte as perguntas e publique para os colaboradores'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={<Save size={18} />}
            className="flex-shrink-0"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Pesquisa'}
          </Button>
        </div>
      </motion.div>

      {/* Dados da pesquisa */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Pesquisa de Satisfação Q1 2026"
            className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mensagem de abertura da pesquisa..."
            rows={4}
            className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnonymous(!anonymous)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
              anonymous ? 'bg-lime border-[#D2FF00]' : 'bg-secondary border-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                anonymous ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-muted-foreground font-medium">Pesquisa anônima</span>
        </div>
      </motion.div>

      {/* Perguntas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <label className="block text-sm font-semibold text-muted-foreground mb-3">Perguntas</label>
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-3 text-sm font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                  placeholder="Digite a pergunta..."
                  className="flex-1 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
                />
                <select
                  value={q.question_type}
                  onChange={(e) => updateQuestion(index, { question_type: e.target.value })}
                  className="w-full sm:w-32 rounded-xl border border-border bg-secondary text-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
                >
                  <option value="rating">Nota 1-5</option>
                  <option value="rating_10">Nota 1-10</option>
                  <option value="text">Texto</option>
                  <option value="yes_no">Sim/Não</option>
                </select>
                <select
                  value={q.required ? 'req' : 'opt'}
                  onChange={(e) => updateQuestion(index, { required: e.target.value === 'req' })}
                  className="w-full sm:w-36 rounded-xl border border-border bg-secondary text-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm"
                >
                  <option value="req">Obrigatória</option>
                  <option value="opt">Opcional</option>
                </select>
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                  className="mt-2 p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setQuestions((prev) => [
              ...prev,
              { question_text: '', question_type: 'rating', required: true },
            ])
          }
          className="mt-3 text-sm text-lime-deep dark:text-lime hover:text-lime-deep font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Adicionar pergunta
        </button>
      </motion.div>

      {/* Ação inferior (mobile-friendly) */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/satisfaction')}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} icon={<Save size={18} />}>
          {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Pesquisa'}
        </Button>
      </div>
    </div>
  );
};

export default SatisfactionForm;
