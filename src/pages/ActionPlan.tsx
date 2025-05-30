import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Plus,
  X,
  Target,
  Calendar,
  FileText,
  User,
  Lightbulb,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';

interface ActionItem {
  id: string;
  competencia: string;
  objetivo: string;
  acoes: string[];
  recursos: string[];
  prazo: string;
  status: 'pendente' | 'em-andamento' | 'concluido';
}

interface ActionPlanData {
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  observacoes: string;
}

const ActionPlan = () => {
  const navigate = useNavigate();
  const { employees } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [planData, setPlanData] = useState<ActionPlanData>({
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: '',
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: [],
    observacoes: ''
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  // Atualizar dados quando colaborador é selecionado
  useEffect(() => {
    if (selectedEmployee) {
      setPlanData(prev => ({
        ...prev,
        colaborador: selectedEmployee.name,
        cargo: selectedEmployee.position,
        departamento: selectedEmployee.department,
        periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      }));
    }
  }, [selectedEmployee]);

  const createNewActionItem = (): ActionItem => ({
    id: Date.now().toString(),
    competencia: '',
    objetivo: '',
    acoes: [''],
    recursos: [''],
    prazo: '',
    status: 'pendente'
  });

  const addActionItem = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    setPlanData(prev => ({
      ...prev,
      [category]: [...prev[category], createNewActionItem()]
    }));
  };

  const removeActionItem = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', id: string) => {
    setPlanData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const updateActionItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: keyof ActionItem,
    value: any
  ) => {
    setPlanData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: 'acoes' | 'recursos'
  ) => {
    setPlanData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id 
          ? { ...item, [field]: [...item[field], ''] }
          : item
      )
    }));
  };

  const removeArrayItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: 'acoes' | 'recursos',
    index: number
  ) => {
    setPlanData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id 
          ? { ...item, [field]: item[field].filter((_, i) => i !== index) }
          : item
      )
    }));
  };

  const updateArrayItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: 'acoes' | 'recursos',
    index: number,
    value: string
  ) => {
    setPlanData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id 
          ? {
              ...item,
              [field]: item[field].map((item, i) => i === index ? value : item)
            }
          : item
      )
    }));
  };

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador');
      return;
    }

    // Validar se há pelo menos um item de desenvolvimento
    const totalItems = planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length;
    if (totalItems === 0) {
      toast.error('Adicione pelo menos um item de desenvolvimento');
      return;
    }

    // Salvar no localStorage para demonstração
    const savedPlans = JSON.parse(localStorage.getItem('actionPlans') || '[]');
    const newPlan = {
      ...planData,
      id: Date.now().toString(),
      employeeId: selectedEmployeeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    savedPlans.push(newPlan);
    localStorage.setItem('actionPlans', JSON.stringify(savedPlans));

    toast.success('Plano de Ação salvo com sucesso!');
    navigate('/reports');
  };

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo (3-6 meses)',
      icon: Clock,
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo (6-12 meses)',
      icon: Target,
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo (1-2 anos)',
      icon: TrendingUp,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    }
  ];

  const renderActionItems = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const categoryData = categories.find(cat => cat.key === category)!;
    const items = planData[category];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-lg shadow border-2 ${categoryData.color} overflow-hidden`}
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <categoryData.icon className={`h-5 w-5 ${categoryData.iconColor}`} />
              <h3 className="text-lg font-semibold text-gray-800">{categoryData.title}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addActionItem(category)}
              icon={<Plus size={16} />}
            >
              Adicionar Item
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum item de desenvolvimento adicionado</p>
              <p className="text-sm">Clique em "Adicionar Item" para começar</p>
            </div>
          ) : (
            items.map((item, itemIndex) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium text-gray-800">
                    Item de Desenvolvimento #{itemIndex + 1}
                  </h4>
                  <button
                    onClick={() => removeActionItem(category, item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Competência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competência a Desenvolver *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                    value={item.competencia}
                    onChange={(e) => updateActionItem(category, item.id, 'competencia', e.target.value)}
                  />
                </div>

                {/* Objetivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objetivo Específico *
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descreva o objetivo específico a ser alcançado..."
                    value={item.objetivo}
                    onChange={(e) => updateActionItem(category, item.id, 'objetivo', e.target.value)}
                  />
                </div>

                {/* Ações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ações de Desenvolvimento
                  </label>
                  {item.acoes.map((acao, acaoIndex) => (
                    <div key={acaoIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Descreva a ação..."
                        value={acao}
                        onChange={(e) => updateArrayItem(category, item.id, 'acoes', acaoIndex, e.target.value)}
                      />
                      {item.acoes.length > 1 && (
                        <button
                          onClick={() => removeArrayItem(category, item.id, 'acoes', acaoIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(category, item.id, 'acoes')}
                    icon={<Plus size={14} />}
                    className="mt-2"
                  >
                    Adicionar Ação
                  </Button>
                </div>

                {/* Recursos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recursos Necessários
                  </label>
                  {item.recursos.map((recurso, recursoIndex) => (
                    <div key={recursoIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Descreva o recurso necessário..."
                        value={recurso}
                        onChange={(e) => updateArrayItem(category, item.id, 'recursos', recursoIndex, e.target.value)}
                      />
                      {item.recursos.length > 1 && (
                        <button
                          onClick={() => removeArrayItem(category, item.id, 'recursos', recursoIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(category, item.id, 'recursos')}
                    icon={<Plus size={14} />}
                    className="mt-2"
                  >
                    Adicionar Recurso
                  </Button>
                </div>

                {/* Prazo e Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prazo
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={item.prazo}
                      onChange={(e) => updateActionItem(category, item.id, 'prazo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={item.status}
                      onChange={(e) => updateActionItem(category, item.id, 'status', e.target.value as any)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em-andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={16} />}
            >
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-3 h-8 w-8 text-blue-600" />
                PDI - Plano de Desenvolvimento Individual
              </h1>
              <p className="text-gray-600">Estruture o desenvolvimento do colaborador</p>
            </div>
          </div>
        </div>

        {/* Seleção do colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colaborador *
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
                  value={planData.cargo}
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
                  value={planData.departamento}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={planData.periodo}
                  onChange={(e) => setPlanData(prev => ({ ...prev, periodo: e.target.value }))}
                  placeholder="Ex: 2024-2025"
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Itens de Desenvolvimento por Prazo */}
      {selectedEmployeeId && (
        <div className="space-y-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              {renderActionItems(category.key)}
            </motion.div>
          ))}

          {/* Observações Gerais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
              Observações e Comentários Gerais
            </h3>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              placeholder="Adicione observações gerais sobre o plano de desenvolvimento, contexto, motivações ou outras informações relevantes..."
              value={planData.observacoes}
              onChange={(e) => setPlanData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </motion.div>

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end space-x-4"
          >
            <Button
              variant="secondary"
              onClick={() => navigate('/reports')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              icon={<Save size={16} />}
            >
              Salvar PDI
            </Button>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador selecionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecione um colaborador acima para criar seu Plano de Desenvolvimento Individual
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPlan;