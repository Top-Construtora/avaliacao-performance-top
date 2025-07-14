import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import { 
  DollarSign, Edit, Trash2, Search, Building, Plus,
  TrendingUp, Users, Briefcase, ChevronRight, Eye,
  Grid3x3, List, Settings, BarChart3, GitBranch, Layers, Target
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

  // Estados para modais (a serem implementados ou movidos para /admin)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data;
      switch (activeTab) {
        case 'classes':
          data = await salaryService.getClasses();
          // CORREÇÃO: Garante que o estado seja um array, mesmo que a API falhe.
          setClasses(Array.isArray(data) ? data : []);
          break;
        case 'positions':
          data = await salaryService.getPositions();
          setPositions(Array.isArray(data) ? data : []);
          break;
        case 'levels':
          data = await salaryService.getLevels();
          setLevels(Array.isArray(data) ? data : []);
          break;
        case 'tracks':
          data = await salaryService.getTracks();
          setTracks(Array.isArray(data) ? data : []);
          break;
        case 'overview':
          data = await salaryService.getSalaryOverview();
          // CORREÇÃO: Garante que 'overview' seja um objeto para não quebrar a UI.
          setOverview(data || {});
          break;
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
      // CORREÇÃO: Define os estados como arrays vazios em caso de erro.
      setClasses([]);
      setPositions([]);
      setLevels([]);
      setTracks([]);
      setOverview({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: TabType) => {
    if (!window.confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) return;

    try {
      switch (type) {
        case 'classes':
          await salaryService.deleteClass(id);
          setClasses(prev => prev.filter(c => c.id !== id));
          break;
        case 'positions':
          await salaryService.deletePosition(id);
          setPositions(prev => prev.filter(p => p.id !== id));
          break;
        case 'levels':
          await salaryService.deleteLevel(id);
          setLevels(prev => prev.filter(l => l.id !== id));
          break;
        case 'tracks':
          await salaryService.deleteTrack(id);
          setTracks(prev => prev.filter(t => t.id !== id));
          break;
      }
      toast.success('Item excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir o item. Verifique se ele não está em uso.');
      console.error(error)
    }
  };

  // --- COMPONENTES DE RENDERIZAÇÃO ---

  const OverviewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <Users className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_employees || 0}</span>
        </div>
        <h3 className="font-medium text-primary-100">Total de Colaboradores</h3>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span>CLT: {overview?.total_clt || 0}</span>
          <span>PJ: {overview?.total_pj || 0}</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <DollarSign className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.avg_salary || 0)}
          </span>
        </div>
        <h3 className="font-medium text-green-100">Salário Médio</h3>
        <div className="mt-2 text-sm opacity-80">
          Min: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.min_salary || 0)}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-secondary-500 to-secondary-600 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <GitBranch className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_tracks || 0}</span>
        </div>
        <h3 className="font-medium text-secondary-100">Trilhas de Carreira</h3>
        <div className="mt-2 text-sm opacity-80">Ativas</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-accent-500 to-accent-600 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <Briefcase className="h-8 w-8 opacity-80" />
          <span className="text-2xl font-bold">{overview?.total_positions || 0}</span>
        </div>
        <h3 className="font-medium text-accent-100">Cargos Cadastrados</h3>
        <div className="mt-2 text-sm opacity-80">{overview?.multifunctional_positions || 0} Multifuncionais</div>
      </motion.div>
    </div>
  );

  const ClassCard = ({ item }: { item: SalaryClass }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
      {/* ... (código do card) ... */}
    </motion.div>
  );

  const PositionCard = ({ item }: { item: JobPosition }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
       {/* ... (código do card) ... */}
    </motion.div>
  );

  const LevelCard = ({ item }: { item: SalaryLevel }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
       {/* ... (código do card) ... */}
    </motion.div>
  );

  const TrackCard = ({ item }: { item: CareerTrack }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
       {/* ... (código do card) ... */}
    </motion.div>
  );

  // --- JSX PRINCIPAL ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
            <RoleGuard allowedRoles={['director']}>
              <Button variant="outline" onClick={() => navigate('/salary/admin')}>
                <Settings className="h-4 w-4 mr-2" />
                Administrar
              </Button>
            </RoleGuard>
            <Button variant="outline" onClick={() => navigate('/salary/reports')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${ activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200' }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search and Filters */}
      {activeTab !== 'overview' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('grid')}> <Grid3x3 className="h-4 w-4" /> </Button>
              <Button variant={viewMode === 'list' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('list')}> <List className="h-4 w-4" /> </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </motion.div>
        ) : (
          <motion.div key="content">
            {activeTab === 'overview' && <OverviewContent />}
            {activeTab === 'classes' && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {classes
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => <ClassCard key={item.id} item={item} />)
                }
              </div>
            )}
            {activeTab === 'positions' && (
               <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {positions
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => <PositionCard key={item.id} item={item} />)
                }
              </div>
            )}
            {activeTab === 'levels' && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6' : 'space-y-4'}>
                {levels
                  .sort((a, b) => a.order_index - b.order_index)
                  .map(item => <LevelCard key={item.id} item={item} />)
                }
              </div>
            )}
             {activeTab === 'tracks' && (
               <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {tracks
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => <TrackCard key={item.id} item={item} />)
                }
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalaryManagement;