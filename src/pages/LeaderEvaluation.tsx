import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  ArrowLeft,
  Star
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  weight: number;
  items: CompetencyItem[];
  expanded: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface Scores {
  technical: number;
  behavioral: number;
  organizational: number;
  final: number;
}

const LeaderEvaluation = () => {
  const navigate = useNavigate();
  const { employees, saveEvaluation } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [scores, setScores] = useState<Scores>({
    technical: 0,
    behavioral: 0,
    organizational: 0,
    final: 0
  });
  
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'technical',
      title: 'Competências Técnicas',
      weight: 50,
      expanded: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      items: [
        { 
          id: 'tech1', 
          name: 'Gestão de Conhecimento',
          description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes',
          score: undefined 
        },
        { 
          id: 'tech2', 
          name: 'Segurança e Resultados',
          description: 'Foco em segurança do trabalho e entrega de resultados com qualidade',
          score: undefined 
        },
        { 
          id: 'tech3', 
          name: 'Pensamento Crítico',
          description: 'Habilidade de analisar situações e tomar decisões fundamentadas',
          score: undefined 
        },
        { 
          id: 'tech4', 
          name: 'Assertiva e Provedora',
          description: 'Comunicação clara e capacidade de prover soluções efetivas',
          score: undefined 
        }
      ]
    },
    {
      id: 'behavioral',
      title: 'Competências Comportamentais',
      weight: 30,
      expanded: false,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      items: [
        { 
          id: 'beh1', 
          name: 'Comunicação',
          description: 'Capacidade de transmitir informações de forma clara e eficaz',
          score: undefined 
        },
        { 
          id: 'beh2', 
          name: 'Inteligência Emocional',
          description: 'Habilidade de gerenciar emoções próprias e compreender as dos outros',
          score: undefined 
        },
        { 
          id: 'beh3', 
          name: 'Delegação',
          description: 'Capacidade de distribuir tarefas adequadamente e empoderar a equipe',
          score: undefined 
        },
        { 
          id: 'beh4', 
          name: 'Patrimonialista',
          description: 'Cuidado e responsabilidade com os recursos da empresa',
          score: undefined 
        }
      ]
    },
    {
      id: 'organizational',
      title: 'Competências Organizacionais',
      weight: 20,
      expanded: false,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      items: [
        { 
          id: 'org1', 
          name: 'Meritocracia e Missão Compartilhada',
          description: 'Reconhecimento por mérito e alinhamento com os valores da empresa',
          score: undefined 
        },
        { 
          id: 'org2', 
          name: 'Espiral de Passos',
          description: 'Desenvolvimento contínuo e progressão estruturada',
          score: undefined 
        },
        { 
          id: 'org3', 
          name: 'Planilhas e Prazos',
          description: 'Organização, controle e cumprimento de prazos estabelecidos',
          score: undefined 
        },
        { 
          id: 'org4', 
          name: 'Relações Construtivas',
          description: 'Construção de relacionamentos positivos e produtivos',
          score: undefined 
        }
      ]
    }
  ]);

  const ratingLabels = {
    1: 'Insatisfatório',
    2: 'Em Desenvolvimento',
    3: 'Satisfatório',
    4: 'Excepcional'
  };

  // Calculate scores whenever ratings change
  useEffect(() => {
    calculateScores();
  }, [sections]);

  const calculateScores = () => {
    const newScores: Scores = { technical: 0, behavioral: 0, organizational: 0, final: 0 };
    
    sections.forEach(section => {
      const sectionScores = section.items.filter(item => item.score !== undefined).map(item => item.score || 0);
      if (sectionScores.length > 0) {
        const average = sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length;
        
        if (section.id === 'technical') newScores.technical = average;
        else if (section.id === 'behavioral') newScores.behavioral = average;
        else if (section.id === 'organizational') newScores.organizational = average;
      }
    });
    
    // Calculate final weighted score
    newScores.final = (
      (newScores.technical * 0.5) +
      (newScores.behavioral * 0.3) +
      (newScores.organizational * 0.2)
    );
    
    setScores(newScores);
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, expanded: !section.expanded } : section
    ));
  };

  const handleScoreChange = (sectionId: string, itemId: string, score: number) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, score } : item
            )
          }
        : section
    ));
  };

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }

    // Prepare evaluation data
    const allCriteria = sections.flatMap(section => 
      section.items
        .filter(item => item.score !== undefined)
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: (section.id === 'technical' ? 'technical' : 
                    section.id === 'behavioral' ? 'behavioral' : 'deliveries') as 'technical' | 'behavioral' | 'deliveries',
          score: item.score!
        }))
    );

    const evaluation = {
      id: `leader-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'in-progress' as const,
      criteria: allCriteria,
      feedback: {
        strengths: '',
        improvements: '',
        observations: ''
      },
      technicalScore: scores.technical,
      behavioralScore: scores.behavioral,
      deliveriesScore: scores.organizational,
      finalScore: scores.final,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: true
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação salva como rascunho');
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador para continuar');
      return;
    }
    
    // Check if all items have scores
    const allScored = sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );

    if (!allScored) {
      toast.error('Avalie todas as competências antes de enviar');
      return;
    }

    // Prepare evaluation data
    const allCriteria = sections.flatMap(section => 
      section.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: (section.id === 'technical' ? 'technical' : 
                  section.id === 'behavioral' ? 'behavioral' : 'deliveries') as 'technical' | 'behavioral' | 'deliveries',
        score: item.score!
      }))
    );

    const evaluation = {
      id: `leader-eval-${Date.now()}`,
      employeeId: selectedEmployeeId,
      evaluatorId: 'admin',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      criteria: allCriteria,
      feedback: {
        strengths: '',
        improvements: '',
        observations: ''
      },
      technicalScore: scores.technical,
      behavioralScore: scores.behavioral,
      deliveriesScore: scores.organizational,
      finalScore: scores.final,
      lastUpdated: new Date().toISOString().split('T')[0],
      isDraft: false
    };

    saveEvaluation(evaluation);
    toast.success('Avaliação enviada com sucesso');
    navigate('/');
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
          <h1 className="text-2xl font-bold text-gray-800">Avaliação do Líder</h1>
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

      {/* Evaluation Sections */}
      {selectedEmployeeId && (
        <>
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  {section.expanded ? (
                    <ChevronDown className="w-5 h-5 mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 mr-2" />
                  )}
                  {section.title}
                  <span className={`ml-2 text-xs font-medium ${section.bgColor} ${section.color} px-2 py-1 rounded-full`}>
                    Peso {section.weight}%
                  </span>
                </h2>
                <span className="text-sm text-gray-500">
                  {section.items.filter(item => item.score !== undefined).length}/{section.items.length} avaliados
                </span>
              </button>

              {section.expanded && (
                <div className="p-6 space-y-6">
                  {section.items.map((item) => (
                    <div key={item.id} className="space-y-3">
                      <div>
                        <h4 className="text-md font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleScoreChange(section.id, item.id, rating)}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                              item.score === rating
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-lg font-bold">{rating}</div>
                            <div className="text-xs mt-1">
                              {ratingLabels[rating as keyof typeof ratingLabels]}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {/* Score Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo das Notas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800">Técnicas</h4>
                <p className="text-2xl font-bold text-blue-600">{scores.technical.toFixed(1)}</p>
                <p className="text-xs text-blue-600">Peso 50%</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800">Comportamentais</h4>
                <p className="text-2xl font-bold text-green-600">{scores.behavioral.toFixed(1)}</p>
                <p className="text-xs text-green-600">Peso 30%</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800">Organizacionais</h4>
                <p className="text-2xl font-bold text-purple-600">{scores.organizational.toFixed(1)}</p>
                <p className="text-xs text-purple-600">Peso 20%</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-800">Nota Final</h4>
                <p className="text-2xl font-bold text-gray-700">{scores.final.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Média Ponderada</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end space-x-4"
          >
            <Button
              variant="secondary"
              onClick={handleSave}
              icon={<Save size={16} />}
            >
              Salvar Rascunho
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              icon={<Send size={16} />}
            >
              Enviar Avaliação
            </Button>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <Star className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador selecionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecione um colaborador acima para iniciar a avaliação
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderEvaluation;