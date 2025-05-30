import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendingUp,
  Briefcase,
  AlertCircle,
  Sparkles,
  Rocket,
  Users,
  ChevronDown,
  ChevronUp,
  ListChecks,
  MessageSquare
} from 'lucide-react';

interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface ActionPlanData {
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
}

const ActionPlan = () => {
  const navigate = useNavigate();
  const { employees } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['curtosPrazos']));
  const [planData, setPlanData] = useState<ActionPlanData>({
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: '',
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const createNewActionItem = (): ActionItem => ({
    id: Date.now().toString(),
    competencia: '',
    calendarizacao: '',
    comoDesenvolver: '',
    resultadosEsperados: '',
    status: '1',
    observacao: ''
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

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Selecione um colaborador');
      return;
    }

    const totalItems = planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length;
    if (totalItems === 0) {
      toast.error('Adicione pelo menos um item de desenvolvimento');
      return;
    }

    toast.success('Plano de Desenvolvimento salvo com sucesso!');
    navigate('/reports');
  };

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '0-6 meses',
      icon: Rocket,
      gradient: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      description: 'Ações imediatas e de rápido impacto'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '6-12 meses',
      icon: Target,
      gradient: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
      description: 'Desenvolvimento contínuo e estruturado'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '12-24 meses',
      icon: TrendingUp,
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600',
      description: 'Visão estratégica e crescimento sustentável'
    }
  ];

  const statusOptions = [
    { value: '1', label: '1 - Não iniciado', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: '2', label: '2 - Iniciado', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: '3', label: '3 - Em andamento', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: '4', label: '4 - Quase concluído', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: '5', label: '5 - Concluído', color: 'bg-green-100 text-green-700 border-green-300' }
  ];

  const getProgress = () => {
    const allItems = [...planData.curtosPrazos, ...planData.mediosPrazos, ...planData.longosPrazos];
    if (allItems.length === 0) return 0;
    
    const completedItems = allItems.filter(item => item.status === '5').length;
    return (completedItems / allItems.length) * 100;
  };

  const renderActionItems = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const categoryData = categories.find(cat => cat.key === category)!;
    const items = planData[category];
    const isExpanded = expandedSections.has(category);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <button
          onClick={() => toggleSection(category)}
          className={`w-full px-8 py-6 ${categoryData.bgColor} border-b ${categoryData.borderColor} hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${categoryData.iconBg} shadow-md`}>
                <categoryData.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">{categoryData.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{categoryData.subtitle} • {categoryData.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{items.length}</p>
                <p className="text-xs text-gray-600">itens</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Nenhum item de desenvolvimento adicionado</p>
                    <Button
                      variant="outline"
                      onClick={() => addActionItem(category)}
                      icon={<Plus size={16} />}
                    >
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <>
                    {items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                      >
                        {/* Header do Item */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl ${categoryData.iconBg} flex items-center justify-center text-white font-bold shadow-md`}>
                              {itemIndex + 1}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">
                                Item de Desenvolvimento
                              </h4>
                              <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium border ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeActionItem(category, item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Competência a desenvolver */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-2 text-primary-600" />
                              Competência a desenvolver
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                              placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                              value={item.competencia}
                              onChange={(e) => updateActionItem(category, item.id, 'competencia', e.target.value)}
                            />
                          </div>

                          {/* Calendarização */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-secondary-600" />
                              Calendarização
                            </label>
                            <input
                              type="month"
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 transition-all duration-200"
                              value={item.calendarizacao}
                              onChange={(e) => updateActionItem(category, item.id, 'calendarizacao', e.target.value)}
                            />
                          </div>

                          {/* Como desenvolver as competências */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Sparkles className="h-4 w-4 mr-2 text-accent-600" />
                              Como desenvolver as competências
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-accent-500 focus:ring-accent-500 transition-all duration-200"
                              rows={4}
                              placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                              value={item.comoDesenvolver}
                              onChange={(e) => updateActionItem(category, item.id, 'comoDesenvolver', e.target.value)}
                            />
                          </div>

                          {/* Resultados Esperados */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <ListChecks className="h-4 w-4 mr-2 text-primary-600" />
                              Resultados Esperados
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                              rows={4}
                              placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                              value={item.resultadosEsperados}
                              onChange={(e) => updateActionItem(category, item.id, 'resultadosEsperados', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            {/* Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Status
                              </label>
                              <select
                                className="w-full rounded-lg border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                                value={item.status}
                                onChange={(e) => updateActionItem(category, item.id, 'status', e.target.value as any)}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Observação */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-secondary-600" />
                                Observação
                              </label>
                              <textarea
                                className="w-full rounded-lg border-gray-200 shadow-sm focus:border-secondary-500 focus:ring-secondary-500 transition-all duration-200"
                                rows={3}
                                placeholder="Observações..."
                                value={item.observacao}
                                onChange={(e) => updateActionItem(category, item.id, 'observacao', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => addActionItem(category)}
                        icon={<Plus size={16} />}
                        className="border-2 border-dashed hover:border-solid"
                      >
                        Adicionar Novo Item
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const progress = getProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Plano de Desenvolvimento Individual
              </h1>
              <p className="text-gray-600 mt-1">Estruture o crescimento e desenvolvimento do colaborador</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Progresso Geral</p>
              <p className="text-lg font-bold text-gray-800">{Math.round(progress)}%</p>
            </div>
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#12b0a0" />
                    <stop offset="50%" stopColor="#1e6076" />
                    <stop offset="100%" stopColor="#baa673" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Seleção do colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colaborador
            </label>
            <select
              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  Cargo
                </label>
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700">
                  {planData.cargo}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  Departamento
                </label>
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700">
                  {planData.departamento}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                  Período
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                  value={planData.periodo}
                  onChange={(e) => setPlanData(prev => ({ ...prev, periodo: e.target.value }))}
                  placeholder="Ex: 2024-2025"
                />
              </div>
            </>
          )}
        </div>
      </motion.div>      

      {/* Itens de Desenvolvimento */}
      {selectedEmployeeId && (
        <div className="space-y-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {renderActionItems(category.key)}
            </motion.div>
          ))}

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center space-x-2 text-sm">
              {planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length === 0 ? (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-gray-600">
                    Adicione pelo menos um item de desenvolvimento
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    PDI pronto para ser salvo!
                  </span>
                </>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/reports')}
                size="lg"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                icon={<Save size={18} />}
                size="lg"
                disabled={planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length === 0}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                Salvar PDI
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 mb-6">
              <FileText className="h-10 w-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-gray-500">
              Selecione um colaborador acima para criar seu Plano de Desenvolvimento Individual
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ActionPlan;