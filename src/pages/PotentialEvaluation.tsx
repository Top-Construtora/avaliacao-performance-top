import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Info
} from 'lucide-react';

interface PotentialCriterion {
  id: string;
  title: string;
  description: string;
  score?: number;
}

const PotentialEvaluation = () => {
  const navigate = useNavigate();
  const { employees, saveEvaluation } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [criteria, setCriteria] = useState<PotentialCriterion[]>([
    {
      id: 'subsequent-function',
      title: 'Potencial para função subsequente',
      description: 'O que você enxerga como potencial máximo desta parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o desempenho e a motivação sustentados até hoje?',
    },
    {
      id: 'continuous-learning',
      title: 'Aprendizado contínuo',
      description: 'Sobre o aprendizado contínuo: percebe que este busca o desenvolvimento pessoal, profissional e o aprimoramento de seus conhecimentos técnicos e acadêmicos.',
    },
    {
      id: 'cultural-alignment',
      title: 'Alinhamento com Código Cultural',
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da TOP Construtora e Incorporadora.',
    },
    {
      id: 'systemic-vision',
      title: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
    }
  ]);

  const legend = [
    { value: 1, label: 'Não atende o esperado', color: 'bg-red-100 text-red-800' },
    { value: 2, label: 'Em desenvolvimento', color: 'bg-yellow-100 text-yellow-800' },
    { value: 3, label: 'Atende ao esperado', color: 'bg-blue-100 text-blue-800' },
    { value: 4, label: 'Supera', color: 'bg-green-100 text-green-800' }
  ];

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(criterion => 
      criterion.id === id ? { ...criterion, score } : criterion
    ));
  };

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }

    // Check if all criteria have scores
    const hasUnratedCriteria = criteria.some(c => c.score === undefined);
    if (hasUnratedCriteria) {
      toast.error('Avalie todos os critérios antes de salvar');
      return;
    }

    // Calculate average score
    const averageScore = criteria.reduce((sum, criterion) => sum + (criterion.score || 0), 0) / criteria.length;

    // Prepare evaluation data for potential assessment
    const potentialCriteria = criteria.map(criterion => ({
      id: criterion.id,
      name: criterion.title,
      description: criterion.description,
      category: 'potential' as 'technical' | 'behavioral' | 'deliveries',
      score: criterion.score!
    }));

    const evaluation = {
      id: `potential-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      criteria: potentialCriteria,
      feedback: {
        strengths: 'Avaliação de potencial concluída',
        improvements: '',
        observations: `Avaliação de potencial - Média: ${averageScore.toFixed(1)}`
      },
      technicalScore: averageScore,
      behavioralScore: 0,
      deliveriesScore: 0,
      finalScore: averageScore,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação de Potencial salva com sucesso!');
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Avaliação de Potencial</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Voltar
          </Button>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colaborador
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Selecione um colaborador</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={selectedEmployee.position}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={selectedEmployee.department}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={new Date().toLocaleDateString('pt-BR')}
                  readOnly
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Legenda
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {legend.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${item.color}`}>
                  {item.value}
                </span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Evaluation Criteria */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {criteria.map((criterion, index) => (
            <div key={criterion.id} className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {index + 1}. {criterion.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {criterion.description}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                {[1, 2, 3, 4].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleScoreChange(criterion.id, rating)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all font-medium ${
                      criterion.score === rating
                        ? 'border-primary-500 bg-primary-500 text-white shadow-md'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Save Button */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save size={16} />}
            className="bg-primary-500 hover:bg-primary-600"
          >
            Salvar Avaliação de Potencial
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <Info className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador selecionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecione um colaborador acima para iniciar a avaliação de potencial
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotentialEvaluation;