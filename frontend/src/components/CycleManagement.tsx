import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, Play, Lock, Edit, Trash2, Clock, 
  CheckCircle, AlertCircle, Users, BarChart3, FileText,
  ArrowRight, Info, Settings, X, Save, ChevronRight
} from 'lucide-react';
// Date utilities
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};
import toast from 'react-hot-toast';
import { useEvaluation } from '../hooks/useEvaluation';
import { useUserRole } from '../context/AuthContext';
import type { EvaluationCycle } from '../types/evaluation.types';

const CycleManagement: React.FC = () => {
  const { cycles, currentCycle, loading, createCycle, openCycle, closeCycle } = useEvaluation();
  const { isDirector } = useUserRole();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  const handleCreateCycle = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (isAfter(new Date(formData.start_date), new Date(formData.end_date))) {
      toast.error('A data de início deve ser anterior à data de término');
      return;
    }

    await createCycle({
      ...formData,
      status: 'draft',
      is_editable: true,
      created_by: '' // Will be filled by the service
    });

    setShowCreateModal(false);
    setFormData({ title: '', description: '', start_date: '', end_date: '' });
  };

  const getCycleStatus = (cycle: EvaluationCycle) => {
    const now = new Date();
    const start = new Date(cycle.start_date);
    const end = new Date(cycle.end_date);

    if (cycle.status === 'closed') {
      return { color: 'bg-gray-100 text-gray-600', icon: Lock, text: 'Encerrado' };
    }
    if (cycle.status === 'draft') {
      return { color: 'bg-yellow-100 text-yellow-700', icon: Edit, text: 'Rascunho' };
    }
    if (isBefore(now, start)) {
      return { color: 'bg-blue-100 text-blue-700', icon: Clock, text: 'Agendado' };
    }
    if (isAfter(now, end)) {
      return { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, text: 'Expirado' };
    }
    return { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Ativo' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calendar className="h-7 w-7 text-primary-500 mr-3" />
              Ciclos de Avaliação
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie os ciclos de avaliação de desempenho
            </p>
          </div>
          
          {isDirector && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Ciclo
            </button>
          )}
        </div>

        {/* Current Cycle Alert */}
        {currentCycle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Ciclo Ativo</h3>
                <p className="text-sm text-blue-700 mt-1">
                  O ciclo "{currentCycle.title}" está atualmente ativo. 
                  Período: {formatDate(currentCycle.start_date)} até {formatDate(currentCycle.end_date)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cycles List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Carregando ciclos...</p>
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum ciclo de avaliação criado</p>
            </div>
          ) : (
            cycles.map((cycle) => {
              const status = getCycleStatus(cycle);
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={cycle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {cycle.title}
                        </h3>
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.text}
                        </span>
                      </div>
                      
                      {cycle.description && (
                        <p className="text-gray-600 text-sm mb-3">{cycle.description}</p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Início: {formatDate(cycle.start_date)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Término: {formatDate(cycle.end_date)}
                        </span>
                      </div>
                    </div>

                    {isDirector && (
                      <div className="flex items-center space-x-2 ml-4">
                        {cycle.status === 'draft' && (
                          <button
                            onClick={() => openCycle(cycle.id)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Abrir ciclo"
                          >
                            <Play className="h-5 w-5" />
                          </button>
                        )}
                        
                        {cycle.status === 'open' && (
                          <>
                            <button
                              onClick={() => window.location.href = `/evaluation-dashboard/${cycle.id}`}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Ver dashboard"
                            >
                              <BarChart3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => closeCycle(cycle.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Encerrar ciclo"
                            >
                              <Lock className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {cycle.status === 'open' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Users className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-700">45</p>
                        <p className="text-xs text-gray-500">Colaboradores</p>
                      </div>
                      <div className="text-center">
                        <FileText className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-700">38</p>
                        <p className="text-xs text-gray-500">Avaliações</p>
                      </div>
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-700">84%</p>
                        <p className="text-xs text-gray-500">Completo</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Novo Ciclo de Avaliação</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Ciclo 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrição opcional do ciclo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCycle}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Criar Ciclo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CycleManagement;