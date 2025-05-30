import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Brain, 
  Wrench, 
  Heart, 
  Award, 
  Plus, 
  X, 
  Save, 
  User,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle,
  Info,
  Shield,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap
} from 'lucide-react';
import Button from '../components/Button';

interface SelfEvaluationData {
  conhecimentos: string[];
  ferramentas: string[];
  forcasInternas: string[];
  qualidades: string[];
}

interface CompetencyScore {
  [key: string]: number;
}

interface Section {
  id: keyof SelfEvaluationData;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  items: string[];
}

const SelfEvaluation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'toolkit' | 'competencies'>('toolkit');
  const [formData, setFormData] = useState<SelfEvaluationData>({
    conhecimentos: [''],
    ferramentas: [''],
    forcasInternas: [''],
    qualidades: ['']
  });
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['competencias-tecnicas']));
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Competency evaluation data structure
  const competencyCategories = [
    {
      id: 'competencias-tecnicas',
      title: 'Competências Técnicas',
      icon: Target,
      gradient: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      items: [
        { id: 'gestao-conhecimento', name: 'GESTÃO DO CONHECIMENTO', description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes' },
        { id: 'orientacao-resultados', name: 'ORIENTAÇÃO A RESULTADOS COM SEGURANÇA', description: 'Foco em resultados com segurança e qualidade' },
        { id: 'pensamento-critico', name: 'PENSAMENTO CRÍTICO', description: 'Capacidade de analisar criticamente situações e propor soluções' },
        { id: 'assertiva-provedora', name: 'ASSERTIVA E PROVEDORA', description: 'Comunicação assertiva e capacidade de prover soluções' }
      ]
    },
    {
      id: 'competencias-comportamentais',
      title: 'Competências Comportamentais',
      icon: Users,
      gradient: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      items: [
        { id: 'comunicacao', name: 'COMUNICAÇÃO', description: 'Capacidade de se comunicar de forma clara e eficaz' },
        { id: 'inteligencia-emocional', name: 'INTELIGÊNCIA EMOCIONAL', description: 'Capacidade de reconhecer e gerenciar emoções próprias e dos outros' },
        { id: 'delegacao', name: 'DELEGAÇÃO', description: 'Habilidade de delegar tarefas de forma eficaz' },
        { id: 'patrimonialista', name: 'PATRIMONIALISTA', description: 'Cuidado e responsabilidade com os recursos da empresa' }
      ]
    },
    {
      id: 'competencias-organizacionais',
      title: 'Competências Organizacionais',
      icon: Building,
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      items: [
        { id: 'meritocracia-missao', name: 'MERITOCRACIA E MISSÃO COMPARTILHADA', description: 'Comprometimento com meritocracia e missão da empresa' },
        { id: 'espiral-passos', name: 'ESPIRAL DE PASSOS', description: 'Desenvolvimento contínuo e progressão estruturada' },
        { id: 'planilhas-prazos', name: 'PLANILHAS E PRAZOS', description: 'Organização e cumprimento de prazos' },
        { id: 'relacoes-construtivas', name: 'RELAÇÕES CONSTRUTIVAS', description: 'Construção de relacionamentos positivos e produtivos' }
      ]
    }
  ];

  const addField = (section: keyof SelfEvaluationData) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], '']
    }));
  };

  const removeField = (section: keyof SelfEvaluationData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateField = (section: keyof SelfEvaluationData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }));

    // Check if section is completed
    const sectionData = formData[section].map((item, i) => i === index ? value : item);
    const hasValidItems = sectionData.some(item => item.trim() !== '');
    
    if (hasValidItems) {
      setCompletedSections(prev => new Set(prev).add(section));
    } else {
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(section);
        return newSet;
      });
    }
  };

  const handleCompetencyScore = (competencyId: string, score: number) => {
    setCompetencyScores(prev => ({
      ...prev,
      [competencyId]: score
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNextStep = () => {
    const hasEmptySections = Object.entries(formData).some(([key, values]) => 
      values.every((value: string) => value.trim() === '')
    );

    if (hasEmptySections) {
      toast.error('Preencha pelo menos um item em cada seção');
      return;
    }

    setCurrentStep('competencies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (): void => {
    // Check if all competencies are evaluated
    const totalCompetencies = competencyCategories.reduce((sum, category) => sum + category.items.length, 0);
    const evaluatedCompetencies = Object.keys(competencyScores).length;

    if (evaluatedCompetencies < totalCompetencies) {
      toast.error('Avalie todas as competências antes de salvar');
      return;
    }

    const cleanedData = Object.entries(formData).reduce((acc, [key, values]) => {
      acc[key as keyof SelfEvaluationData] = values.filter((value: string) => value.trim() !== '');
      return acc;
    }, {} as SelfEvaluationData);

    console.log('Autoavaliação completa:', {
      toolkit: cleanedData,
      competencies: competencyScores
    });
    
    toast.success('Autoavaliação completa salva com sucesso!');
    navigate('/');
  };

  const sections: Section[] = [
    {
      id: 'conhecimentos',
      title: 'Conhecimentos',
      subtitle: 'Sei falar sobre:',
      icon: Brain,
      gradient: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      items: formData.conhecimentos
    },
    {
      id: 'ferramentas',
      title: 'Ferramentas',
      subtitle: 'Sei usar:',
      icon: Wrench,
      gradient: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
      items: formData.ferramentas
    },
    {
      id: 'forcasInternas',
      title: 'Forças Internas',
      subtitle: 'Me sustentam:',
      icon: Shield,
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600',
      items: formData.forcasInternas
    },
    {
      id: 'qualidades',
      title: 'Qualidades',
      subtitle: 'Tenho para oferecer:',
      icon: Award,
      gradient: 'from-primary-600 to-secondary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-secondary-50',
      borderColor: 'border-primary-200',
      iconBg: 'bg-gradient-to-br from-primary-600 to-secondary-600',
      items: formData.qualidades
    }
  ];

  const toolkitProgress = (completedSections.size / sections.length) * 100;
  const competencyProgress = (Object.keys(competencyScores).length / competencyCategories.reduce((sum, cat) => sum + cat.items.length, 0)) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  const renderToolkitStep = () => (
    <>
      {/* Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {sections.map((section: Section, sectionIndex) => {
          const IconComponent = section.icon;
          const isCompleted = completedSections.has(section.id);
          
          return (
            <motion.div
              key={section.id}
              variants={itemVariants}
              className={`bg-white rounded-2xl shadow-sm border ${isCompleted ? section.borderColor : 'border-gray-100'} overflow-hidden transition-all duration-300`}
            >
              {/* Section Header */}
              <div className={`px-8 py-6 ${isCompleted ? section.bgColor : 'bg-gray-50'} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${section.iconBg} shadow-md`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
                      <p className="text-sm text-gray-600">{section.subtitle}</p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Completo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-8">
                <div className="space-y-3">
                  {section.items.map((item: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={item}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(section.id, index, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                          placeholder={`Digite ${section.title.toLowerCase()} ${index + 1}...`}
                        />
                        {item.trim() && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-3.5"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      {section.items.length > 1 && (
                        <button
                          onClick={() => removeField(section.id, index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add More Button */}
                <button
                  onClick={() => addField(section.id)}
                  className={`mt-4 flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-dashed ${isCompleted ? section.borderColor : 'border-gray-300'} text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-all duration-200 group`}
                >
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="text-sm font-medium">Adicionar mais</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Tips Section */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Info className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Dicas para uma boa autoavaliação</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  Seja específico e honesto sobre suas competências
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  Inclua tanto habilidades técnicas quanto comportamentais
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  Pense em situações reais onde aplicou essas habilidades
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center pt-6"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            size="lg"
          >
            Cancelar
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {completedSections.size === sections.length ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Todas as seções completas!
                </span>
              ) : (
                `${sections.length - completedSections.size} seções pendentes`
              )}
            </span>
            <Button
              variant="primary"
              onClick={handleNextStep}
              icon={<ArrowRight size={18} />}
              size="lg"
              disabled={completedSections.size !== sections.length}
              className="bg-gradient-to-r from-primary-500 to-primary-600"
            >
              Próxima Etapa
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );

  const renderCompetenciesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-6"
    >
      {competencyCategories.map((category, categoryIndex) => {
        const IconComponent = category.icon;
        const isExpanded = expandedSections.has(category.id);
        const categoryProgress = category.items.filter(item => competencyScores[item.id] !== undefined).length / category.items.length * 100;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(category.id)}
              className={`w-full px-8 py-6 ${category.bgColor} border-b ${category.borderColor} flex items-center justify-between hover:opacity-90 transition-all duration-200`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} shadow-md`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-800">{category.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.items.filter(item => competencyScores[item.id] !== undefined).length} de {category.items.length} competências avaliadas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${category.gradient} transition-all duration-300`}
                    style={{ width: `${categoryProgress}%` }}
                  />
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 space-y-6"
                >
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.05 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        {competencyScores[item.id] && (
                          <div className="text-center">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              competencyScores[item.id] >= 4 ? 'bg-green-100 text-green-800' :
                              competencyScores[item.id] >= 3 ? 'bg-primary-100 text-primary-800' :
                              competencyScores[item.id] >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Nota: {competencyScores[item.id]}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        {[1, 2, 3, 4].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleCompetencyScore(item.id, rating)}
                            className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                              competencyScores[item.id] === rating
                                ? `${rating === 4 ? 'bg-green-500' : rating === 3 ? 'bg-primary-500' : rating === 2 ? 'bg-yellow-500' : 'bg-red-500'} text-white border-transparent shadow-lg transform scale-105`
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1">{rating}</div>
                              <div className="text-xs">
                                {rating === 4 ? 'Excepcional' : rating === 3 ? 'Satisfatório' : rating === 2 ? 'Em Desenvolvimento' : 'Insatisfatório'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-between items-center pt-6"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep('toolkit')}
          icon={<ArrowLeft size={18} />}
          size="lg"
        >
          Voltar
        </Button>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {competencyProgress === 100 ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Todas as competências avaliadas!
              </span>
            ) : (
              `${Math.round(competencyProgress)}% completo`
            )}
          </span>
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save size={18} />}
            size="lg"
            disabled={competencyProgress < 100}
            className="bg-gradient-to-r from-primary-500 to-primary-600"
          >
            Salvar Autoavaliação
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
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
                {currentStep === 'toolkit' ? (
                  <>
                    <Sparkles className="h-8 w-8 text-primary-500 mr-3" />
                    Meu Toolkit Profissional
                  </>
                ) : (
                  <>
                    <Zap className="h-8 w-8 text-secondary-500 mr-3" />
                    Autoavaliação de Competências
                  </>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 'toolkit' 
                  ? 'Construa seu perfil de competências e habilidades'
                  : 'Avalie suas competências técnicas, comportamentais e organizacionais'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Progresso</p>
              <p className="text-lg font-bold text-gray-800">
                {Math.round(currentStep === 'toolkit' ? toolkitProgress : competencyProgress)}%
              </p>
            </div>
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(currentStep === 'toolkit' ? toolkitProgress : competencyProgress) * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#12b0a0" />
                    <stop offset="100%" stopColor="#1e6076" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${currentStep === 'toolkit' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'toolkit' ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <span className="font-medium">Toolkit Profissional</span>
          </div>
          
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${currentStep === 'competencies' ? 'w-full bg-primary-500' : 'w-0'}`} />
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${currentStep === 'competencies' ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'competencies' ? 'bg-secondary-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className="font-medium">Competências</span>
          </div>
        </div>

        {/* Quick Stats for Toolkit Step */}
        {currentStep === 'toolkit' && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            {sections.map((section) => {
              const filledItems = section.items.filter(item => item.trim() !== '').length;
              const isCompleted = completedSections.has(section.id);
              
              return (
                <div 
                  key={section.id} 
                  className={`p-4 rounded-xl border ${isCompleted ? section.borderColor : 'border-gray-200'} ${isCompleted ? section.bgColor : 'bg-gray-50'} transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <section.icon className={`h-5 w-5 ${isCompleted ? 'text-gray-700' : 'text-gray-400'}`} />
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-2">{section.title}</p>
                  <p className="text-xs text-gray-500">{filledItems} itens</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Content based on current step */}
      <AnimatePresence mode="wait">
        {currentStep === 'toolkit' ? renderToolkitStep() : renderCompetenciesStep()}
      </AnimatePresence>
    </div>
  );
};

export default SelfEvaluation;