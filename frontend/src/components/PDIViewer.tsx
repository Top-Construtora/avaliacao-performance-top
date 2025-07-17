import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Target, Rocket, Calendar, Award, FileText,
  CheckCircle, Clock, AlertCircle, TrendingUp, User,
  Briefcase, Building2, CalendarDays, Edit, Download,
  Share2, History
} from 'lucide-react';
import Button from './Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR'; // Import correto do locale

interface PDIItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao?: string;
}

interface PDIViewerProps {
  pdiData: {
    id?: string;
    colaboradorId: string;
    colaborador: string;
    cargo: string;
    departamento: string;
    periodo: string;
    curtosPrazos: PDIItem[];
    mediosPrazos: PDIItem[];
    longosPrazos: PDIItem[];
    dataCriacao?: string;
    dataAtualizacao?: string;
    nineBoxQuadrante?: string;
    nineBoxDescricao?: string;
  };
  onEdit?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  readOnly?: boolean;
}

const PDIViewer: React.FC<PDIViewerProps> = ({
  pdiData,
  onEdit,
  onExport,
  onShare,
  readOnly = false
}) => {
  const statusOptions = [
    { value: '1', label: 'Não iniciado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Clock },
    { value: '2', label: 'Iniciado', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300', icon: TrendingUp },
    { value: '3', label: 'Em andamento', color: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300', icon: TrendingUp },
    { value: '4', label: 'Quase concluído', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', icon: AlertCircle },
    { value: '5', label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle }
  ];

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '0-6 meses',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-600',
      darkGradient: 'dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50',
      darkBgColor: 'dark:bg-primary-900/20'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '6-12 meses',
      icon: Target,
      gradient: 'from-secondary-500 to-secondary-600',
      darkGradient: 'dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50',
      darkBgColor: 'dark:bg-secondary-900/20'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '12-24 meses',
      icon: Rocket,
      gradient: 'from-accent-500 to-accent-600',
      darkGradient: 'dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50',
      darkBgColor: 'dark:bg-accent-900/20'
    }
  ];

  const calculateProgress = () => {
    const allItems = [
      ...pdiData.curtosPrazos,
      ...pdiData.mediosPrazos,
      ...pdiData.longosPrazos
    ];

    if (allItems.length === 0) return { total: 0, completed: 0, percentage: 0 };

    const completed = allItems.filter(item => item.status === '5').length;
    const percentage = (completed / allItems.length) * 100;

    return { total: allItems.length, completed, percentage };
  };

  const progress = calculateProgress();

  const renderPDIItems = (items: PDIItem[], category: typeof categories[0]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <category.icon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum item definido para {category.title.toLowerCase()}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item, index) => {
          const status = statusOptions.find(s => s.value === item.status);
          const StatusIcon = status?.icon || Clock;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} ${category.darkGradient} flex items-center justify-center text-white font-bold shadow-md`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {item.competencia}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <StatusIcon className="h-4 w-4" />
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                        {status?.label}
                      </span>
                    </div>
                  </div>
                </div>
                {item.calendarizacao && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(item.calendarizacao + '-01'), 'MMM/yyyy', { locale: ptBR })}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                    Como desenvolver
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                    {item.comoDesenvolver}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Resultados esperados
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                    {item.resultadosEsperados}
                  </p>
                </div>

                {item.observacao && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      {item.observacao}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com informações do colaborador */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 shadow-md">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {pdiData.colaborador}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {pdiData.cargo}
                </span>
                {pdiData.departamento && (
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="h-4 w-4 mr-1" />
                    {pdiData.departamento}
                  </span>
                )}
                {pdiData.periodo && (
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Período: {pdiData.periodo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center space-x-3">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={onEdit}
                  icon={<Edit size={18} />}
                  size="sm"
                >
                  Editar PDI
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  onClick={onExport}
                  icon={<Download size={18} />}
                  size="sm"
                >
                  Exportar
                </Button>
              )}
              {onShare && (
                <Button
                  variant="outline"
                  onClick={onShare}
                  icon={<Share2 size={18} />}
                  size="sm"
                >
                  Compartilhar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso Geral
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress.completed} de {progress.total} itens concluídos
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Timestamps */}
        {(pdiData.dataCriacao || pdiData.dataAtualizacao) && (
          <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {pdiData.dataCriacao && (
              <span className="flex items-center">
                <History className="h-3 w-3 mr-1" />
                Criado em: {format(new Date(pdiData.dataCriacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
            {pdiData.dataAtualizacao && (
              <span className="flex items-center">
                <History className="h-3 w-3 mr-1" />
                Atualizado em: {format(new Date(pdiData.dataAtualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* PDI Items by Category */}
      {categories.map((category, index) => (
        <motion.div
          key={category.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className={`px-6 py-4 ${category.bgColor} ${category.darkBgColor} border-b border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient} ${category.darkGradient} shadow-md`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.subtitle} • {pdiData[category.key].length} {pdiData[category.key].length === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {renderPDIItems(pdiData[category.key], category)}
          </div>
        </motion.div>
      ))}

      {/* Nine Box Information (if available) */}
      {pdiData.nineBoxQuadrante && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-accent-50 to-primary-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-accent-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Posicionamento Nine Box
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quadrante</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {pdiData.nineBoxQuadrante}
              </p>
            </div>
            {pdiData.nineBoxDescricao && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Descrição</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {pdiData.nineBoxDescricao}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PDIViewer;