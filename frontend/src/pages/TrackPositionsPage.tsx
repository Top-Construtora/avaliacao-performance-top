import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, Save, X, DollarSign,
  Briefcase, Layers, Hash, Move, ChevronUp, ChevronDown,
  Info, Settings, GitBranch, Building, Target, Percent
} from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../components/RoleGuard';
import { salaryService, CareerTrack, JobPosition, SalaryClass, TrackPosition, SalaryLevel } from '../services/salary.service';
import { departmentsService } from '../services/departments.service';

interface PositionFormData {
  position_id: string;
  class_id: string;
  base_salary: number;
  order_index: number;
  active: boolean;
}

interface NewPositionData {
  name: string;
  code: string;
  description: string;
  is_multifunctional: boolean;
}

interface LevelSalary {
  level_id: string;
  level_name: string;
  percentage: number;
  calculated_salary: number;
}

const TrackPositionsPage = () => {
  const navigate = useNavigate();
  const { trackId } = useParams<{ trackId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dados da trilha
  const [track, setTrack] = useState<CareerTrack | null>(null);
  const [trackPositions, setTrackPositions] = useState<TrackPosition[]>([]);
  
  // Dados auxiliares
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [classes, setClasses] = useState<SalaryClass[]>([]);
  const [levels, setLevels] = useState<SalaryLevel[]>([]);
  const [departmentName, setDepartmentName] = useState<string>('');
  
  // Estados do modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewPositionForm, setShowNewPositionForm] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<TrackPosition | null>(null);
  const [selectedTrackPosition, setSelectedTrackPosition] = useState<TrackPosition | null>(null);
  const [levelSalaries, setLevelSalaries] = useState<LevelSalary[]>([]);
  
  const [formData, setFormData] = useState<PositionFormData>({
    position_id: '',
    class_id: '',
    base_salary: 0,
    order_index: 0,
    active: true
  });
  const [newPositionData, setNewPositionData] = useState<NewPositionData>({
    name: '',
    code: '',
    description: '',
    is_multifunctional: false
  });

  useEffect(() => {
    if (trackId) {
      loadData();
    }
  }, [trackId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados da trilha
      const trackData = await salaryService.getTrackById(trackId!);
      setTrack(trackData);

      // Carregar nome do departamento
      if (trackData.department_id) {
        try {
          const dept = await departmentsService.getDepartmentById(trackData.department_id);
          if (dept) {
            setDepartmentName(dept.name);
          }
        } catch (error) {
          console.error('Erro ao buscar departamento:', error);
        }
      }

      // Carregar posições da trilha
      const positionsData = await salaryService.getPositionsByTrack(trackId!);
      setTrackPositions(positionsData.sort((a, b) => a.order_index - b.order_index));

      // Carregar dados auxiliares
      const [allPositions, allClasses, allLevels] = await Promise.all([
        salaryService.getPositions(),
        salaryService.getClasses(),
        salaryService.getLevels()
      ]);

      setPositions(allPositions.filter(p => p.active));
      setClasses(allClasses.filter(c => c.active).sort((a, b) => a.order_index - b.order_index));
      setLevels(allLevels.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da trilha');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = () => {
    const nextIndex = trackPositions.length > 0 
      ? Math.max(...trackPositions.map(p => p.order_index)) + 1 
      : 0;

    setFormData({
      position_id: '',
      class_id: '',
      base_salary: 0,
      order_index: nextIndex,
      active: true
    });
    setNewPositionData({
      name: '',
      code: '',
      description: '',
      is_multifunctional: false
    });
    setSelectedPosition(null);
    setShowNewPositionForm(false);
    setShowAddModal(true);
  };

  const handleEditPosition = (position: TrackPosition) => {
    setSelectedPosition(position);
    setFormData({
      position_id: position.position_id,
      class_id: position.class_id,
      base_salary: position.base_salary,
      order_index: position.order_index,
      active: position.active
    });
    setShowEditModal(true);
  };

  const handleViewLevels = (trackPosition: TrackPosition) => {
    setSelectedTrackPosition(trackPosition);
    
    // Calcular salários para cada nível
    const calculatedLevels = levels.map(level => ({
      level_id: level.id,
      level_name: level.name,
      percentage: level.percentage,
      calculated_salary: trackPosition.base_salary * (1 + level.percentage / 100)
    }));
    
    setLevelSalaries(calculatedLevels);
    setShowLevelsModal(true);
  };

  const handleSavePosition = async () => {
    // Se estiver criando um novo cargo
    if (showNewPositionForm) {
      if (!newPositionData.name) {
        toast.error('Digite o nome do cargo');
        return;
      }

      if (!formData.class_id) {
        toast.error('Selecione uma classe salarial');
        return;
      }

      if (formData.base_salary <= 0) {
        toast.error('O salário base deve ser maior que zero');
        return;
      }

      setSaving(true);
      try {
        // Criar o cargo
        const createdPosition = await salaryService.createPosition({
          name: newPositionData.name,
          code: newPositionData.code || newPositionData.name.toUpperCase().replace(/\s+/g, ''),
          description: newPositionData.description,
          is_multifunctional: newPositionData.is_multifunctional,
          active: true
        });

        // Adicionar imediatamente à trilha
        await salaryService.createTrackPosition({
          track_id: trackId,
          position_id: createdPosition.id,
          class_id: formData.class_id,
          base_salary: formData.base_salary,
          order_index: formData.order_index,
          active: formData.active
        });

        toast.success('Cargo criado e adicionado à trilha!');
        setShowAddModal(false);
        setShowNewPositionForm(false);
        loadData();
        return;
      } catch (error: any) {
        console.error('Erro ao criar cargo:', error);
        toast.error('Erro ao criar cargo: ' + (error.response?.data?.error || error.message));
        return;
      } finally {
        setSaving(false);
      }
    }

    // Fluxo normal (cargo existente)
    if (!formData.position_id || !formData.class_id) {
      toast.error('Selecione um cargo e uma classe salarial');
      return;
    }

    if (formData.base_salary <= 0) {
      toast.error('O salário base deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      if (selectedPosition) {
        // Atualizar posição existente
        await salaryService.updateTrackPosition(selectedPosition.id, {
          ...formData,
          track_id: trackId
        });
        toast.success('Cargo atualizado com sucesso!');
      } else {
        // Criar nova posição
        await salaryService.createTrackPosition({
          ...formData,
          track_id: trackId
        });
        toast.success('Cargo adicionado à trilha com sucesso!');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar cargo';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Tem certeza que deseja remover este cargo da trilha?')) return;

    try {
      await salaryService.deleteTrackPosition(positionId);
      toast.success('Cargo removido da trilha');
      loadData();
    } catch (error) {
      console.error('Erro ao remover cargo:', error);
      toast.error('Erro ao remover cargo da trilha');
    }
  };

  const handleReorderPosition = async (positionId: string, direction: 'up' | 'down') => {
    const currentIndex = trackPositions.findIndex(p => p.id === positionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= trackPositions.length) return;

    // Trocar as posições
    const updatedPositions = [...trackPositions];
    const temp = updatedPositions[currentIndex];
    updatedPositions[currentIndex] = updatedPositions[newIndex];
    updatedPositions[newIndex] = temp;

    // Atualizar order_index
    try {
      await Promise.all(
        updatedPositions.map((pos, index) => 
          salaryService.updateTrackPosition(pos.id, { order_index: index })
        )
      );
      
      setTrackPositions(updatedPositions);
      toast.success('Ordem atualizada');
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao atualizar ordem');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Trilha não encontrada</p>
          <Button onClick={() => navigate('/salary/admin')} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['director']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/salary/admin')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                  <GitBranch className="h-7 w-7 text-primary-600" />
                  {track.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {departmentName || 'Departamento não encontrado'}
                  </span>
                </div>
              </div>
              <Button onClick={handleAddPosition} icon={<Plus className="h-4 w-4" />}>
                Adicionar Cargo
              </Button>
            </div>
            {track.description && (
              <p className="text-gray-600 dark:text-gray-400">{track.description}</p>
            )}
          </motion.div>

          {/* Lista de Cargos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-600" />
              Cargos na Trilha
            </h2>

            {trackPositions.length > 0 ? (
              <div className="space-y-3">
                {trackPositions.map((trackPos, index) => {
                  const position = positions.find(p => p.id === trackPos.position_id);
                  const salaryClass = classes.find(c => c.id === trackPos.class_id);
                  
                  return (
                    <motion.div
                      key={trackPos.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Ordem */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleReorderPosition(trackPos.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {index + 1}
                            </span>
                            <button
                              onClick={() => handleReorderPosition(trackPos.id, 'down')}
                              disabled={index === trackPositions.length - 1}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Informações do Cargo */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {position?.name || 'Cargo não encontrado'}
                              </h3>
                              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                                {salaryClass?.code || 'Classe não encontrada'} - {salaryClass?.name}
                              </span>
                              {!trackPos.active && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                Salário Base: {formatCurrency(trackPos.base_salary)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewLevels(trackPos)}
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Ver níveis salariais"
                          >
                            <Layers className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPosition(trackPos)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Editar cargo"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePosition(trackPos.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Remover cargo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Nenhum cargo adicionado a esta trilha ainda.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Clique em "Adicionar Cargo" para começar.
                </p>
              </div>
            )}
          </motion.div>

          {/* Informações Adicionais */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Dicas para configurar a trilha:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Adicione os cargos em ordem hierárquica (do mais júnior ao mais sênior)</li>
                  <li>Defina salários base coerentes com a progressão de carreira</li>
                  <li>Use as classes salariais para agrupar cargos de complexidade similar</li>
                  <li>Clique no ícone de camadas para ver os salários por nível (A-E)</li>
                  <li>Você pode reordenar os cargos usando as setas ao lado do número</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modal de Adicionar/Editar Cargo */}
        <AnimatePresence>
          {(showAddModal || showEditModal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setShowNewPositionForm(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedPosition ? 'Editar Cargo na Trilha' : 'Adicionar Cargo à Trilha'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setShowNewPositionForm(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {!showNewPositionForm ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cargo *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.position_id}
                            onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                            disabled={!!selectedPosition}
                          >
                            <option value="">Selecione um cargo existente</option>
                            {positions.map(pos => (
                              <option key={pos.id} value={pos.id}>
                                {pos.name}
                              </option>
                            ))}
                          </select>
                          {!selectedPosition && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowNewPositionForm(true)}
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Criar Novo
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Ou clique em "Criar Novo" para adicionar um cargo que ainda não existe
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Classe Salarial *
                        </label>
                        <select
                          value={formData.class_id}
                          onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="">Selecione uma classe</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Salário Base (R$) *
                        </label>
                        <input
                          type="number"
                          value={formData.base_salary}
                          onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                          min="0"
                          step="100"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Este é o salário base (nível A). Os demais níveis serão calculados automaticamente.
                        </p>
                      </div>

                      {/* Preview dos níveis */}
                      {formData.base_salary > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preview dos Níveis Salariais:
                          </h4>
                          <div className="space-y-1 text-sm">
                            {levels.map(level => (
                              <div key={level.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Nível {level.name}:</span>
                                <span className="font-medium">
                                  {formatCurrency(formData.base_salary * (1 + level.percentage / 100))}
                                  {level.percentage > 0 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      (+{level.percentage}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cargo ativo
                          </span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-primary-800 dark:text-primary-300 font-medium">
                            Criar novo cargo e adicionar à trilha
                          </p>
                          <button
                            onClick={() => setShowNewPositionForm(false)}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome do Cargo *
                        </label>
                        <input
                          type="text"
                          value={newPositionData.name}
                          onChange={(e) => setNewPositionData({ ...newPositionData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Ex: Analista de Sistemas"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={newPositionData.description}
                          onChange={(e) => setNewPositionData({ ...newPositionData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                          rows={2}
                          placeholder="Descrição do cargo"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newPositionData.is_multifunctional}
                            onChange={(e) => setNewPositionData({ ...newPositionData, is_multifunctional: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cargo multifuncional
                          </span>
                        </label>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Configuração na Trilha
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Classe Salarial *
                            </label>
                            <select
                              value={formData.class_id}
                              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                            >
                              <option value="">Selecione uma classe</option>
                              {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.code} - {cls.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Salário Base (R$) *
                            </label>
                            <input
                              type="number"
                              value={formData.base_salary}
                              onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                              min="0"
                              step="100"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Preview dos níveis */}
                          {formData.base_salary > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Preview dos Níveis:
                              </h4>
                              <div className="space-y-1 text-sm">
                                {levels.map(level => (
                                  <div key={level.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Nível {level.name}:</span>
                                    <span className="font-medium">
                                      {formatCurrency(formData.base_salary * (1 + level.percentage / 100))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setShowNewPositionForm(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePosition}
                    disabled={saving || (!showNewPositionForm && (!formData.position_id || !formData.class_id || formData.base_salary <= 0)) || (showNewPositionForm && (!newPositionData.name || !formData.class_id || formData.base_salary <= 0))}
                    icon={<Save className="h-4 w-4" />}
                  >
                    {saving ? 'Salvando...' : (showNewPositionForm ? 'Criar Cargo e Adicionar' : 'Adicionar à Trilha')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Níveis Salariais */}
        <AnimatePresence>
          {showLevelsModal && selectedTrackPosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
              onClick={() => setShowLevelsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Níveis Salariais
                  </h2>
                  <button
                    onClick={() => setShowLevelsModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {positions.find(p => p.id === selectedTrackPosition.position_id)?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {' '}{classes.find(c => c.id === selectedTrackPosition.class_id)?.name}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {levelSalaries.map((levelSalary, index) => (
                      <div
                        key={levelSalary.level_id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border
                          ${index === 0 
                            ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold
                            ${index === 0 
                              ? 'bg-primary-200 text-primary-700 dark:bg-primary-800 dark:text-primary-300' 
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}>
                            {levelSalary.level_name}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              Nível {levelSalary.level_name}
                            </p>
                            {levelSalary.percentage > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                +{levelSalary.percentage}% sobre o base
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(levelSalary.calculated_salary)}
                          </p>
                          {index > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              +{formatCurrency(levelSalary.calculated_salary - selectedTrackPosition.base_salary)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Diferença entre A e E:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          levelSalaries[levelSalaries.length - 1]?.calculated_salary - selectedTrackPosition.base_salary
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowLevelsModal(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
};

export default TrackPositionsPage;