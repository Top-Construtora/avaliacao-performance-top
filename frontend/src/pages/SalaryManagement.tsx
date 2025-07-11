import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import { 
  DollarSign, Edit, Trash2, Search, Filter, Building, Plus,
  TrendingUp, Users, Briefcase, ArrowUpRight, ArrowRight,
  Award, Target, Grid3x3, List, ChevronRight, Eye,
  FileText, Download, Upload, AlertCircle, CheckCircle,
  Info, X, Layers, GitBranch, Zap, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService, SalaryClass, JobPosition, CareerTrack, SalaryLevel } from '../services/salary.service';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../components/RoleGuard';

type TabType = 'classes' | 'positions' | 'levels' | 'tracks' | 'overview';
type ViewMode = 'grid' | 'list';

const SalaryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  
  // Estados para os dados
  const [classes, setClasses] = useState<SalaryClass[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [levels, setLevels] = useState<SalaryLevel[]>([]);
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [overview, setOverview] = useState<any>(null);

  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'classes':
          const classesData = await salaryService.getClasses();
          setClasses(classesData);
          break;
        case 'positions':
          const positionsData = await salaryService.getPositions();
          setPositions(positionsData);
          break;
        case 'levels':
          const levelsData = await salaryService.getLevels();
          setLevels(levelsData);
          break;
        case 'tracks':
          const tracksData = await salaryService.getTracks();
          setTracks(tracksData);
          break;
        case 'overview':
          const overviewData = await salaryService.getSalaryOverview();
          setOverview(overviewData);
          break;
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      switch (type) {
        case 'class':
          await salaryService.deleteClass(id);
          setClasses(classes.filter(c => c.id !== id));
          break;
        case 'position':
          await salaryService.deletePosition(id);
          setPositions(positions.filter(p => p.id !== id));
          break;
        case 'level':
          await salaryService.deleteLevel(id);
          setLevels(levels.filter(l => l.id !== id));
          break;
        case 'track':
          await salaryService.deleteTrack(id);
          setTracks(tracks.filter(t => t.id !== id));
          break;
      }
      toast.success('Item excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  // Componente de Overview
  const OverviewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <Users className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_employees || 0}</span>
        </div>
        <h3 className="font-medium text-blue-100">Total de Colaboradores</h3>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span>CLT: {overview?.total_clt || 0}</span>
          <span>PJ: {overview?.total_pj || 0}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <DollarSign className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
              .format(overview?.avg_salary || 0)}
          </span>
        </div>
        <h3 className="font-medium text-green-100">Salário Médio</h3>
        <div className="mt-2 text-sm opacity-80">
          Min: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
            .format(overview?.min_salary || 0)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <GitBranch className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_tracks || 0}</span>
        </div>
        <h3 className="font-medium text-purple-100">Trilhas de Carreira</h3>
        <div className="mt-2 text-sm opacity-80">Ativas</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <Briefcase className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_positions || 0}</span>
        </div>
        <h3 className="font-medium text-orange-100">Cargos Cadastrados</h3>
        <div className="mt-2 text-sm opacity-80">Multifuncionais</div>
      </motion.div>
    </div>
  );

  // Componente de Classe Salarial Card
  const ClassCard = ({ item }: { item: SalaryClass }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Classe {item.code}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
        </div>
        <div className="flex gap-2">
          <RoleGuard allowedRoles={['director', 'leader']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            </RoleGuard>
            <RoleGuard allowedRoles={['director']}>
                <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(item.id, 'class')}
                className="text-red-600 hover:text-red-700"
                >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGuard>
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
  );

  // Componente de Cargo Card
  const PositionCard = ({ item }: { item: JobPosition }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {item.name}
          </h3>
          {item.code && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Código: {item.code}</p>
          )}
        </div>
        <div className="flex gap-2">
          <RoleGuard allowedRoles={['director', 'leader']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={['director']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(item.id, 'position')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGuard>
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
  );

  // Componente de Internível Card
  const LevelCard = ({ item }: { item: SalaryLevel }) => (
    <motion.div
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
          <RoleGuard allowedRoles={['director']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(item.id, 'level')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGuard>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Ordem</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{item.order_index}</span>
        </div>
      </div>
    </motion.div>
  );

  // Componente de Trilha Card
  const TrackCard = ({ item }: { item: CareerTrack }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {item.name}
          </h3>
          {item.code && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Código: {item.code}</p>
          )}
          {item.department && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Building className="h-3 w-3 inline mr-1" />
              {item.department.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/salary/tracks/${item.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <RoleGuard allowedRoles={['director', 'leader']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={['director']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(item.id, 'track')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGuard>
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
  );

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
              <DollarSign className="h-7 w-7 text-primary-500 mr-3" />
              Gestão de Cargos e Salários
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie classes, cargos, interníveis e trilhas de carreira
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/salary/reports')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
            <RoleGuard allowedRoles={['director', 'leader']}>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex overflow-x-auto pb-2 -mb-2">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'classes', label: 'Classes Salariais', icon: Layers },
            { id: 'positions', label: 'Cargos', icon: Briefcase },
            { id: 'levels', label: 'Interníveis', icon: Target },
            { id: 'tracks', label: 'Trilhas', icon: GitBranch }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search and Filters */}
      {activeTab !== 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewContent />}
          
          {activeTab === 'classes' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            >
              {classes
                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               item.code.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(item => (
                  <ClassCard key={item.id} item={item} />
                ))}
            </motion.div>
          )}

          {activeTab === 'positions' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            >
              {positions
                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(item => (
                  <PositionCard key={item.id} item={item} />
                ))}
            </motion.div>
          )}

          {activeTab === 'levels' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6' : 'space-y-4'}
            >
              {levels
                .sort((a, b) => a.order_index - b.order_index)
                .map(item => (
                  <LevelCard key={item.id} item={item} />
                ))}
            </motion.div>
          )}

          {activeTab === 'tracks' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            >
              {tracks
                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(item => (
                  <TrackCard key={item.id} item={item} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modais serão implementados na próxima parte */}
    </div>
  );
};

export default SalaryManagement;