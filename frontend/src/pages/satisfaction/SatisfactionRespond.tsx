import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { satisfactionService, SatisfactionSurvey } from '../../services/satisfaction.service';

const SatisfactionRespond = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState<SatisfactionSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [answers, setAnswers] = useState<
    Record<string, { rating_value?: number; text_value?: string; boolean_value?: boolean }>
  >({});

  useEffect(() => {
    if (id) loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const [data, responded] = await Promise.all([
        satisfactionService.getSurveyById(id!),
        satisfactionService.checkUserResponse(id!),
      ]);
      setSurvey(data);
      setHasResponded(responded);
    } catch (error) {
      toast.error('Erro ao carregar pesquisa');
      navigate('/satisfaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!survey?.questions) return;

    // Validar campos obrigatórios
    const required = survey.questions.filter((q) => q.required);
    for (const q of required) {
      const answer = answers[q.id];
      if (
        !answer ||
        (q.question_type === 'rating' && !answer.rating_value) ||
        (q.question_type === 'text' && !answer.text_value?.trim()) ||
        (q.question_type === 'yes_no' && answer.boolean_value === undefined)
      ) {
        toast.error(`Responda a pergunta: "${q.question_text}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([question_id, ans]) => ({
        question_id,
        ...ans,
      }));
      await satisfactionService.submitResponse(id!, formattedAnswers);
      toast.success('Respostas enviadas com sucesso!');
      navigate('/satisfaction');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar respostas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (hasResponded) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center"
        >
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Você já respondeu esta pesquisa
          </h1>
          <p className="text-muted-foreground mb-6">Obrigado pela sua participação!</p>
          <Button variant="primary" onClick={() => navigate('/satisfaction')}>
            Voltar
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!survey || survey.status !== 'active') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Esta pesquisa não está disponível.</p>
        <Button variant="outline" onClick={() => navigate('/satisfaction')} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/satisfaction')}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{survey.title}</h1>
            {survey.description && (
              <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
            )}
          </div>
        </div>
        {survey.is_anonymous && (
          <div className="bg-secondary border border-border rounded-xl p-3 text-sm text-muted-foreground">
            Esta pesquisa é anônima. Suas respostas não serão vinculadas ao seu perfil.
          </div>
        )}
      </motion.div>

      {/* Questions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {survey.questions?.map((question, index) => (
          <div key={question.id} className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-lime/20 text-lime-deep dark:text-lime flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {question.question_text}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </p>
              </div>
            </div>

            {question.question_type === 'rating' && (
              <div className="flex items-center gap-2 ml-10">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: { rating_value: rating } }))
                    }
                    className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all text-lg font-bold ${
                      answers[question.id]?.rating_value === rating
                        ? 'border-[#D2FF00] bg-lime text-obsidian shadow-md scale-110'
                        : 'border-border bg-secondary text-muted-foreground hover:border-[#D2FF00]'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
                <div className="ml-3 flex justify-between text-[10px] text-muted-foreground w-full max-w-[120px]">
                  <span>Insatisfeito</span>
                  <span>Satisfeito</span>
                </div>
              </div>
            )}

            {question.question_type === 'text' && (
              <div className="ml-10">
                <textarea
                  value={answers[question.id]?.text_value || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: { text_value: e.target.value },
                    }))
                  }
                  placeholder="Sua resposta..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 text-sm resize-none"
                />
              </div>
            )}

            {question.question_type === 'yes_no' && (
              <div className="flex gap-3 ml-10">
                <button
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: { boolean_value: true } }))
                  }
                  className={`px-8 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    answers[question.id]?.boolean_value === true
                      ? 'border-success bg-success/15 text-success'
                      : 'border-border bg-secondary text-muted-foreground hover:border-success'
                  }`}
                >
                  Sim
                </button>
                <button
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: { boolean_value: false } }))
                  }
                  className={`px-8 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    answers[question.id]?.boolean_value === false
                      ? 'border-destructive bg-destructive/15 text-destructive'
                      : 'border-border bg-secondary text-muted-foreground hover:border-destructive'
                  }`}
                >
                  Não
                </button>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Submit */}
      <div className="flex justify-end pb-8">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting}
          icon={<Send size={18} />}
          size="lg"
        >
          {submitting ? 'Enviando...' : 'Enviar Respostas'}
        </Button>
      </div>
    </div>
  );
};

export default SatisfactionRespond;
