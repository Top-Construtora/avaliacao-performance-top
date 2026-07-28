import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Send, CheckCircle, ClipboardList, Video, Calendar } from 'lucide-react';
import {
  interviewService,
  PublicInterview,
  InterviewAnswer,
} from '../../services/interview.service';
import { formatDateBR } from '../../utils/date';

const doneKey = (token: string) => `gio_public_interview_done_${token}`;

// Moldura definida FORA do componente (evita remontagem e perda de foco).
const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8 sm:py-12">
    <div className="w-full max-w-2xl">{children}</div>
  </div>
);

const PublicInterviewRespond = () => {
  const { token } = useParams();
  const [interview, setInterview] = useState<PublicInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [answers, setAnswers] = useState<
    Record<string, { rating_value?: number; text_value?: string; boolean_value?: boolean }>
  >({});

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await interviewService.getPublicInterview(token);
        if (data.has_responded || localStorage.getItem(doneKey(token))) {
          setDone(true);
        }
        setInterview(data);
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (!interview || !token) return;

    const required = interview.questions.filter((q) => q.required);
    for (const q of required) {
      const a = answers[q.id];
      if (
        !a ||
        (q.question_type === 'rating' && !a.rating_value) ||
        (q.question_type === 'text' && !a.text_value?.trim()) ||
        (q.question_type === 'yes_no' && a.boolean_value === undefined)
      ) {
        toast.error(`Responda a pergunta: "${q.question_text}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const formatted: InterviewAnswer[] = Object.entries(answers).map(([question_id, ans]) => ({
        question_id,
        ...ans,
      }));
      await interviewService.submitPublicInterview(token, formatted);
      localStorage.setItem(doneKey(token), '1');
      setDone(true);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar respostas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-deep dark:border-lime" />
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Respostas enviadas!</h1>
          <p className="text-muted-foreground">
            Obrigado por participar. Esta entrevista já foi respondida.
          </p>
        </div>
      </Shell>
    );
  }

  if (unavailable || !interview) {
    return (
      <Shell>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
          <ClipboardList className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Entrevista não disponível</h1>
          <p className="text-muted-foreground">
            Este link não é válido ou a entrevista não está mais disponível.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-4"
      >
        <div className="flex items-center gap-2 text-lime-deep dark:text-lime mb-3">
          <ClipboardList className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Entrevista de {interview.type_label}
          </span>
        </div>
        {interview.employee_name && (
          <h1 className="text-2xl font-bold">Olá, {interview.employee_name.split(' ')[0]}!</h1>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Suas respostas ajudam a melhorar a experiência de todos na empresa. Responda com
          sinceridade — leva poucos minutos.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {interview.scheduled_date && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateBR(interview.scheduled_date)}
            </span>
          )}
          {interview.meeting_url && (
            <a
              href={interview.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime text-obsidian text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Video className="h-4 w-4" /> Entrar na reunião
            </a>
          )}
        </div>
      </motion.div>

      {/* Perguntas */}
      <div className="space-y-4">
        {interview.questions.map((question, index) => (
          <div key={question.id} className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-lime/20 text-lime-deep dark:text-lime flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-sm font-semibold">
                {question.question_text}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </p>
            </div>

            {question.question_type === 'rating' &&
              (() => {
                const scale = question.rating_scale === 10 ? 10 : 5;
                const values = Array.from({ length: scale }, (_, i) => i + 1);
                return (
                  <div className="ml-10 flex flex-wrap items-center gap-2">
                    {values.map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: { rating_value: rating },
                          }))
                        }
                        className={`flex items-center justify-center rounded-xl border-2 transition-all font-bold ${
                          scale === 10 ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
                        } ${
                          answers[question.id]?.rating_value === rating
                            ? 'border-[#D2FF00] bg-lime text-obsidian shadow-md scale-110'
                            : 'border-border bg-secondary text-muted-foreground hover:border-[#D2FF00]'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                );
              })()}

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
              <div className="ml-10 flex gap-3">
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
      </div>

      {/* Enviar */}
      <div className="mt-6 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-obsidian font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Enviando...' : 'Enviar Respostas'}
        </button>
      </div>
    </Shell>
  );
};

export default PublicInterviewRespond;
