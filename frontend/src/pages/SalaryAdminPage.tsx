import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import { 
  DollarSign, Edit, Trash2, Search, Filter, Building, Plus,
  TrendingUp, Users, Briefcase, ArrowUpRight, ArrowRight,
  Award, Target, Grid3x3, List, ChevronRight, Eye,
  FileText, Download, Upload, AlertCircle, CheckCircle,
  Info, X, Layers, GitBranch, Zap, BarChart3, Save,
  Settings, Package, Percent, Hash, Move
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService, SalaryClass, JobPosition, CareerTrack, SalaryLevel, TrackPosition } from '../services/salary.service';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../components/RoleGuard';
import { departmentsService } from '../services/departments.service';

type TabType = 'classes' | 'positions' | 'levels' | 'tracks' | 'track-positions' | 'rules';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface ProgressionRule {
  id?: string;
  from_position_id: string;
  to_position_id: string;
  progression_type: 'horizontal' | 'vertical' | 'merit';
  min_time_months?: number;
  performance_requirement?: number;
  additional_requirements?: Record<string, any>;
  active: boolean;
}

const SalaryAdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('classes');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para os dados
  const [classes, setClasses] = useState<SalaryClass[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [levels, setLevels] = useState<SalaryLevel[]>([]);
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [trackPositions, setTrackPositions] = useState<TrackPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [progressionRules, setProgressionRules] = useState<ProgressionRule[]>([]);

  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<TabType>('classes');

  // Estado para formulários
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
    loadDepartments();
  }, [activeTab]);

  const loadDepartments = async () => {
    try {
      const deps = await departmentsService.getDepartments();
      setDepartments(deps || []);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      // Não exibe erro toast aqui, apenas loga
      setDepartments([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'classes':
          const classesData = await salaryService.getClasses();
          setClasses(classesData.sort((a, b) => a.order_index - b.order_index));
          break;
        case 'positions':
          const positionsData = await salaryService.getPositions();
          setPositions(positionsData);
          break;
        case 'levels':
          const levelsData = await salaryService.getLevels();
          setLevels(levelsData.sort((a, b) => a.order_index - b.order_index));
          break;
        case 'tracks':
          const tracksData = await salaryService.getTracks();
          setTracks(tracksData);
          break;
        case 'track-positions':
          const trackPosData = await salaryService.getTrackPositions();
          setTrackPositions(trackPosData);
          break;
        case 'rules':
          const rulesData = await salaryService.getProgressionRules();
          setProgressionRules(rulesData);
          break;
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setModalType(activeTab);
    setFormData(getDefaultFormData(activeTab));
    setShowCreateModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setModalType(activeTab);
    setFormData(item);
    setShowEditModal(true);
  };

  const getDefaultFormData = (type: TabType) => {
    switch (type) {
      case 'classes':
        return { code: '', name: '', description: '', order_index: 0, active: true };
      case 'positions':
        return { name: '', code: '', description: '', is_multifunctional: false, active: true };
      case 'levels':
        return { name: '', percentage: 0, order_index: 0 };
      case 'tracks':
        return { name: '', code: '', description: '', department_id: '', active: true };
      case 'track-positions':
        return { track_id: '', position_id: '', class_id: '', base_salary: 0, order_index: 0, active: true };
      case 'rules':
        return { 
          from_position_id: '', 
          to_position_id: '', 
          progression_type: 'horizontal', 
          min_time_months: 12,
          performance_requirement: 3.0,
          active: true 
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    try {
      switch (modalType) {
        case 'classes':
          if (selectedItem) {
            await salaryService.updateClass(selectedItem.id, formData);
            toast.success('Classe atualizada com sucesso!');
          } else {
            await salaryService.createClass(formData);
            toast.success('Classe criada com sucesso!');
          }
          break;
        case 'positions':
          if (selectedItem) {
            await salaryService.updatePosition(selectedItem.id, formData);
            toast.success('Cargo atualizado com sucesso!');
          } else {
            await salaryService.createPosition(formData);
            toast.success('Cargo criado com sucesso!');
          }
          break;
        case 'levels':
          if (selectedItem) {
            await salaryService.updateLevel(selectedItem.id, formData);
            toast.success('Internível atualizado com sucesso!');
          } else {
            await salaryService.createLevel(formData);
            toast.success('Internível criado com sucesso!');
          }
          break;
        case 'tracks':
          if (selectedItem) {
            await salaryService.updateTrack(selectedItem.id, formData);
            toast.success('Trilha atualizada com sucesso!');
          } else {
            await salaryService.createTrack(formData);
            toast.success('Trilha criada com sucesso!');
          }
          break;
        case 'track-positions':
          if (selectedItem) {
            await salaryService.updateTrackPosition(selectedItem.id, formData);
            toast.success('Posição na trilha atualizada com sucesso!');
          } else {
            await salaryService.createTrackPosition(formData);
            toast.success('Posição na trilha criada com sucesso!');
          }
          break;
        case 'rules':
          if (selectedItem) {
            await salaryService.updateProgressionRule(selectedItem.id, formData);
            toast.success('Regra de progressão atualizada com sucesso!');
          } else {
            await salaryService.createProgressionRule(formData);
            toast.success('Regra de progressão criada com sucesso!');
          }
          break;
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      switch (activeTab) {
        case 'classes':
          await salaryService.deleteClass(id);
          toast.success('Classe excluída com sucesso!');
          break;
        case 'positions':
          await salaryService.deletePosition(id);
          toast.success('Cargo excluído com sucesso!');
          break;
        case 'levels':
          await salaryService.deleteLevel(id);
          toast.success('Internível excluído com sucesso!');
          break;
        case 'tracks':
          await salaryService.deleteTrack(id);
          toast.success('Trilha excluída com sucesso!');
          break;
        case 'track-positions':
          await salaryService.deleteTrackPosition(id);
          toast.success('Posição na trilha excluída com sucesso!');
          break;
        case 'rules':
          await salaryService.deleteProgressionRule(id);
          toast.success('Regra de progressão excluída com sucesso!');
          break;
      }
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir');
      console.error(error);
    }
  };

  // Função de filtro
  const filterItems = (items: any[]) => {
    if (!searchTerm) return items;
    
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  // Renderização do modal de criação/edição
  const renderModal = () => {
    const isEdit = showEditModal;
    const title = isEdit ? 'Editar' : 'Criar';

    return (
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {title} {getModalTitle(modalType)}
            </h2>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {renderFormFields()}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const getModalTitle = (type: TabType) => {
    switch (type) {
      case 'classes': return 'Classe Salarial';
      case 'positions': return 'Cargo';
      case 'levels': return 'Internível';
      case 'tracks': return 'Trilha de Carreira';
      case 'track-positions': return 'Posição na Trilha';
      case 'rules': return 'Regra de Progressão';
      default: return '';
    }
  };

  const renderFormFields = () => {
    switch (modalType) {
      case 'classes':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: C1, C2, C3..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: Júnior, Pleno, Sênior"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                rows={3}
                placeholder="Descrição da classe salarial"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={formData.order_index || 0}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativo</span>
                </label>
              </div>
            </div>
          </>
        );

      case 'positions':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cargo
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: Analista de Sistemas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: AS-001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                rows={3}
                placeholder="Descrição do cargo e responsabilidades"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_multifunctional || false}
                  onChange={(e) => setFormData({ ...formData, is_multifunctional: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cargo Multifuncional</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active || false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativo</span>
              </label>
            </div>
          </>
        );

      case 'levels':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Internível
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: A, B, C ou 1, 2, 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Percentual (%)
                </label>
                <input
                  type="number"
                  value={formData.percentage || 0}
                  onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordem
              </label>
              <input
                type="number"
                value={formData.order_index || 0}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                min="0"
              />
            </div>
          </>
        );

      case 'tracks':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Trilha
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: Trilha Técnica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Ex: TT-001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento
              </label>
              <select
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Selecione um departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                rows={3}
                placeholder="Descrição da trilha de carreira"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active || false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativo</span>
              </label>
            </div>
          </>
        );

      case 'track-positions':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trilha
                </label>
                <select
                  value={formData.track_id || ''}
                  onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione uma trilha</option>
                  {tracks.map(track => (
                    <option key={track.id} value={track.id}>{track.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <select
                  value={formData.position_id || ''}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione um cargo</option>
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classe Salarial
                </label>
                <select
                  value={formData.class_id || ''}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione uma classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.code} - {cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salário Base (R$)
                </label>
                <input
                  type="number"
                  value={formData.base_salary || 0}
                  onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                  step="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={formData.order_index || 0}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativo</span>
                </label>
              </div>
            </div>
          </>
        );

      case 'rules':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Posição de Origem
                </label>
                <select
                  value={formData.from_position_id || ''}
                  onChange={(e) => setFormData({ ...formData, from_position_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione a posição de origem</option>
                  {trackPositions.map(tp => (
                    <option key={tp.id} value={tp.id}>
                      {tp.track?.name} - {tp.position?.name} ({tp.class?.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Posição de Destino
                </label>
                <select
                  value={formData.to_position_id || ''}
                  onChange={(e) => setFormData({ ...formData, to_position_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione a posição de destino</option>
                  {trackPositions.map(tp => (
                    <option key={tp.id} value={tp.id}>
                      {tp.track?.name} - {tp.position?.name} ({tp.class?.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Progressão
                </label>
                <select
                  value={formData.progression_type || 'horizontal'}
                  onChange={(e) => setFormData({ ...formData, progression_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="merit">Por Mérito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tempo Mínimo (meses)
                </label>
                <input
                  type="number"
                  value={formData.min_time_months || 12}
                  onChange={(e) => setFormData({ ...formData, min_time_months: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Performance Mínima
                </label>
                <input
                  type="number"
                  value={formData.performance_requirement || 3.0}
                  onChange={(e) => setFormData({ ...formData, performance_requirement: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  min="0"
                  max="4"
                  step="0.1"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active || false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativo</span>
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Componentes de renderização para cada aba
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'classes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(classes).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-primary-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Classe {item.code}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Ordem: {item.order_index}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {item.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'positions':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(positions).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                    </div>
                    {item.code && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.code}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.is_multifunctional 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {item.is_multifunctional ? 'Multifuncional' : 'Específico'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'levels':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {item.name}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Nível {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.percentage}% adicional
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Ordem: {item.order_index}
                  </span>
                  <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-primary-500" />
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      +{item.percentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'tracks':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(tracks).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-primary-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                    </div>
                    {item.code && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.code}</p>
                    )}
                    {item.department && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        <Building className="h-3 w-3 inline mr-1" />
                        {item.department.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/salary/tracks/${item.id}`)}
                      className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/salary/tracks/${item.id}`)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Ver cargos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {item.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'track-positions':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trilha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Salário Base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {trackPositions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.track?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.position?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.class?.code} - {item.class?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      R$ {item.base_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'rules':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tempo Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {progressionRules.map((item) => {
                  const fromPosition = trackPositions.find(tp => tp.id === item.from_position_id);
                  const toPosition = trackPositions.find(tp => tp.id === item.to_position_id);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {fromPosition?.position?.name} ({fromPosition?.class?.code})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {toPosition?.position?.name} ({toPosition?.class?.code})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.progression_type === 'vertical' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : item.progression_type === 'horizontal'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {item.progression_type === 'vertical' ? 'Vertical' : 
                           item.progression_type === 'horizontal' ? 'Horizontal' : 'Mérito'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.min_time_months} meses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.performance_requirement || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.active 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {item.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Settings className="h-7 w-7 text-primary-500 mr-3" />
              Administração de Cargos e Salários
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure classes, cargos, interníveis, trilhas e regras de progressão
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/salary')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gestão
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex overflow-x-auto pb-2 -mb-2">
          {[
            { id: 'classes', label: 'Classes Salariais', icon: Layers },
            { id: 'positions', label: 'Cargos', icon: Briefcase },
            { id: 'levels', label: 'Interníveis', icon: Target },
            { id: 'tracks', label: 'Trilhas', icon: GitBranch },
            { id: 'track-positions', label: 'Posições nas Trilhas', icon: Move },
            { id: 'rules', label: 'Regras de Progressão', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      >
        {renderContent()}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && renderModal()}
      </AnimatePresence>
    </div>
  );
};

export default SalaryAdminPage;