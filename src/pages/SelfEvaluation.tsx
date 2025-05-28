import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  LucideIcon
} from 'lucide-react';
import Button from '../components/Button';

interface SelfEvaluationData {
  conhecimentos: string[];
  ferramentas: string[];
  forcasInternas: string[];
  qualidades: string[];
}

interface Section {
  id: keyof SelfEvaluationData;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  items: string[];
}

const SelfEvaluation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SelfEvaluationData>({
    conhecimentos: [''],
    ferramentas: [''],
    forcasInternas: [''],
    qualidades: ['']
  });

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
  };

  const handleSave = (): void => {
    // Validar se pelo menos um campo de cada seção está preenchido
    const hasEmptySections = Object.entries(formData).some(([key, values]) => 
      values.every((value: string) => value.trim() === '')
    );

    if (hasEmptySections) {
      toast.error('Preencha pelo menos um item em cada seção');
      return;
    }

    // Filtrar campos vazios
    const cleanedData = Object.entries(formData).reduce((acc, [key, values]) => {
      acc[key as keyof SelfEvaluationData] = values.filter((value: string) => value.trim() !== '');
      return acc;
    }, {} as SelfEvaluationData);

    // Salvar dados (aqui você integraria com sua API)
    console.log('Autoavaliação salva:', cleanedData);
    toast.success('Autoavaliação salva com sucesso!');
    navigate('/');
  };

  const sections: Section[] = [
    {
      id: 'conhecimentos' as keyof SelfEvaluationData,
      title: 'Conhecimentos',
      subtitle: 'Sei fazer sobre:',
      icon: Brain,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      items: formData.conhecimentos
    },
    {
      id: 'ferramentas' as keyof SelfEvaluationData,
      title: 'Ferramentas',
      subtitle: 'Sei usar:',
      icon: Wrench,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      items: formData.ferramentas
    },
    {
      id: 'forcasInternas' as keyof SelfEvaluationData,
      title: 'Forças Internas',
      subtitle: 'Sou resiliente:',
      icon: Heart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      items: formData.forcasInternas
    },
    {
      id: 'qualidades' as keyof SelfEvaluationData,
      title: 'Qualidades',
      subtitle: 'Tenho para oferecer:',
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      items: formData.qualidades
    }
  ];

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Toolkit</h1>
              <p className="text-gray-600">Preencha suas competências e habilidades</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Voltar
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {sections.map((section: Section) => {
          const IconComponent = section.icon;
          return (
            <motion.div
              key={section.id}
              variants={itemVariants}
              className={`${section.bgColor} rounded-lg border ${section.borderColor} overflow-hidden`}
            >
              {/* Section Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-600">{section.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <div className="space-y-3">
                  {section.items.map((item: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(section.id, index, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`${section.title} ${index + 1}`}
                        />
                      </div>
                      {section.items.length > 1 && (
                        <button
                          onClick={() => removeField(section.id, index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remover item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add More Button */}
                <div className="mt-4">
                  <button
                    onClick={() => addField(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2 ${section.color} hover:bg-white rounded-lg transition-colors text-sm font-medium`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar mais</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Progress Indicator */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso da Autoavaliação</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section: Section) => {
              const filledItems = section.items.filter((item: string) => item.trim() !== '').length;
              const totalItems = section.items.length;
              const percentage = totalItems > 0 ? (filledItems / totalItems) * 100 : 0;
              
              return (
                <div key={section.id} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full ${section.bgColor} flex items-center justify-center mb-2`}>
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{section.title}</p>
                  <p className="text-xs text-gray-500">{filledItems}/{totalItems} preenchidos</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        section.id === 'conhecimentos' ? 'bg-blue-600' :
                        section.id === 'ferramentas' ? 'bg-green-600' :
                        section.id === 'forcasInternas' ? 'bg-purple-600' :
                        'bg-orange-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex justify-end space-x-4 pt-6"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save size={16} />}
          >
            Salvar Toolkit
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SelfEvaluation;