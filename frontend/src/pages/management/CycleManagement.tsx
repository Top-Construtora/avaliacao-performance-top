import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Play, Lock, Edit, Clock,
  CheckCircle, AlertCircle, Users, BarChart3,
  Info, X, Save,
  CalendarDays, Timer,
  RefreshCw, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useUserRole } from '../../context/AuthContext';
import type { EvaluationCycle } from '../../types/evaluation.types';
import Button from '../../components/Button';

const CycleManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isDirector, isAdmin } = useUserRole();
  const {
    cycles,
    currentCycle,
    loading,
    cyclesLoading,
    createCycle,
    openCycle,
    closeCycle,
    loadAllCycles,
  } = useEvaluation();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [cycleToClose, setCycleToClose] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  // Check if user has permission (admin or director)
  const hasPermission = isAdmin || isDirector;

  useEffect(() => {
    if (!hasPermission) {
      toast.error('Acesso restrito a administradores e diretores');
      // Não redireciona automaticamente, apenas mostra a mensagem
    }
  }, [hasPermission]);

  // Load cycles on mount
  useEffect(() => {
    if (hasPermission) {
      console.log('Chamando loadAllCycles...');
      loadAllCycles();
    }
  }, [hasPermission]); // Adicionar hasPermission como dependência

  // Calculate cycle statistics
  const handleCreateCycle = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate >= endDate) {
      toast.error('A data de início deve ser anterior à data de término');
      return;
    }

    setIsCreating(true);
    try {
      await createCycle({
        ...formData,
        status: 'draft',
        is_editable: true,
        created_by: '' // Will be filled by the service
      });

      setShowCreateModal(false);
      setFormData({ title: '', description: '', start_date: '', end_date: '' });
      toast.success('Ciclo criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar ciclo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenCycle = async (cycleId: string) => {
    const result = await toast.promise(
      openCycle(cycleId),
      {
        loading: 'Abrindo ciclo...',
        success: 'Ciclo aberto com sucesso!',
        error: 'Erro ao abrir ciclo'
      }
    );
  };

  const handleCloseCycle = (cycleId: string) => {
    setCycleToClose(cycleId);
    setShowCloseConfirm(true);
  };

  const confirmCloseCycle = async () => {
    if (!cycleToClose) return;
    setShowCloseConfirm(false);

    await toast.promise(
      closeCycle(cycleToClose),
      {
        loading: 'Encerrando ciclo...',
        success: 'Ciclo encerrado com sucesso!',
        error: 'Erro ao encerrar ciclo'
      }
    );

    setCycleToClose(null);
  };

  const getCycleStatus = (cycle: EvaluationCycle) => {
    const now = new Date();
    const start = new Date(cycle.start_date);
    const end = new Date(cycle.end_date);

    if (cycle.status === 'closed') {
      return { 
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', 
        icon: Lock, 
        text: 'Encerrado',
        dotColor: 'bg-gray-400'
      };
    }
    if (cycle.status === 'draft') {
      return { 
        color: 'bg-stone-100 text-stone-700 dark:bg-stone-900/20 dark:text-stone-600', 
        icon: Edit, 
        text: 'Rascunho',
        dotColor: 'bg-stone-500'
      };
    }
    if (now < start) {
      return { 
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', 
        icon: Clock, 
        text: 'Agendado',
        dotColor: 'bg-blue-400'
      };
    }
    if (now > end) {
      return { 
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', 
        icon: AlertCircle, 
        text: 'Expirado',
        dotColor: 'bg-orange-400'
      };
    }
    return { 
      color: 'bg-primary-100 text-primary-700 dark:bg-primary-600/20 dark:text-primary-400',
      icon: CheckCircle,
      text: 'Ativo',
      dotColor: 'bg-primary-400'
    };
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysRemaining = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter cycles
  const filteredCycles = cycles.filter(cycle => {
    const matchesSearch = cycle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cycle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getCycleStatus(cycle);
    if (filterStatus === 'active' && status.text === 'Ativo') return matchesSearch;
    if (filterStatus === 'draft' && status.text === 'Rascunho') return matchesSearch;
    if (filterStatus === 'closed' && status.text === 'Encerrado') return matchesSearch;
    
    return false;
  });

  // Se o usuário não tiver permissão, mostra mensagem apropriada
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Esta página está disponível apenas para administradores e diretores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Calendar className="h-7 w-7 text-primary dark:text-primary-600 mr-3" />
              Gerenciamento de Ciclos de Avaliação
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Controle completo sobre os ciclos de avaliação de performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={() => loadAllCycles()}
              icon={<RefreshCw className={`h-5 w-5 ${cyclesLoading ? 'animate-spin' : ''}`} />}
              disabled={cyclesLoading}
            >
              Atualizar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="h-5 w-5" />}
            >
              Novo Ciclo
            </Button>
          </div>
        </div>

        {/* Current Cycle Alert */}
        {currentCycle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Ciclo Ativo: {currentCycle.title}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Período: {formatDate(currentCycle.start_date)} até {formatDate(currentCycle.end_date)}
                  {getDaysRemaining(currentCycle.end_date) > 0 && (
                    <span className="ml-2 font-medium">
                      • {getDaysRemaining(currentCycle.end_date)} dias restantes
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-700 dark:text-primary-400 text-sm font-medium">Total de Ciclos</p>
                <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">{cycles.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-800 dark:text-primary-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Ciclos Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {cycles.filter(c => getCycleStatus(c).text === 'Ativo').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500 dark:text-gray-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-700 dark:text-stone-400 text-sm font-medium">Rascunhos</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {cycles.filter(c => c.status === 'draft').length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-stone-600 dark:text-stone-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Encerrados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {cycles.filter(c => c.status === 'closed').length}
                </p>
              </div>
              <Lock className="h-8 w-8 text-gray-500 dark:text-gray-400 opacity-50" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cycles List */}
      <div className="space-y-4">
        {cyclesLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 dark:border-primary-700 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Carregando ciclos...</p>
            </div>
          </div>
        ) : filteredCycles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Nenhum ciclo encontrado com os filtros aplicados' 
                  : 'Nenhum ciclo de avaliação criado'}
              </p>
            </div>
          </div>
        ) : (
          filteredCycles.map((cycle) => {
            const status = getCycleStatus(cycle);
            const StatusIcon = status.icon;
            const daysRemaining = getDaysRemaining(cycle.end_date);
            
            return (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`w-2 h-2 rounded-full ${status.dotColor} mr-3`} />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {cycle.title}
                      </h3>
                      <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.text}
                      </span>
                    </div>
                    
                    {cycle.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{cycle.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                      <span className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        Início: {formatDate(cycle.start_date)}
                      </span>
                      <span className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        Término: {formatDate(cycle.end_date)}
                      </span>
                      {cycle.status === 'open' && daysRemaining > 0 && (
                        <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                          <Timer className="h-4 w-4 mr-1" />
                          {daysRemaining} dias restantes
                        </span>
                      )}
                      {cycle.status === 'open' && daysRemaining <= 0 && (
                        <span className="flex items-center text-orange-600 dark:text-orange-400 font-medium">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Prazo expirado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* Action buttons based on status */}
                    {cycle.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCycle(cycle.id)}
                          icon={<Play className="h-4 w-4" />}
                        >
                          Abrir
                        </Button>
                        <button
                          onClick={() => {
                            setSelectedCycle(cycle);
                            setFormData({
                              title: cycle.title,
                              description: cycle.description || '',
                              start_date: cycle.start_date,
                              end_date: cycle.end_date
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar ciclo"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {cycle.status === 'open' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/evaluation-dashboard/${cycle.id}`)}
                          icon={<BarChart3 className="h-4 w-4" />}
                        >
                          Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseCycle(cycle.id)}
                          icon={<Lock className="h-4 w-4" />}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Encerrar
                        </Button>
                      </>
                    )}

                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {selectedCycle ? 'Editar Ciclo' : 'Novo Ciclo de Avaliação'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCycle(null);
                    setFormData({ title: '', description: '', start_date: '', end_date: '' });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                    placeholder="Ex: Ciclo 2024 - Primeiro Semestre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                    rows={3}
                    placeholder="Descrição opcional do ciclo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-1">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-naue-black dark:text-gray-300 font-medium mb-1">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-800 dark:focus:ring-primary-700 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Sobre as datas:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• O ciclo será aberto automaticamente na data de início</li>
                        <li>• Após a data de término, o ciclo deve ser encerrado manualmente</li>
                        <li>• Ciclos encerrados não podem ser reabertos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCycle(null);
                    setFormData({ title: '', description: '', start_date: '', end_date: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCycle}
                  disabled={isCreating || loading}
                  icon={<Save className="h-4 w-4" />}
                >
                  {isCreating ? 'Salvando...' : selectedCycle ? 'Salvar Alterações' : 'Criar Ciclo'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Close Modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Encerrar Ciclo
                </h2>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja encerrar este ciclo? Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCloseConfirm(false);
                    setCycleToClose(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={confirmCloseCycle}
                  className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                  icon={<Lock className="h-4 w-4" />}
                >
                  Encerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CycleManagement;