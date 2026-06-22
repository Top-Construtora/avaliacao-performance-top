import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  Briefcase,
  Layers,
  ChevronUp,
  ChevronDown,
  Info,
  GitBranch,
  Building,
  Percent,
} from 'lucide-react';
import Button from '../../components/Button';
import { RoleGuard } from '../../components/RoleGuard';
import {
  salaryService,
  CareerTrack,
  JobPosition,
  SalaryClass,
  TrackPosition,
  SalaryLevel,
} from '../../services/salary.service';
import { departmentsService } from '../../services/departments.service';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PositionFormData {
  position_id: string;
  class_id: string;
  base_salary: number;
  order_index: number;
  active: boolean;
}

interface SalaryInputState {
  displayValue: string;
  numericValue: number;
}

interface NewPositionData {
  name: string;
  code: string;
  description: string;
  is_multifunctional: boolean;
  can_view_people_committee: boolean;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<TrackPosition | null>(null);
  const [selectedTrackPosition, setSelectedTrackPosition] = useState<TrackPosition | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<TrackPosition | null>(null);
  const [levelSalaries, setLevelSalaries] = useState<LevelSalary[]>([]);

  const [formData, setFormData] = useState<PositionFormData>({
    position_id: '',
    class_id: '',
    base_salary: 0,
    order_index: 0,
    active: true,
  });
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [newPositionData, setNewPositionData] = useState<NewPositionData>({
    name: '',
    code: '',
    description: '',
    is_multifunctional: false,
    can_view_people_committee: false,
  });

  // Estado para porcentagens editáveis dos níveis
  const [customLevelPercentages, setCustomLevelPercentages] = useState<Record<string, number>>({});

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
        salaryService.getLevels(),
      ]);

      setPositions(allPositions.filter((p) => p.active));
      setClasses(allClasses.filter((c) => c.active).sort((a, b) => a.order_index - b.order_index));
      setLevels(allLevels.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da trilha');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = () => {
    const nextIndex =
      trackPositions.length > 0 ? Math.max(...trackPositions.map((p) => p.order_index)) + 1 : 0;

    setFormData({
      position_id: '',
      class_id: '',
      base_salary: 0,
      order_index: nextIndex,
      active: true,
    });
    setSalaryInput('');
    setNewPositionData({
      name: '',
      code: '',
      description: '',
      is_multifunctional: false,
      can_view_people_committee: false,
    });
    setSelectedPosition(null);
    setShowNewPositionForm(false);

    // Inicializar porcentagens com valores sugeridos (0%, 15%, 30%, 50%, 50%)
    const initialPercentages: Record<string, number> = {};
    const suggestedPercentages = [0, 15, 30, 50, 50]; // A, B, C, D, E
    levels.forEach((level, index) => {
      initialPercentages[level.id] = suggestedPercentages[index] || 0;
    });
    setCustomLevelPercentages(initialPercentages);

    setShowAddModal(true);
  };

  const handleEditPosition = (position: TrackPosition) => {
    setSelectedPosition(position);
    setFormData({
      position_id: position.position_id,
      class_id: position.class_id,
      base_salary: position.base_salary,
      order_index: position.order_index,
      active: position.active,
    });
    setSalaryInput(formatCurrencyInput(position.base_salary));

    // Load custom percentages if they exist, otherwise use suggested values
    if (
      position.custom_level_percentages &&
      Object.keys(position.custom_level_percentages).length > 0
    ) {
      setCustomLevelPercentages(position.custom_level_percentages);
    } else {
      const initialPercentages: Record<string, number> = {};
      const suggestedPercentages = [0, 15, 30, 50, 50]; // A, B, C, D, E
      levels.forEach((level, index) => {
        initialPercentages[level.id] = suggestedPercentages[index] || 0;
      });
      setCustomLevelPercentages(initialPercentages);
    }

    setShowEditModal(true);
  };

  const handleViewLevels = (trackPosition: TrackPosition) => {
    setSelectedTrackPosition(trackPosition);

    // Calcular salários para cada nível usando as porcentagens customizadas do cargo
    const customPercentages = trackPosition.custom_level_percentages || {};
    const calculatedLevels = levels.map((level) => {
      const percentage = customPercentages[level.id] || 0;
      return {
        level_id: level.id,
        level_name: level.name,
        percentage: percentage,
        calculated_salary: trackPosition.base_salary * (1 + percentage / 100),
      };
    });

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

      // Verificar se já existe um cargo com esse nome
      const existingPosition = positions.find(
        (p) => p.name.toLowerCase().trim() === newPositionData.name.toLowerCase().trim(),
      );

      if (existingPosition) {
        toast.error(
          'Já existe um cargo com este nome. Selecione o cargo existente na lista ou use um nome diferente.',
        );
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
          can_view_people_committee: newPositionData.can_view_people_committee,
          active: true,
        });

        // Adicionar imediatamente à trilha
        await salaryService.createTrackPosition({
          track_id: trackId,
          position_id: createdPosition.id,
          class_id: formData.class_id,
          base_salary: formData.base_salary,
          order_index: formData.order_index,
          active: formData.active,
          custom_level_percentages: customLevelPercentages,
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
          track_id: trackId,
          custom_level_percentages: customLevelPercentages,
        });
        toast.success('Cargo atualizado com sucesso!');
      } else {
        // Criar nova posição
        await salaryService.createTrackPosition({
          ...formData,
          track_id: trackId,
          custom_level_percentages: customLevelPercentages,
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

  const handleOpenDeleteModal = (trackPosition: TrackPosition) => {
    setPositionToDelete(trackPosition);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;

    try {
      await salaryService.deleteTrackPosition(positionToDelete.id);
      toast.success('Cargo removido da trilha');
      setShowDeleteModal(false);
      setPositionToDelete(null);
      loadData();
    } catch (error) {
      console.error('Erro ao remover cargo:', error);
      toast.error('Erro ao remover cargo da trilha');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPositionToDelete(null);
  };

  const handleReorderPosition = async (positionId: string, direction: 'up' | 'down') => {
    const currentIndex = trackPositions.findIndex((p) => p.id === positionId);
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
          salaryService.updateTrackPosition(pos.id, { order_index: index }),
        ),
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
      maximumFractionDigits: 2,
    });
  };

  const formatCurrencyInput = (value: number): string => {
    if (!value || value === 0) return '';
    const strValue = value.toFixed(2);
    const [integerPart, decimalPart] = strValue.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger},${decimalPart}`;
  };

  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const numberValue = parseFloat(cleanValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Permite campo vazio
    if (value === '') {
      setSalaryInput('');
      setFormData({ ...formData, base_salary: 0 });
      return;
    }

    // Remove tudo exceto números e vírgula
    value = value.replace(/[^\d,]/g, '');

    // Garante apenas uma vírgula
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount > 1) {
      const parts = value.split(',');
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limita a duas casas decimais após a vírgula
    const parts = value.split(',');
    if (parts.length > 1 && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      value = parts.join(',');
    }

    // Atualiza o input visual (string)
    setSalaryInput(value);

    // Converte para número e atualiza formData
    const numericValue = parseCurrencyInput(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setFormData({ ...formData, base_salary: numericValue });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Trilha não encontrada</p>
          <Button onClick={() => navigate('/salary/admin')} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['director']}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/salary')}
                className="p-2 hover:bg-accent rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3 font-lemon-milk tracking-wide">
                  <GitBranch className="h-7 w-7 text-lime-deep dark:text-lime" />
                  {track.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
            {track.description && <p className="text-muted-foreground">{track.description}</p>}
          </motion.div>

          {/* Lista de Cargos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-lime-deep dark:text-lime" />
              Cargos na Trilha
            </h2>

            {trackPositions.length > 0 ? (
              <div className="space-y-3">
                {trackPositions.map((trackPos, index) => {
                  const position = positions.find((p) => p.id === trackPos.position_id);
                  const salaryClass = classes.find((c) => c.id === trackPos.class_id);

                  return (
                    <motion.div
                      key={trackPos.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-secondary rounded-lg p-4 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Ordem */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleReorderPosition(trackPos.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <button
                              onClick={() => handleReorderPosition(trackPos.id, 'down')}
                              disabled={index === trackPositions.length - 1}
                              className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Informações do Cargo */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-foreground">
                                {position?.name || 'Cargo não encontrado'}
                              </h3>
                              <span className="px-2 py-1 text-xs bg-lime/20 text-lime-deep dark:text-lime rounded-full">
                                {salaryClass?.name}
                              </span>
                              {!trackPos.active && (
                                <span className="px-2 py-1 text-xs bg-destructive/15 text-destructive rounded-full">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                            className="p-2 text-lime-deep dark:text-lime hover:bg-accent rounded-lg"
                            title="Ver níveis salariais"
                          >
                            <Layers className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPosition(trackPos)}
                            className="p-2 text-muted-foreground hover:bg-accent rounded-lg"
                            title="Editar cargo"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(trackPos)}
                            className="p-2 text-destructive hover:bg-accent rounded-lg"
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
              <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                <Briefcase className="h-12 w-12 text-lime-deep dark:text-lime mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  Nenhum cargo adicionado a esta trilha ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
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
            className="bg-lime/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-lime-deep dark:text-lime mt-0.5" />
              <div className="text-sm text-foreground">
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
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
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
                className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedPosition ? 'Editar Cargo na Trilha' : 'Adicionar Cargo à Trilha'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setShowNewPositionForm(false);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {!showNewPositionForm ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground font-medium mb-1">
                          Cargo *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.position_id}
                            onChange={(e) =>
                              setFormData({ ...formData, position_id: e.target.value })
                            }
                            className="flex-1 px-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                            disabled={!!selectedPosition}
                          >
                            <option value="">Selecione um cargo existente</option>
                            {positions.map((pos) => (
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Ou clique em "Criar Novo" para adicionar um cargo que ainda não existe
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground font-medium mb-1">
                          Classe Salarial *
                        </label>
                        <select
                          value={formData.class_id}
                          onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                          className="w-full px-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                        >
                          <option value="">Selecione uma classe</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground font-medium mb-1">
                          Salário Base *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            R$
                          </span>
                          <input
                            type="text"
                            value={salaryInput}
                            onChange={handleSalaryChange}
                            className="w-full pl-12 pr-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                            placeholder="0,00"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Este é o salário base (nível A). Os demais níveis serão calculados
                          automaticamente.
                        </p>
                      </div>

                      {/* Preview dos níveis */}
                      {formData.base_salary > 0 && (
                        <div className="border border-border bg-secondary rounded-lg p-4">
                          <h4 className="text-sm font-medium text-foreground mb-3">
                            Níveis Salariais
                          </h4>

                          <div className="space-y-2">
                            {levels.map((level) => {
                              const percentage = customLevelPercentages[level.id] ?? 0;
                              const calculatedSalary =
                                formData.base_salary * (1 + percentage / 100);

                              return (
                                <div
                                  key={level.id}
                                  className="flex items-center gap-3 bg-card rounded p-3"
                                >
                                  {/* Badge do Nível */}
                                  <div className="flex-shrink-0 w-8 h-8 bg-lime rounded flex items-center justify-center">
                                    <span className="text-obsidian font-semibold text-sm">
                                      {level.name}
                                    </span>
                                  </div>

                                  {/* Inputs */}
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    {/* Porcentagem */}
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={percentage}
                                        onChange={(e) => {
                                          const newValue = parseFloat(e.target.value) || 0;
                                          setCustomLevelPercentages({
                                            ...customLevelPercentages,
                                            [level.id]: newValue,
                                          });
                                        }}
                                        className="w-full pl-2 pr-7 py-1.5 text-sm border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded"
                                        placeholder="0"
                                        step="0.5"
                                        min="0"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        %
                                      </span>
                                    </div>

                                    {/* Salário */}
                                    <div className="px-2 py-1.5 bg-success/15 border border-success/20 rounded text-sm font-semibold text-success">
                                      {formatCurrency(calculatedSalary)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-sm font-medium text-foreground font-medium">
                            Cargo ativo
                          </span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-lime/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-foreground font-medium">
                            Criar novo cargo e adicionar à trilha
                          </p>
                          <button
                            onClick={() => setShowNewPositionForm(false)}
                            className="text-lime-deep dark:text-lime hover:text-lime-deep dark:hover:text-lime"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground font-medium mb-1">
                          Nome do Cargo *
                        </label>
                        <input
                          type="text"
                          value={newPositionData.name}
                          onChange={(e) =>
                            setNewPositionData({ ...newPositionData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                          placeholder="Ex: Analista de Sistemas"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground font-medium mb-1">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={newPositionData.description}
                          onChange={(e) =>
                            setNewPositionData({ ...newPositionData, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                          rows={2}
                          placeholder="Descrição do cargo"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newPositionData.is_multifunctional}
                            onChange={(e) =>
                              setNewPositionData({
                                ...newPositionData,
                                is_multifunctional: e.target.checked,
                              })
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm font-medium text-foreground font-medium">
                            Cargo multifuncional
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newPositionData.can_view_people_committee}
                            onChange={(e) =>
                              setNewPositionData({
                                ...newPositionData,
                                can_view_people_committee: e.target.checked,
                              })
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm font-medium text-foreground font-medium">
                            Pode visualizar Comitê de Gente
                          </span>
                        </label>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (permite ver Nine Box dos liderados)
                        </span>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-medium text-foreground font-medium mb-3">
                          Configuração na Trilha
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground font-medium mb-1">
                              Classe Salarial *
                            </label>
                            <select
                              value={formData.class_id}
                              onChange={(e) =>
                                setFormData({ ...formData, class_id: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                            >
                              <option value="">Selecione uma classe</option>
                              {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.code} - {cls.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground font-medium mb-1">
                              Salário Base *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                R$
                              </span>
                              <input
                                type="text"
                                value={salaryInput}
                                onChange={handleSalaryChange}
                                className="w-full pl-12 pr-3 py-2 border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded-lg"
                                placeholder="0,00"
                              />
                            </div>
                          </div>

                          {/* Preview dos níveis */}
                          {formData.base_salary > 0 && (
                            <div className="border border-border bg-secondary rounded-lg p-4">
                              <h4 className="text-sm font-medium text-foreground mb-3">
                                Níveis Salariais
                              </h4>

                              <div className="space-y-2">
                                {levels.map((level) => {
                                  const percentage = customLevelPercentages[level.id] ?? 0;
                                  const calculatedSalary =
                                    formData.base_salary * (1 + percentage / 100);

                                  return (
                                    <div
                                      key={level.id}
                                      className="flex items-center gap-3 bg-card rounded p-3"
                                    >
                                      {/* Badge do Nível */}
                                      <div className="flex-shrink-0 w-8 h-8 bg-lime rounded flex items-center justify-center">
                                        <span className="text-obsidian font-semibold text-sm">
                                          {level.name}
                                        </span>
                                      </div>

                                      {/* Inputs */}
                                      <div className="flex-1 grid grid-cols-2 gap-2">
                                        {/* Porcentagem */}
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={percentage}
                                            onChange={(e) => {
                                              const newValue = parseFloat(e.target.value) || 0;
                                              setCustomLevelPercentages({
                                                ...customLevelPercentages,
                                                [level.id]: newValue,
                                              });
                                            }}
                                            className="w-full pl-2 pr-7 py-1.5 text-sm border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background rounded"
                                            placeholder="0"
                                            step="0.5"
                                            min="0"
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            %
                                          </span>
                                        </div>

                                        {/* Salário */}
                                        <div className="px-2 py-1.5 bg-success/15 border border-success/20 rounded text-sm font-semibold text-success">
                                          {formatCurrency(calculatedSalary)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
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
                    disabled={
                      saving ||
                      (!showNewPositionForm &&
                        (!formData.position_id ||
                          !formData.class_id ||
                          formData.base_salary <= 0)) ||
                      (showNewPositionForm &&
                        (!newPositionData.name || !formData.class_id || formData.base_salary <= 0))
                    }
                    icon={<Save className="h-4 w-4" />}
                  >
                    {saving
                      ? 'Salvando...'
                      : showNewPositionForm
                        ? 'Criar Cargo e Adicionar'
                        : 'Adicionar à Trilha'}
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
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
              onClick={() => setShowLevelsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Níveis Salariais</h2>
                  <button
                    onClick={() => setShowLevelsModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">
                      {positions.find((p) => p.id === selectedTrackPosition.position_id)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {' '}
                      {classes.find((c) => c.id === selectedTrackPosition.class_id)?.name}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {levelSalaries.map((levelSalary, index) => (
                      <div
                        key={levelSalary.level_id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border
                          ${index === 0 ? 'border-success/20 bg-success/15' : 'border-border'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold
                            ${
                              index === 0
                                ? 'bg-success/15 text-success'
                                : 'bg-secondary text-muted-foreground'
                            }
                          `}
                          >
                            {levelSalary.level_name}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              Nível {levelSalary.level_name}
                            </p>
                            {levelSalary.percentage > 0 && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Percent className="w-3 h-3" />+{levelSalary.percentage}% sobre o
                                base
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(levelSalary.calculated_salary)}
                          </p>
                          {index > 0 && (
                            <p className="text-xs text-success">
                              +
                              {formatCurrency(
                                levelSalary.calculated_salary - selectedTrackPosition.base_salary,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Diferença entre A e E:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          levelSalaries[levelSalaries.length - 1]?.calculated_salary -
                            selectedTrackPosition.base_salary,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" onClick={() => setShowLevelsModal(false)}>
                    Fechar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmação de Exclusão */}
        <AnimatePresence>
          {showDeleteModal && positionToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
              onClick={handleCancelDelete}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
                      <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Confirmar Exclusão</h2>
                  </div>
                  <button
                    onClick={handleCancelDelete}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-muted-foreground mb-4">
                    Tem certeza que deseja remover este cargo da trilha?
                  </p>
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="font-semibold text-foreground">
                      {positions.find((p) => p.id === positionToDelete.position_id)?.name ||
                        'Cargo'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Classe: {classes.find((c) => c.id === positionToDelete.class_id)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Salário Base: {formatCurrency(positionToDelete.base_salary)}
                    </p>
                  </div>
                  <div className="mt-4 bg-warning/15 rounded-lg p-3 border border-warning/20">
                    <p className="text-sm text-warning">
                      <strong>Atenção:</strong> Esta ação não pode ser desfeita. O cargo será
                      removido apenas desta trilha.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={handleCancelDelete}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="bg-destructive hover:bg-destructive text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sim, Remover
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
