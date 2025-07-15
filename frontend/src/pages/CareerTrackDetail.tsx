import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import {
  ArrowLeft, Plus, Edit, Trash2, DollarSign, TrendingUp,
  ChevronRight, Users,
  GitBranch, Briefcase, Save
} from 'lucide-react';
import { salaryService, CareerTrack, TrackPosition } from '../services/salary.service';
import { RoleGuard } from '../components/RoleGuard';

interface PositionWithDetails extends Omit<TrackPosition, 'position' | 'class'> {
    position?: {
      id: string;
      name: string;
      description?: string;
    };
    class?: {
      id: string;
      code: string;
      name: string;
    };
}

const CareerTrackDetail = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<CareerTrack | null>(null);
  const [positions, setPositions] = useState<PositionWithDetails[]>([]);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);

  // Estados para formulário
  const [availablePositions, setAvailablePositions] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    position_id: '',
    class_id: '',
    base_salary: '',
    order_index: 1
  });

  useEffect(() => {
    if (trackId) {
      loadTrackData();
      loadFormOptions();
    }
  }, [trackId]);

  const loadTrackData = async () => {
    try {
      setLoading(true);
      const [trackData, positionsData] = await Promise.all([
        salaryService.getTrackById(trackId!),
        salaryService.getPositionsByTrack(trackId!)
      ]);
      setTrack(trackData);
      setPositions(positionsData.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      toast.error('Erro ao carregar dados da trilha');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [positionsData, classesData] = await Promise.all([
        salaryService.getPositions(),
        salaryService.getClasses()
      ]);
      setAvailablePositions(positionsData);
      setAvailableClasses(classesData.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const handleAddPosition = async () => {
    try {
      await salaryService.createTrackPosition({
        track_id: trackId!,
        position_id: formData.position_id,
        class_id: formData.class_id,
        base_salary: parseFloat(formData.base_salary),
        order_index: formData.order_index,
        active: true
      });
      toast.success('Cargo adicionado à trilha');
      setShowAddPosition(false);
      setFormData({ position_id: '', class_id: '', base_salary: '', order_index: positions.length + 1 });
      loadTrackData();
    } catch (error) {
      toast.error('Erro ao adicionar cargo');
    }
  };

  const handleUpdatePosition = async (positionId: string, updates: any) => {
    try {
      await salaryService.updateTrackPosition(positionId, updates);
      toast.success('Posição atualizada');
      setEditingPosition(null);
      loadTrackData();
    } catch (error) {
      toast.error('Erro ao atualizar posição');
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Tem certeza que deseja remover este cargo da trilha?')) return;
    
    try {
      await salaryService.deleteTrackPosition(positionId);
      toast.success('Cargo removido da trilha');
      loadTrackData();
    } catch (error) {
      toast.error('Erro ao remover cargo');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Trilha não encontrada</p>
        <Button onClick={() => navigate('/salary')} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/salary')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-primary-500" />
              {track.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              {track.code && <span>Código: {track.code}</span>}
              {track.department && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {track.department.name}
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs ${
                track.active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {track.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
          <RoleGuard allowedRoles={['director', 'leader']}>
            <Button
              variant="primary"
              onClick={() => setShowAddPosition(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cargo
            </Button>
          </RoleGuard>
        </div>

        {track.description && (
          <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            {track.description}
          </p>
        )}
      </motion.div>

      {/* Positions Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary-500" />
          Progressão de Cargos
        </h2>

        <div className="space-y-4">
          {positions.map((position, index) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Linha conectora */}
              {index < positions.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-16 bg-gray-300 dark:bg-gray-600" />
              )}

              <div className="flex items-start gap-4">
                {/* Indicador de ordem */}
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {position.order_index}
                </div>

                {/* Card do cargo */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                  {editingPosition === position.id ? (
                    /* Modo edição */
                    <div className="space-y-4">
                      <input
                        type="number"
                        value={position.base_salary}
                        onChange={(e) => {
                          const newPositions = [...positions];
                          const idx = newPositions.findIndex(p => p.id === position.id);
                          newPositions[idx].base_salary = parseFloat(e.target.value);
                          setPositions(newPositions);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        placeholder="Salário base"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePosition(position.id, {
                            base_salary: position.base_salary
                          })}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPosition(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualização */
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {position.position?.name || 'Cargo'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Classe {position.class?.code} - {position.class?.name}
                          </p>
                          {position.position?.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {position.position.description}
                            </p>
                          )}
                        </div>
                        <RoleGuard allowedRoles={['director', 'leader']}>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPosition(position.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePosition(position.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </RoleGuard>
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(position.base_salary)}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            (base)
                          </span>
                        </div>
                        {index < positions.length - 1 && (
                          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Próximo nível</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Cálculo com interníveis */}
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Salário com interníveis:
                        </p>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {['A', 'B', 'C', 'D', 'E'].map((level, idx) => (
                            <div key={level} className="text-xs">
                              <div className="font-medium text-gray-700 dark:text-gray-300">
                                {level}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {formatCurrency(position.base_salary * (1 + (idx === 0 ? 0 : idx === 1 ? 0.03 : idx === 2 ? 0.05 : idx === 3 ? 0.10 : 0.15)))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {positions.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cargo adicionado a esta trilha ainda.</p>
              <p className="text-sm mt-2">Clique em "Adicionar Cargo" para começar.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Adicionar Cargo */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Adicionar Cargo à Trilha
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <select
                  value={formData.position_id}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Selecione um cargo</option>
                  {availablePositions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classe Salarial
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Selecione uma classe</option>
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      Classe {cls.code} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salário Base
                </label>
                <input
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ordem na Trilha
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleAddPosition}
                disabled={!formData.position_id || !formData.class_id || !formData.base_salary}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddPosition(false);
                  setFormData({ position_id: '', class_id: '', base_salary: '', order_index: positions.length + 1 });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CareerTrackDetail;