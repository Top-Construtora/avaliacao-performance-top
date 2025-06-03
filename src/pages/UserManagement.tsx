import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Building,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Briefcase,
  UserCheck,
  UsersIcon,
  Hash,
  MoreVertical
} from 'lucide-react';

type TabType = 'users' | 'teams' | 'departments';

const UserManagement = () => {
  const { 
    users, 
    teams, 
    departments, 
    addUser, 
    updateUser, 
    deleteUser,
    addTeam,
    updateTeam,
    deleteTeam,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getUserById,
    getTeamById,
    getDepartmentById,
  } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'user' | 'team' | 'department'>('user');

  // Form states
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    position: '',
    isLeader: false,
    teamIds: [] as string[],
    departmentIds: [] as string[],
    
    // Team fields
    teamName: '',
    teamDepartmentId: '',
    teamLeaderId: '',
    teamMemberIds: [] as string[],
    
    // Department fields
    departmentName: '',
    departmentDescription: '',
  });

  const openModal = (type: 'user' | 'team' | 'department', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    
    if (item) {
      if (type === 'user') {
        setFormData({
          ...formData,
          name: item.name,
          email: item.email,
          position: item.position,
          isLeader: item.isLeader,
          teamIds: item.teamIds,
          departmentIds: item.departmentIds,
        });
      } else if (type === 'team') {
        setFormData({
          ...formData,
          teamName: item.name,
          teamDepartmentId: item.departmentId,
          teamLeaderId: item.leaderId,
          teamMemberIds: item.memberIds,
        });
      } else if (type === 'department') {
        setFormData({
          ...formData,
          departmentName: item.name,
          departmentDescription: item.description || '',
        });
      }
    } else {
      // Reset form
      setFormData({
        name: '',
        email: '',
        position: '',
        isLeader: false,
        teamIds: [],
        departmentIds: [],
        teamName: '',
        teamDepartmentId: '',
        teamLeaderId: '',
        teamMemberIds: [],
        departmentName: '',
        departmentDescription: '',
      });
    }
    
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (modalType === 'user') {
      if (!formData.name || !formData.email || !formData.position) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (formData.teamIds.length === 0) {
        toast.error('O usuário deve pertencer a pelo menos um time');
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        position: formData.position,
        isLeader: formData.isLeader,
        teamIds: formData.teamIds,
        leaderOfTeamIds: formData.isLeader ? formData.teamIds.filter(teamId => {
          const team = getTeamById(teamId);
          return team && team.leaderId === (editingItem?.id || 'new');
        }) : [],
        departmentIds: formData.departmentIds,
        joinDate: editingItem?.joinDate || new Date().toISOString().split('T')[0],
        active: true,
      };

      if (editingItem) {
        updateUser(editingItem.id, userData);
      } else {
        addUser(userData);
      }
    } else if (modalType === 'team') {
      if (!formData.teamName || !formData.teamDepartmentId || !formData.teamLeaderId) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!formData.teamMemberIds.includes(formData.teamLeaderId)) {
        formData.teamMemberIds.push(formData.teamLeaderId);
      }

      const teamData = {
        name: formData.teamName,
        departmentId: formData.teamDepartmentId,
        leaderId: formData.teamLeaderId,
        memberIds: formData.teamMemberIds,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      if (editingItem) {
        updateTeam(editingItem.id, teamData);
      } else {
        addTeam(teamData);
      }
    } else if (modalType === 'department') {
      if (!formData.departmentName) {
        toast.error('Nome do departamento é obrigatório');
        return;
      }

      const departmentData = {
        name: formData.departmentName,
        description: formData.departmentDescription,
      };

      if (editingItem) {
        updateDepartment(editingItem.id, departmentData);
      } else {
        addDepartment(departmentData);
      }
    }

    setShowModal(false);
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

  // Filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || user.departmentIds.includes(selectedDepartment);
    const matchesLeader = !showOnlyLeaders || user.isLeader;

    return matchesSearch && matchesDepartment && matchesLeader;
  });

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || team.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderUserCard = (user: typeof users[0]) => {
    const userTeams = teams.filter(team => user.teamIds.includes(team.id));
    const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-xl ${user.isLeader ? 'bg-gradient-to-br from-primary-500 to-secondary-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold shadow-md`}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.position}</p>
              {user.isLeader && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Líder
                </span>
              )}
            </div>
          </div>
          
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('user', user)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('user', user.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Desde {new Date(user.joinDate).toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="flex items-start text-gray-600">
            <UsersIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {userTeams.map(team => (
                <span key={team.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                  {team.name}
                  {user.leaderOfTeamIds.includes(team.id) && (
                    <Shield className="h-3 w-3 ml-1" />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start text-gray-600">
            <Building className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {userDepartments.map(dept => (
                <span key={dept.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTeamCard = (team: typeof teams[0]) => {
    const leader = getUserById(team.leaderId);
    const department = getDepartmentById(team.departmentId);
    const members = users.filter(user => team.memberIds.includes(user.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{team.name}</h3>
            <p className="text-sm text-gray-600">{department?.name}</p>
          </div>
          
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('team', team)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('team', team.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Líder:</span>
            <span className="ml-2 text-sm text-gray-600">{leader?.name || 'Não definido'}</span>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-2 text-secondary-600" />
              <span className="text-sm font-medium text-gray-700">Membros ({members.length}):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1.5"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-sm text-gray-700">{member.name}</span>
                  {member.id === team.leaderId && (
                    <Shield className="h-3 w-3 text-primary-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderDepartmentCard = (department: typeof departments[0]) => {
    const deptTeams = teams.filter(team => team.departmentId === department.id);
    const deptUsers = users.filter(user => user.departmentIds.includes(department.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{department.name}</h3>
            {department.description && (
              <p className="text-sm text-gray-600 mt-1">{department.description}</p>
            )}
          </div>
          
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('department', department)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('department', department.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary-600" />
              <span className="text-2xl font-bold text-primary-600">{deptTeams.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Times</p>
          </div>
          
          <div className="bg-secondary-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-secondary-600" />
              <span className="text-2xl font-bold text-secondary-600">{deptUsers.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Colaboradores</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-primary-500" />
              Gestão de Usuários
            </h1>
            <p className="text-gray-600 mt-1">Gerencie usuários, times e departamentos</p>
          </div>
          
          <Button
            variant="primary"
            onClick={() => openModal(activeTab === 'users' ? 'user' : activeTab === 'teams' ? 'team' : 'department')}
            icon={<Plus size={18} />}
          >
            Adicionar {activeTab === 'users' ? 'Usuário' : activeTab === 'teams' ? 'Time' : 'Departamento'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 mt-6 -mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Usuários ({users.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'teams'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            <span>Times ({teams.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'departments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Departamentos ({departments.length})</span>
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  className="rounded-lg border-gray-200"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">Todos os departamentos</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                
                {activeTab === 'users' && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={showOnlyLeaders}
                      onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                    />
                    <span className="text-gray-700">Apenas líderes</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {activeTab === 'users' && filteredUsers.map(user => (
            <div key={user.id}>{renderUserCard(user)}</div>
          ))}
          
          {activeTab === 'teams' && filteredTeams.map(team => (
            <div key={team.id}>{renderTeamCard(team)}</div>
          ))}
          
          {activeTab === 'departments' && filteredDepartments.map(dept => (
            <div key={dept.id}>{renderDepartmentCard(dept)}</div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingItem ? 'Editar' : 'Adicionar'} {modalType === 'user' ? 'Usuário' : modalType === 'team' ? 'Time' : 'Departamento'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {modalType === 'user' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-200"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-lg border-gray-200"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-200"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={formData.isLeader}
                        onChange={(e) => setFormData({ ...formData, isLeader: e.target.checked })}
                      />
                      <span className="text-gray-700">É líder</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times *
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {teams.map(team => (
                        <label key={team.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={formData.teamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  teamIds: [...formData.teamIds, team.id],
                                  departmentIds: [...new Set([...formData.departmentIds, team.departmentId])]
                                });
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  teamIds: formData.teamIds.filter(id => id !== team.id)
                                });
                              }
                            }}
                          />
                          <span className="text-gray-700">{team.name} ({getDepartmentById(team.departmentId)?.name})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'team' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Time *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-200"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <select
                      className="w-full rounded-lg border-gray-200"
                      value={formData.teamDepartmentId}
                      onChange={(e) => setFormData({ ...formData, teamDepartmentId: e.target.value })}
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Líder do Time *
                    </label>
                    <select
                      className="w-full rounded-lg border-gray-200"
                      value={formData.teamLeaderId}
                      onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
                    >
                      <option value="">Selecione um líder</option>
                      {users.filter(u => u.isLeader).map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membros do Time
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={formData.teamMemberIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  teamMemberIds: [...formData.teamMemberIds, user.id]
                                });
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  teamMemberIds: formData.teamMemberIds.filter(id => id !== user.id)
                                });
                              }
                            }}
                          />
                          <span className="text-gray-700">
                            {user.name} {user.id === formData.teamLeaderId && '(Líder)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'department' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Departamento *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-200"
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      className="w-full rounded-lg border-gray-200"
                      rows={3}
                      value={formData.departmentDescription}
                      onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  icon={<Check size={18} />}
                >
                  {editingItem ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;