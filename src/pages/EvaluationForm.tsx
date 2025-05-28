import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Criterion, Evaluation, Feedback } from '../types';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import CriteriaRating from '../components/CriteriaRating';
import { Save, SendHorizontal, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const EvaluationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    employees,
    getEvaluationById,
    saveEvaluation,
    calculateFinalScore,
    technicalCriteria,
    behavioralCriteria,
    deliveriesCriteria,
  } = useEvaluation();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [technicalRatings, setTechnicalRatings] = useState<Criterion[]>([]);
  const [behavioralRatings, setBehavioralRatings] = useState<Criterion[]>([]);
  const [deliveriesRatings, setDeliveriesRatings] = useState<Criterion[]>([]);
  const [feedback, setFeedback] = useState<Feedback>({
    strengths: '',
    improvements: '',
    observations: '',
  });
  const [technicalScore, setTechnicalScore] = useState(0);
  const [behavioralScore, setBehavioralScore] = useState(0);
  const [deliveriesScore, setDeliveriesScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  
  // Load existing evaluation if editing
  useEffect(() => {
    if (id) {
      const evaluation = getEvaluationById(id);
      
      if (evaluation) {
        setSelectedEmployeeId(evaluation.employeeId);
        
        // Populate criteria ratings
        const tech = technicalCriteria.map(
          criterion => {
            const existing = evaluation.criteria.find(c => c.id === criterion.id);
            return existing || { ...criterion };
          }
        );
        setTechnicalRatings(tech);
        
        const behavioral = behavioralCriteria.map(
          criterion => {
            const existing = evaluation.criteria.find(c => c.id === criterion.id);
            return existing || { ...criterion };
          }
        );
        setBehavioralRatings(behavioral);
        
        const deliveries = deliveriesCriteria.map(
          criterion => {
            const existing = evaluation.criteria.find(c => c.id === criterion.id);
            return existing || { ...criterion };
          }
        );
        setDeliveriesRatings(deliveries);
        
        // Set feedback
        setFeedback(evaluation.feedback);
        
        // Set scores
        setTechnicalScore(evaluation.technicalScore);
        setBehavioralScore(evaluation.behavioralScore);
        setDeliveriesScore(evaluation.deliveriesScore);
        setFinalScore(evaluation.finalScore);
      }
    } else {
      // Initialize with empty ratings for new evaluation
      setTechnicalRatings(technicalCriteria.map(c => ({ ...c })));
      setBehavioralRatings(behavioralCriteria.map(c => ({ ...c })));
      setDeliveriesRatings(deliveriesCriteria.map(c => ({ ...c })));
    }
  }, [id, getEvaluationById, technicalCriteria, behavioralCriteria, deliveriesCriteria]);
  
  // Update scores when ratings change
  useEffect(() => {
    const calculateCategoryScore = (ratings: Criterion[]) => {
      const validRatings = ratings.filter(c => c.score !== undefined);
      if (validRatings.length === 0) return 0;
      
      const sum = validRatings.reduce((total, criterion) => total + (criterion.score || 0), 0);
      return sum / validRatings.length;
    };
    
    const techScore = calculateCategoryScore(technicalRatings);
    const behavScore = calculateCategoryScore(behavioralRatings);
    const deliverScore = calculateCategoryScore(deliveriesRatings);
    
    setTechnicalScore(techScore);
    setBehavioralScore(behavScore);
    setDeliveriesScore(deliverScore);
    
    const final = calculateFinalScore(techScore, behavScore, deliverScore);
    setFinalScore(final);
  }, [technicalRatings, behavioralRatings, deliveriesRatings, calculateFinalScore]);
  
  // Handle rating change
  const handleRatingChange = (category: 'technical' | 'behavioral' | 'deliveries') => (id: string, score: number) => {
    if (category === 'technical') {
      setTechnicalRatings(prevRatings =>
        prevRatings.map(rating =>
          rating.id === id ? { ...rating, score } : rating
        )
      );
    } else if (category === 'behavioral') {
      setBehavioralRatings(prevRatings =>
        prevRatings.map(rating =>
          rating.id === id ? { ...rating, score } : rating
        )
      );
    } else if (category === 'deliveries') {
      setDeliveriesRatings(prevRatings =>
        prevRatings.map(rating =>
          rating.id === id ? { ...rating, score } : rating
        )
      );
    }
  };
  
  // Handle feedback change
  const handleFeedbackChange = (field: keyof Feedback, value: string) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Save draft
  const saveDraft = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }
    
    const allCriteria = [
      ...technicalRatings,
      ...behavioralRatings,
      ...deliveriesRatings,
    ].filter(c => c.score !== undefined);
    
    const evaluation: Evaluation = {
      id: id || `eval-draft-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin', // In a real app, this would be the current user's ID
      date: new Date().toISOString().split('T')[0],
      status: 'in-progress',
      criteria: allCriteria,
      feedback,
      technicalScore,
      behavioralScore,
      deliveriesScore,
      finalScore,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: true,
    };
    
    saveEvaluation(evaluation);
    toast.success('Rascunho salvo com sucesso');
    navigate('/');
  };
  
  // Submit evaluation
  const submitEvaluation = () => {
    // Validate form
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }
    
    const allCriteria = [
      ...technicalRatings,
      ...behavioralRatings,
      ...deliveriesRatings,
    ];
    
    // Check if all criteria have ratings
    const hasUnratedCriteria = allCriteria.some(c => c.score === undefined);
    if (hasUnratedCriteria) {
      toast.error('Todas as competências precisam ser avaliadas');
      return;
    }
    
    // Check if feedback is complete
    if (!feedback.strengths || !feedback.improvements) {
      toast.error('Todos os campos de feedback são obrigatórios');
      return;
    }
    
    const evaluation: Evaluation = {
      id: id || `eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin', // In a real app, this would be the current user's ID
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      criteria: allCriteria,
      feedback,
      technicalScore,
      behavioralScore,
      deliveriesScore,
      finalScore,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false,
    };
    
    saveEvaluation(evaluation);
    toast.success('Avaliação enviada com sucesso');
    navigate('/');
  };
  
  // Cancel form
  const cancelForm = () => {
    navigate('/');
  };
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">
          {id ? 'Editar Avaliação' : 'Nova Avaliação'}
        </h1>
      </div>
      
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Dados do Colaborador</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Colaborador
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={!!id}
              >
                <option value="">Selecione um colaborador</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
                value={selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.position || '' : ''}
                readOnly
              />
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
                value={selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.department || '' : ''}
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Competências Técnicas</h2>
            <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Peso 40%
            </span>
          </div>
          
          <div className="space-y-2">
            {technicalRatings.map((criterion) => (
              <CriteriaRating
                key={criterion.id}
                criterion={criterion}
                onChange={handleRatingChange('technical')}
              />
            ))}
          </div>
          
          <div className="flex justify-end mt-2">
            <div className="text-sm font-medium">
              Média: <span className="text-blue-600">{technicalScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Competências Comportamentais</h2>
            <span className="ml-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Peso 30%
            </span>
          </div>
          
          <div className="space-y-2">
            {behavioralRatings.map((criterion) => (
              <CriteriaRating
                key={criterion.id}
                criterion={criterion}
                onChange={handleRatingChange('behavioral')}
              />
            ))}
          </div>
          
          <div className="flex justify-end mt-2">
            <div className="text-sm font-medium">
              Média: <span className="text-green-600">{behavioralScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Entregas</h2>
            <span className="ml-2 text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Peso 30%
            </span>
          </div>
          
          <div className="space-y-2">
            {deliveriesRatings.map((criterion) => (
              <CriteriaRating
                key={criterion.id}
                criterion={criterion}
                onChange={handleRatingChange('deliveries')}
              />
            ))}
          </div>
          
          <div className="flex justify-end mt-2">
            <div className="text-sm font-medium">
              Média: <span className="text-purple-600">{deliveriesScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Feedback</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pontos Fortes
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={feedback.strengths}
                onChange={(e) => handleFeedbackChange('strengths', e.target.value)}
                placeholder="Descreva os pontos fortes do colaborador..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pontos a Melhorar
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={feedback.improvements}
                onChange={(e) => handleFeedbackChange('improvements', e.target.value)}
                placeholder="Descreva os pontos que precisam ser melhorados..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações Finais
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={feedback.observations}
                onChange={(e) => handleFeedbackChange('observations', e.target.value)}
                placeholder="Observações adicionais sobre o desempenho..."
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Resultado Final</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500">Técnicas (40%)</p>
              <p className="text-lg font-medium text-blue-600">{technicalScore.toFixed(1)}</p>
            </div>
            
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500">Comportamentais (30%)</p>
              <p className="text-lg font-medium text-green-600">{behavioralScore.toFixed(1)}</p>
            </div>
            
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500">Entregas (30%)</p>
              <p className="text-lg font-medium text-purple-600">{deliveriesScore.toFixed(1)}</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700">Nota Final</p>
              <p className="text-xl font-bold text-blue-700">{finalScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-end gap-4 mt-8">
          <Button
            variant="outline"
            onClick={cancelForm}
            icon={<XCircle size={16} />}
          >
            Cancelar
          </Button>
          
          <Button
            variant="secondary"
            onClick={saveDraft}
            icon={<Save size={16} />}
          >
            Salvar Rascunho
          </Button>
          
          <Button
            variant="primary"
            onClick={submitEvaluation}
            icon={<SendHorizontal size={16} />}
          >
            Enviar Avaliação
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default EvaluationForm;