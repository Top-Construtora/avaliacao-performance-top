import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Plus, X, ClipboardList } from 'lucide-react';
import {
  interviewService,
  InterviewTemplate,
  InterviewType,
  INTERVIEW_TYPE_LABELS,
} from '../../services/interview.service';

interface DraftQuestion {
  question_text: string;
  question_type: string; // 'rating' | 'rating_10' | 'text' | 'yes_no' (rating_10 é pseudo-tipo da UI)
  required: boolean;
}

const inputClass =
  'w-full rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3';

const InterviewTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<InterviewType>('onboarding');
  const [draft, setDraft] = useState<DraftQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await interviewService.getTemplates();
        setTemplates(data);
      } catch {
        toast.error('Erro ao carregar modelos');
        navigate('/interviews');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carrega o rascunho quando muda a aba/quando os modelos chegam
  useEffect(() => {
    const template = templates.find((t) => t.type === activeType);
    setDraft(
      (template?.questions || []).map((q) => ({
        question_text: q.question_text,
        question_type:
          q.question_type === 'rating' && q.rating_scale === 10 ? 'rating_10' : q.question_type,
        required: q.required !== false,
      })),
    );
  }, [templates, activeType]);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setDraft((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    const validQuestions = draft
      .filter((q) => q.question_text.trim())
      .map((q) => {
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
      await interviewService.updateTemplate(activeType, { questions: validQuestions });
      toast.success('Modelo atualizado! Vale para as próximas entrevistas.');
      const data = await interviewService.getTemplates();
      setTemplates(data);
    } catch {
      toast.error('Erro ao salvar modelo');
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
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
                <ClipboardList className="h-6 w-6 text-lime-deep dark:text-lime mr-2 flex-shrink-0" />
                Modelos de Entrevista
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize as perguntas de cada tipo. As mudanças valem para as{' '}
                <strong>próximas</strong> entrevistas — as já criadas não são alteradas.
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
            {saving ? 'Salvando...' : 'Salvar Modelo'}
          </Button>
        </div>
      </motion.div>

      {/* Abas por tipo */}
      <div className="flex flex-wrap items-center gap-1 bg-secondary rounded-xl p-1.5 w-fit">
        {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === t
                ? 'bg-card text-lime-deep dark:text-lime shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {INTERVIEW_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Perguntas do modelo ativo */}
      <motion.div
        key={activeType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <label className="block text-sm font-semibold text-muted-foreground mb-3">
          Perguntas — {INTERVIEW_TYPE_LABELS[activeType]}
        </label>
        <div className="space-y-3">
          {draft.map((q, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex flex-col items-center gap-0.5 mt-1 flex-shrink-0">
                <button
                  onClick={() => moveQuestion(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none p-1"
                  title="Mover para cima"
                >
                  ▲
                </button>
                <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                <button
                  onClick={() => moveQuestion(index, 1)}
                  disabled={index === draft.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none p-1"
                  title="Mover para baixo"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                  placeholder="Digite a pergunta..."
                  className={inputClass}
                />
                <select
                  value={q.question_type}
                  onChange={(e) => updateQuestion(index, { question_type: e.target.value })}
                  className={`${inputClass} sm:w-32`}
                >
                  <option value="rating">Nota 1-5</option>
                  <option value="rating_10">Nota 1-10</option>
                  <option value="text">Texto</option>
                  <option value="yes_no">Sim/Não</option>
                </select>
                <select
                  value={q.required ? 'req' : 'opt'}
                  onChange={(e) => updateQuestion(index, { required: e.target.value === 'req' })}
                  className={`${inputClass} sm:w-36`}
                >
                  <option value="req">Obrigatória</option>
                  <option value="opt">Opcional</option>
                </select>
              </div>
              <button
                onClick={() => setDraft((prev) => prev.filter((_, i) => i !== index))}
                className="mt-2 p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="Remover pergunta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setDraft((prev) => [
              ...prev,
              { question_text: '', question_type: 'rating', required: true },
            ])
          }
          className="mt-3 text-sm text-lime-deep dark:text-lime hover:text-lime-deep font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Adicionar pergunta
        </button>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={<Save size={18} />}
          >
            {saving ? 'Salvando...' : 'Salvar Modelo'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewTemplates;
