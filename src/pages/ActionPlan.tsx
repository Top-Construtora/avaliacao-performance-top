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
  MessageSquare,
  Download,
  FileSpreadsheet,
  StickyNote,
  FileDown,
  Grid3x3,
  Star,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
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
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}

// Componente principal do PDI
const ActionPlan = () => {
  const navigate = useNavigate();
  const { employees, getNineBoxByEmployeeId, savePDI } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['curtosPrazos']));
  const [planData, setPlanData] = useState<ActionPlanData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: '',
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const employeeNineBox = getNineBoxByEmployeeId(selectedEmployeeId);

  useEffect(() => {
    if (selectedEmployee) {
      setPlanData(prev => ({
        ...prev,
        colaboradorId: selectedEmployee.id,
        colaborador: selectedEmployee.name,
        cargo: selectedEmployee.position,
        departamento: selectedEmployee.department,
        periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        nineBoxQuadrante: employeeNineBox?.quadrant,
        nineBoxDescricao: getQuadrantDescription(employeeNineBox?.quadrant)
      }));
    }
  }, [selectedEmployee, employeeNineBox]);

  const getQuadrantDescription = (quadrant?: string) => {
    const descriptions: Record<string, string> = {
      'A1': 'Alto Potencial - Alto Desempenho',
      'A2': 'Alto Potencial - Médio Desempenho',
      'A3': 'Alto Potencial - Baixo Desempenho',
      'B1': 'Médio Potencial - Alto Desempenho',
      'B2': 'Médio Potencial - Médio Desempenho',
      'B3': 'Médio Potencial - Baixo Desempenho',
      'C1': 'Baixo Potencial - Alto Desempenho',
      'C2': 'Baixo Potencial - Médio Desempenho',
      'C3': 'Baixo Potencial - Baixo Desempenho'
    };
    return quadrant ? descriptions[quadrant] || 'Não avaliado' : 'Não avaliado';
  };

  const getQuadrantColor = (quadrant?: string) => {
    if (!quadrant) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    
    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'A2': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      'A3': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'B1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'B2': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      'B3': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'C1': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'C2': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      'C3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    
    return colors[quadrant] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

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

    const pdiToSave = {
      ...planData,
      id: planData.id || Date.now().toString(),
      dataCriacao: planData.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    savePDI(pdiToSave);
    toast.success('Plano de Desenvolvimento salvo com sucesso!');
    navigate('/pdis');
  };

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '0-6 meses',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      description: 'Ações imediatas e de rápido impacto'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '6-12 meses',
      icon: Target,
      gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      description: 'Desenvolvimento contínuo e estruturado'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '12-24 meses',
      icon: Rocket,
      gradient: 'from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      description: 'Visão estratégica e crescimento sustentável'
    }
  ];

  const statusOptions = [
    { value: '1', label: 'Não iniciado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600' },
    { value: '2', label: 'Iniciado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
    { value: '3', label: 'Em andamento', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' },
    { value: '4', label: 'Quase concluído', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
    { value: '5', label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' }
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
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <button
          onClick={() => toggleSection(category)}
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${categoryData.bgColor} border-b ${categoryData.borderColor} hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${categoryData.iconBg} shadow-md`}>
                <categoryData.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100">{categoryData.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">{categoryData.subtitle} • {categoryData.description}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:hidden">{categoryData.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">{items.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">itens</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
              className="p-4 sm:p-6 lg:p-8"
            >
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">Nenhum item de desenvolvimento adicionado</p>
                    <Button
                      variant="outline"
                      onClick={() => addActionItem(category)}
                      icon={<Plus size={16} />}
                      size="sm"
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
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-600"
                      >
                        {/* Header do Item */}
                        <div className="flex items-start justify-between mb-4 sm:mb-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${categoryData.iconBg} flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md`}>
                              {itemIndex + 1}
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Item de Desenvolvimento
                              </h4>
                              <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium border ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeActionItem(category, item.id)}
                            className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          >
                            <X size={16} className="sm:hidden" />
                            <X size={20} className="hidden sm:block" />
                          </button>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          {/* Competência a desenvolver */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Competência a desenvolver
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                              value={item.competencia}
                              onChange={(e) => updateActionItem(category, item.id, 'competencia', e.target.value)}
                            />
                          </div>

                          {/* Calendarização */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                              Calendarização
                            </label>
                            <input
                              type="month"
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              value={item.calendarizacao}
                              onChange={(e) => updateActionItem(category, item.id, 'calendarizacao', e.target.value)}
                            />
                          </div>

                          {/* Como desenvolver as competências */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Lightbulb className="h-4 w-4 mr-2 text-accent-600 dark:text-accent-400" />
                              Como desenvolver as competências
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-accent-500 dark:focus:border-accent-400 focus:ring-accent-500 dark:focus:ring-accent-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                              value={item.comoDesenvolver}
                              onChange={(e) => updateActionItem(category, item.id, 'comoDesenvolver', e.target.value)}
                            />
                          </div>

                          {/* Resultados Esperados */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Resultados Esperados
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                              value={item.resultadosEsperados}
                              onChange={(e) => updateActionItem(category, item.id, 'resultadosEsperados', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                            {/* Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                Status
                              </label>
                              <select
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                                Observação
                              </label>
                              <textarea
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                                rows={2}
                                placeholder="Observações adicionais..."
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
                        size="sm"
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center flex-wrap">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 dark:text-accent-400 mr-2 sm:mr-3" />
                <span className="break-words">Plano de Desenvolvimento Individual</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Estruture o crescimento e desenvolvimento do colaborador</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center sm:justify-end space-x-3">
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Progresso Geral</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{Math.round(progress)}%</p>
            </div>
            <div className="relative">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="3" fill="none" className="sm:hidden dark:stroke-gray-700" />
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" className="hidden sm:block dark:stroke-gray-700" />
                <circle
                  cx="24" cy="24" r="20"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${progress * 1.26} 126`}
                  strokeLinecap="round"
                  className="sm:hidden"
                />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.76} 176`}
                  strokeLinecap="round"
                  className="hidden sm:block"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colaborador
            </label>
            <select
              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                  Cargo
                </label>
                <div className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  {planData.cargo}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                  Departamento
                </label>
                <div className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 dark:text-gray-300 text-sm sm:text-base break-words">
                  {planData.departamento}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                  Período
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                  value={planData.periodo}
                  onChange={(e) => setPlanData(prev => ({ ...prev, periodo: e.target.value }))}
                  placeholder="Ex: 2024-2025"
                />
              </div>
            </>
          )}
        </div>

        {/* Nine Box Result */}
        {selectedEmployee && employeeNineBox && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <Grid3x3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resultado Nine Box</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuadrantColor(planData.nineBoxQuadrante)}`}>
                    {planData.nineBoxQuadrante}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {planData.nineBoxDescricao}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Itens de Desenvolvimento */}
      {selectedEmployeeId && (
        <div className="space-y-4 sm:space-y-6">
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
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-2 text-sm order-2 sm:order-1">
              {planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length === 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Adicione pelo menos um item de desenvolvimento
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    PDI pronto para ser salvo!
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={() => navigate('/pdis')}
                size="md"
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSave}
                icon={<Save size={18} />}
                size="md"
                disabled={planData.curtosPrazos.length + planData.mediosPrazos.length + planData.longosPrazos.length === 0}
                className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 w-full sm:w-auto"
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
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12 lg:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 mb-4 sm:mb-6">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum colaborador selecionado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              Selecione um colaborador acima para criar seu Plano de Desenvolvimento Individual
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Página de listagem de PDIs
export const PDIList = () => {
  const navigate = useNavigate();
  const { employees, pdis, deletePDI } = useEvaluation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPDI, setSelectedPDI] = useState<ActionPlanData | null>(null);

  const getEmployeeInfo = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const calculateProgress = (pdi: ActionPlanData) => {
    const allItems = [...pdi.curtosPrazos, ...pdi.mediosPrazos, ...pdi.longosPrazos];
    if (allItems.length === 0) return 0;
    
    const completedItems = allItems.filter(item => item.status === '5').length;
    return Math.round((completedItems / allItems.length) * 100);
  };

  const getStatusSummary = (pdi: ActionPlanData) => {
    const allItems = [...pdi.curtosPrazos, ...pdi.mediosPrazos, ...pdi.longosPrazos];
    const statusCounts = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };
    
    allItems.forEach(item => {
      statusCounts[item.status]++;
    });
    
    return statusCounts;
  };

  const filteredPDIs = pdis.filter(pdi => {
    const employee = getEmployeeInfo(pdi.colaboradorId);
    const matchesSearch = pdi.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pdi.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pdi.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const progress = calculateProgress(pdi);
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'completed' && progress === 100) ||
                         (filterStatus === 'in-progress' && progress > 0 && progress < 100) ||
                         (filterStatus === 'not-started' && progress === 0);
    
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (pdiId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este PDI?')) {
      deletePDI(pdiId);
      toast.success('PDI excluído com sucesso!');
    }
  };

  const handleView = (pdi: ActionPlanData) => {
    setSelectedPDI(pdi);
  };

  const statusOptions = [
    { value: '1', label: 'Não iniciado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    { value: '2', label: 'Iniciado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    { value: '3', label: 'Em andamento', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    { value: '4', label: 'Quase concluído', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
    { value: '5', label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <FileText className="h-7 w-7 text-accent-500 dark:text-accent-400 mr-3" />
              Planos de Desenvolvimento Individual
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os PDIs dos colaboradores
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/action-plan')}
            icon={<Plus size={18} />}
          >
            Novo PDI
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou departamento..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="not-started">Não iniciado</option>
              <option value="in-progress">Em progresso</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Lista de PDIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPDIs.map((pdi, index) => {
          const progress = calculateProgress(pdi);
          const statusSummary = getStatusSummary(pdi);
          const totalItems = pdi.curtosPrazos.length + pdi.mediosPrazos.length + pdi.longosPrazos.length;

          return (
            <motion.div
              key={pdi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {pdi.colaborador}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {pdi.cargo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {pdi.departamento}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(pdi)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/action-plan/${pdi.id}`)}
                      className="p-2 text-gray-400 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded-lg transition-all duration-200"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pdi.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Nine Box */}
                {pdi.nineBoxQuadrante && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Grid3x3 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Nine Box:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getQuadrantColor(pdi.nineBoxQuadrante)}`}>
                        {pdi.nineBoxQuadrante}
                      </span>
                    </div>
                  </div>
                )}

                {/* Período */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Período: {pdi.periodo}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progresso Geral
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Curto</p>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {pdi.curtosPrazos.length}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Médio</p>
                    <p className="text-lg font-bold text-secondary-600 dark:text-secondary-400">
                      {pdi.mediosPrazos.length}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Longo</p>
                    <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                      {pdi.longosPrazos.length}
                    </p>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="space-y-1">
                  {Object.entries(statusSummary).map(([status, count]) => {
                    if (count === 0) return null;
                    const statusInfo = statusOptions.find(s => s.value === status);
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {count} {count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Data de criação */}
                {pdi.dataCriacao && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Criado em: {new Date(pdi.dataCriacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPDIs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
              <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhum PDI encontrado' : 'Nenhum PDI cadastrado'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie o primeiro Plano de Desenvolvimento Individual'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                variant="primary"
                onClick={() => navigate('/action-plan')}
                icon={<Plus size={18} />}
              >
                Criar Primeiro PDI
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal de Visualização */}
      <AnimatePresence>
        {selectedPDI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPDI(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    PDI - {selectedPDI.colaborador}
                  </h2>
                  <button
                    onClick={() => setSelectedPDI(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informações do Colaborador */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cargo</p>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{selectedPDI.cargo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Departamento</p>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{selectedPDI.departamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{selectedPDI.periodo}</p>
                  </div>
                  {selectedPDI.nineBoxQuadrante && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nine Box</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getQuadrantColor(selectedPDI.nineBoxQuadrante)}`}>
                        {selectedPDI.nineBoxQuadrante} - {selectedPDI.nineBoxDescricao}
                      </span>
                    </div>
                  )}
                </div>

                {/* Itens de Desenvolvimento */}
                {selectedPDI.curtosPrazos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Curto Prazo (0-6 meses)
                    </h3>
                    <div className="space-y-3">
                      {selectedPDI.curtosPrazos.map((item, index) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                            {index + 1}. {item.competencia || 'Competência não definida'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Calendarização:</span> {item.calendarizacao || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Como desenvolver:</span> {item.comoDesenvolver || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Resultados esperados:</span> {item.resultadosEsperados || 'A definir'}</p>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                            {item.observacao && (
                              <p><span className="font-medium text-gray-600 dark:text-gray-400">Observações:</span> {item.observacao}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPDI.mediosPrazos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-secondary-600 dark:text-secondary-400" />
                      Médio Prazo (6-12 meses)
                    </h3>
                    <div className="space-y-3">
                      {selectedPDI.mediosPrazos.map((item, index) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                            {index + 1}. {item.competencia || 'Competência não definida'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Calendarização:</span> {item.calendarizacao || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Como desenvolver:</span> {item.comoDesenvolver || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Resultados esperados:</span> {item.resultadosEsperados || 'A definir'}</p>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                            {item.observacao && (
                              <p><span className="font-medium text-gray-600 dark:text-gray-400">Observações:</span> {item.observacao}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPDI.longosPrazos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                      <Rocket className="h-5 w-5 mr-2 text-accent-600 dark:text-accent-400" />
                      Longo Prazo (12-24 meses)
                    </h3>
                    <div className="space-y-3">
                      {selectedPDI.longosPrazos.map((item, index) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                            {index + 1}. {item.competencia || 'Competência não definida'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Calendarização:</span> {item.calendarizacao || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Como desenvolver:</span> {item.comoDesenvolver || 'A definir'}</p>
                            <p><span className="font-medium text-gray-600 dark:text-gray-400">Resultados esperados:</span> {item.resultadosEsperados || 'A definir'}</p>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                            {item.observacao && (
                              <p><span className="font-medium text-gray-600 dark:text-gray-400">Observações:</span> {item.observacao}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Função auxiliar para obter a cor do quadrante
const getQuadrantColor = (quadrant?: string) => {
  if (!quadrant) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  
  const colors: Record<string, string> = {
    'A1': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'A2': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    'A3': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'B1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'B2': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    'B3': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'C1': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'C2': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    'C3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };
  
  return colors[quadrant] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

export default ActionPlan;