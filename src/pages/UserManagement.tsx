import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { 
  Users, Edit, Trash2, Search, Filter, Building, UserPlus,
  Shield, Mail, Calendar, X, AlertCircle, Briefcase,
  UserCheck, UsersIcon, MoreVertical, Star, ChevronRight,
  ArrowUpDown, Sparkles, Hash, Info, ChevronLeft, Zap,
  Crown, Target, Layers, Eye, EyeOff, Copy, Download,
  FolderPlus, UserCog, MapPin, FileText, BarChart,
  User, Phone, CalendarDays, Camera, Upload, Link2,
  GitBranch, Network, UserX, ArrowRight, ArrowLeft, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';

const UserManagement = () => {
  const navigate = useNavigate();
  const { 
    users, teams, departments, updateUser, deleteUser,
    updateTeam, deleteTeam, updateDepartment,
    deleteDepartment, getUserById, getTeamById, getDepartmentById,
    removeHierarchicalRelation, getSubordinates,
    getLeader, calculateAge
  } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'team' | 'department'>('user');

  const handleEdit = (type: 'user' | 'team' | 'department', item: any) => {
    setEditType(type);
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (type: 'user' | 'team' | 'department', id: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      if (type === 'user') {
        deleteUser(id);
      } else if (type === 'team') {
        deleteTeam(id);
      } else if (type === 'department') {
        deleteDepartment(id);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'import':
        toast.success('Funcionalidade de importação em desenvolvimento');
        break;
      case 'export':
        toast.success('Exportando dados...');
        break;
      case 'bulk':
        toast.success('Ações em massa em desenvolvimento');
        break;
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.position.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = !selectedDepartment || user.departmentIds.includes(selectedDepartment);
        const matchesTeam = !selectedTeam || user.teamIds.includes(selectedTeam);
        const matchesLeader = !showOnlyLeaders || user.isLeader;

        return matchesSearch && matchesDepartment && matchesTeam && matchesLeader;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
          case 'department':
            const deptA = departments.find(d => a.departmentIds[0] === d.id)?.name || '';
            const deptB = departments.find(d => b.departmentIds[0] === d.id)?.name || '';
            return deptA.localeCompare(deptB);
          default:
            return 0;
        }
      });
  }, [users, searchTerm, selectedDepartment, selectedTeam, showOnlyLeaders, sortBy, departments]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !selectedDepartment || team.departmentId === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [teams, searchTerm, selectedDepartment]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalLeaders: users.filter(u => u.isLeader && !u.isDirector).length,
    totalDirectors: users.filter(u => u.isDirector).length,
    totalCollaborators: users.filter(u => !u.isLeader).length,
    totalTeams: teams.length,
    totalDepartments: departments.length,
  }), [users, teams, departments]);

  const renderUserCard = (user: typeof users[0]) => {
    const userTeams = teams.filter(team => user.teamIds.includes(team.id));
    const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
    const subordinates = getSubordinates(user.id);
    const leader = getLeader(user.id);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                    user.isDirector 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                      : user.isLeader 
                        ? 'bg-gradient-to-br from-primary-500 to-primary-700' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.isDirector && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.position}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEdit('user', user)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete('user', user.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          </div>
          
          {(user.isDirector || user.isLeader) && (
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                user.isDirector
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-primary-100 text-primary-800'
              }`}>
                {user.isDirector ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Diretor
                  </>
                ) : (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Líder
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm truncate">{user.email}</span>
            </div>
            
            {user.phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm">
                Desde {new Date(user.joinDate).toLocaleDateString('pt-BR', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            
            {user.age && (
              <div className="flex items-center text-gray-600">
                <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">{user.age} anos</span>
              </div>
            )}
          </div>

          {(leader || subordinates.length > 0) && (
            <div className="pt-3 border-t border-gray-100">
              {leader && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <GitBranch className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Reporta para: </span>
                  <span className="font-medium text-gray-800 ml-1">{leader.name}</span>
                </div>
              )}
              {subordinates.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <Network className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{subordinates.length} subordinado{subordinates.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}

          {userTeams.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {userTeams.map(team => (
                  <span
                    key={team.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderTeamCard = (team: typeof teams[0]) => {
    const department = getDepartmentById(team.departmentId);
    const responsible = team.responsibleId ? getUserById(team.responsibleId) : null;
    const members = users.filter(u => team.memberIds.includes(u.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-gray-600 mt-1">{team.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEdit('team', team)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete('team', team.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {department && (
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-2 text-gray-400" />
                <span>{department.name}</span>
              </div>
            )}

            {responsible && (
              <div className="flex items-center text-sm text-gray-600">
                <UserCog className="h-4 w-4 mr-2 text-gray-400" />
                <span>Responsável: {responsible.name}</span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>{members.length} membros</span>
            </div>

            {members.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map(member => (
                    <div
                      key={member.id}
                      className="relative"
                      title={member.name}
                    >
                      {member.profileImage ? (
                        <img
                          src={member.profileImage}
                          alt={member.name}
                          className="h-8 w-8 rounded-full border-2 border-white"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderDepartmentCard = (department: typeof departments[0]) => {
    const deptTeams = teams.filter(t => t.departmentId === department.id);
    const deptUsers = users.filter(u => u.departmentIds.includes(department.id));
    const responsible = department.responsibleId ? getUserById(department.responsibleId) : null;
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{department.name}</h3>
              {department.description && (
                <p className="text-sm text-gray-600 mt-1">{department.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEdit('department', department)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete('department', department.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {responsible && (
              <div className="flex items-center text-sm text-gray-600">
                <UserCog className="h-4 w-4 mr-2 text-gray-400" />
                <span>Responsável: {responsible.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>{deptTeams.length} times</span>
              </div>
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span>{deptUsers.length} pessoas</span>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Criado em {new Date(department.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 mr-3" />
                Gerenciar Usuários
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Visualize e gerencie usuários, times e departamentos
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/users/new')}
            icon={<Plus size={18} />}
            size="lg"
          >
            Novo Cadastro
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600">Usuários</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalDirectors}</p>
            <p className="text-sm text-gray-600">Diretores</p>
          </div>
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{stats.totalLeaders}</p>
            <p className="text-sm text-gray-600">Líderes</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalCollaborators}</p>
            <p className="text-sm text-gray-600">Colaboradores</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalTeams}</p>
            <p className="text-sm text-gray-600">Times</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.totalDepartments}</p>
            <p className="text-sm text-gray-600">Departamentos</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs and Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          {/* Tabs */}
          <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline-block mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'teams'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UsersIcon className="h-4 w-4 inline-block mr-2" />
              Times
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'departments'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="h-4 w-4 inline-block mr-2" />
              Departamentos
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Layers className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <BarChart className="h-4 w-4 rotate-90" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            <div className="relative group">
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleQuickAction('import')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4 inline-block mr-2" />
                  Importar dados
                </button>
                <button
                  onClick={() => handleQuickAction('export')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 inline-block mr-2" />
                  Exportar lista
                </button>
                <button
                  onClick={() => handleQuickAction('bulk')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Copy className="h-4 w-4 inline-block mr-2" />
                  Ações em massa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : activeTab === 'teams' ? 'times' : 'departamentos'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {showFilters && activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full rounded-lg border-gray-200"
                >
                  <option value="">Todos</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-lg border-gray-200"
                >
                  <option value="">Todos</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-lg border-gray-200"
                >
                  <option value="name">Nome</option>
                  <option value="date">Data de entrada</option>
                  <option value="department">Departamento</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyLeaders}
                    onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Apenas líderes</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
              >
                {filteredUsers.map(user => renderUserCard(user))}
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
              >
                {filteredTeams.map(team => renderTeamCard(team))}
              </motion.div>
            )}

            {activeTab === 'departments' && (
              <motion.div
                key="departments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
              >
                {filteredDepartments.map(dept => renderDepartmentCard(dept))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;