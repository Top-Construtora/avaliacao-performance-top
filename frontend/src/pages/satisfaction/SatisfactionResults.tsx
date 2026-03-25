import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, BarChart3, Users, Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { satisfactionService, SurveyResults } from '../../services/satisfaction.service';

const SatisfactionResults = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await satisfactionService.getResults(id!);
      setResults(data);
    } catch (error) {
      toast.error('Erro ao carregar resultados');
      navigate('/satisfaction');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (avg: number) => {
    if (avg >= 4) return 'text-green-600 dark:text-green-400';
    if (avg >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRatingBg = (avg: number) => {
    if (avg >= 4) return 'bg-green-100 dark:bg-green-900/30';
    if (avg >= 3) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (loading) return <LoadingSpinner />;
  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate('/satisfaction')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <BarChart3 className="h-6 w-6 text-primary-700 dark:text-primary-400 mr-2" />
              Resultados: {results.survey.title}
            </h1>
            {results.survey.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{results.survey.description}</p>
            )}
          </div>
        </div>

        {/* Stats resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-yt-elevated/50 rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{results.total_responses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Respostas</p>
          </div>

          <div className={`rounded-xl p-4 text-center ${getRatingBg(results.overall_average)}`}>
            <Star className={`h-6 w-6 mx-auto mb-1 ${getRatingColor(results.overall_average)}`} />
            <p className={`text-2xl font-bold ${getRatingColor(results.overall_average)}`}>
              {results.overall_average.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Média Geral</p>
          </div>

          <div className="bg-gray-50 dark:bg-yt-elevated/50 rounded-xl p-4 text-center">
            <MessageSquare className="h-6 w-6 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{results.results.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Perguntas</p>
          </div>
        </div>
      </motion.div>

      {/* Resultados por pergunta */}
      <div className="space-y-4">
        {results.results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{result.question_text}</p>
            </div>

            {/* Rating results */}
            {result.question_type === 'rating' && result.average !== undefined && (
              <div className="ml-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`px-4 py-2 rounded-xl ${getRatingBg(result.average)}`}>
                    <span className={`text-2xl font-bold ${getRatingColor(result.average)}`}>
                      {result.average.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 5</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{result.total_answers} respostas</span>
                </div>

                {/* Distribution bars */}
                {result.distribution && (
                  <div className="space-y-2">
                    {result.distribution.map((count, i) => {
                      const percentage = result.total_answers > 0 ? (count / result.total_answers) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-4 text-xs text-gray-500 dark:text-gray-400 text-right font-medium">{i + 1}</span>
                          <div className="flex-1 h-6 bg-gray-100 dark:bg-yt-elevated rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                i + 1 >= 4 ? 'bg-green-500' : i + 1 >= 3 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Yes/No results */}
            {result.question_type === 'yes_no' && (
              <div className="ml-10 flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{result.yes_count || 0}</span>
                  <span className="text-sm text-green-600 dark:text-green-400">Sim</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">{result.no_count || 0}</span>
                  <span className="text-sm text-red-600 dark:text-red-400">Não</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{result.total_answers} respostas</span>
              </div>
            )}

            {/* Text results */}
            {result.question_type === 'text' && result.text_answers && (
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{result.total_answers} respostas</p>
                {result.text_answers.slice(0, 10).map((text, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-yt-elevated/50 rounded-lg border border-gray-100 dark:border-yt-border">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{text}"</p>
                  </div>
                ))}
                {result.text_answers.length > 10 && (
                  <p className="text-xs text-gray-400">...e mais {result.text_answers.length - 10} respostas</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SatisfactionResults;
