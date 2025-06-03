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
  X,
  Check,
  AlertCircle,
  Briefcase,
  UserCheck,
  UsersIcon,
  MoreVertical,
  Star,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Hash,
  Info
} from 'lucide-react';

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';

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
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'user' | 'team' | 'department'>('user');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');

  // Form states
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    position: '',
    isLeader: false,
    isDirector: false,
    teamIds: [] as string[],
    
    // Team fields
    teamName: '',
    teamDepartmentId: '',
    teamLeaderId: '',
    teamMemberIds: [] as string[],
    
    // Department fields
    departmentName: '',
    departmentDescription: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (modalType === 'user') {
      if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
      if (!formData.email.trim()) errors.email = 'Email é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido';
      }
      if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
      if (formData.teamIds.length === 0 && !formData.isDirector) errors.teams = 'Selecione pelo menos um time';
    } else if (modalType === 'team') {
      if (!formData.teamName.trim()) errors.teamName = 'Nome do time é obrigatório';
      if (!formData.teamDepartmentId) errors.department = 'Selecione um departamento';
      if (!formData.teamLeaderId) errors.leader = 'Selecione um líder';
      if (formData.teamMemberIds.length === 0) errors.members = 'Selecione pelo menos um membro';
    } else if (modalType === 'department') {
      if (!formData.departmentName.trim()) errors.departmentName = 'Nome do departamento é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (type: 'user' | 'team' | 'department', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setFormErrors({});
    
    if (item) {
      if (type === 'user') {
        setFormData({
          ...formData,
          name: item.name,
          email: item.email,
          position: item.position,
          isLeader: item.isLeader,
          isDirector: item.isDirector || false,
          teamIds: item.teamIds,
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
        isDirector: false,
        teamIds: [],
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
    if (!validateForm()) return;

    if (modalType === 'user') {
      // Check if director team exists
      let directorTeamId = teams.find(t => t.name === 'Diretoria')?.id;
      
      // Auto-assign director to Diretoria team if director is selected
      let finalTeamIds = formData.teamIds;
      if (formData.isDirector) {
        if (!directorTeamId) {
          // Create Diretoria team if it doesn't exist
          const dirTeam = {
            name: 'Diretoria',
            departmentId: departments[0]?.id || '', // Will need a special department
            leaderId: editingItem?.id || '',
            memberIds: [],
            createdAt: new Date().toISOString(),
          };
          addTeam(dirTeam);
          directorTeamId = 'will-be-assigned'; // Temporary
        }
        // Directors only belong to Diretoria team
        finalTeamIds = [directorTeamId].filter(Boolean);
      }

      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim(),
        isLeader: formData.isLeader || formData.isDirector, // Directors are always leaders
        isDirector: formData.isDirector,
        teamIds: finalTeamIds,
        leaderOfTeamIds: formData.isLeader ? finalTeamIds.filter(teamId => {
          const team = getTeamById(teamId);
          return team && (team.leaderId === (editingItem?.id || 'new') || !team.leaderId);
        }) : [],
        departmentIds: formData.isDirector 
          ? [...new Set(departments.map(d => d.id))] // Directors belong to all departments
          : [...new Set(finalTeamIds.map(teamId => {
              const team = getTeamById(teamId);
              return team?.departmentId;
            }).filter(Boolean) as string[])],
        joinDate: editingItem?.joinDate || new Date().toISOString().split('T')[0],
        active: true,
      };

      if (editingItem) {
        updateUser(editingItem.id, userData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        addUser(userData);
        toast.success('Usuário cadastrado com sucesso!');
      }
    } else if (modalType === 'team') {
      // Ensure leader is in members
      if (!formData.teamMemberIds.includes(formData.teamLeaderId)) {
        formData.teamMemberIds.push(formData.teamLeaderId);
      }

      const teamData = {
        name: formData.teamName.trim(),
        departmentId: formData.teamDepartmentId,
        leaderId: formData.teamLeaderId,
        memberIds: formData.teamMemberIds,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      if (editingItem) {
        updateTeam(editingItem.id, teamData);
        toast.success('Time atualizado com sucesso!');
      } else {
        addTeam(teamData);
        toast.success('Time criado com sucesso!');
      }
    } else if (modalType === 'department') {
      const departmentData = {
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim(),
      };

      if (editingItem) {
        updateDepartment(editingItem.id, departmentData);
        toast.success('Departamento atualizado com sucesso!');
      } else {
        addDepartment(departmentData);
        toast.success('Departamento criado com sucesso!');
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
  const filteredUsers = users
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

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || team.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistics
  const stats = {
    totalUsers: users.length,
    totalLeaders: users.filter(u => u.isLeader).length,
    totalDirectors: users.filter(u => u.isDirector).length,
    totalTeams: teams.length,
    totalDepartments: departments.length,
  };

  const renderUserCard = (user: typeof users[0]) => {
    const userTeams = teams.filter(team => user.teamIds.includes(team.id));
    const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="relative">
              <div className={`h-12 w-12 rounded-xl ${
                user.isDirector 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                  : user.isLeader 
                    ? 'bg-gradient-to-br from-primary-500 to-secondary-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
              } flex items-center justify-center text-white font-bold shadow-md transition-transform group-hover:scale-110`}>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              {user.isDirector && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                  <Sparkles className="h-4 w-4 text-purple-500 fill-current" />
                </div>
              )}
              {user.isLeader && !user.isDirector && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{user.name}</h3>
              <p className="text-sm text-gray-600 truncate">{user.position}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.isDirector && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Diretor
                  </span>
                )}
                {user.isLeader && !user.isDirector && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Líder
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative group/menu">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('user', user)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('user', user.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
            <span className="truncate">{user.email}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
            <span>Desde {new Date(user.joinDate).toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="flex items-start text-gray-600">
            <UsersIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
            <div className="flex flex-wrap gap-1 -mt-0.5">
              {userTeams.map(team => (
                <span key={team.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-secondary-50 to-primary-50 text-secondary-700 border border-secondary-200">
                  {team.name}
                  {user.leaderOfTeamIds?.includes(team.id) && (
                    <Shield className="h-3 w-3 ml-1 text-primary-600" />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start text-gray-600">
            <Building className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
            <div className="flex flex-wrap gap-1 -mt-0.5">
              {userDepartments.map(dept => (
                <span key={dept.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-accent-50 to-primary-50 text-accent-700 border border-accent-200">
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
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary-100 to-primary-100 mr-3">
                <UsersIcon className="h-4 w-4 text-secondary-600" />
              </div>
              {team.name}
            </h3>
            <p className="text-sm text-gray-600 ml-11">{department?.name}</p>
          </div>
          
          <div className="relative group/menu">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('team', team)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('team', team.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Líder:</span>
              <span className="ml-2 text-sm text-gray-800 font-semibold">{leader?.name || 'Não definido'}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-secondary-600" />
                <span className="text-sm font-medium text-gray-700">Membros ({members.length})</span>
              </div>
              <span className="text-xs text-gray-500">
                {members.filter(m => !m.isLeader).length} colaboradores
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2 ${member.id === team.leaderId ? 'ring-1 ring-primary-200' : ''}`}
                >
                  <div className={`h-8 w-8 rounded-lg ${member.isLeader ? 'bg-gradient-to-br from-primary-400 to-secondary-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 font-medium truncate">{member.name}</span>
                      {member.id === team.leaderId && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 truncate block">{member.position}</span>
                  </div>
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
    const deptLeaders = deptUsers.filter(user => user.isLeader);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-100 to-primary-100 mr-3">
                <Building className="h-4 w-4 text-accent-600" />
              </div>
              {department.name}
            </h3>
            {department.description && (
              <p className="text-sm text-gray-600 mt-1 ml-11">{department.description}</p>
            )}
          </div>
          
          <div className="relative group/menu">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
              <button
                onClick={() => openModal('department', department)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete('department', department.id)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-primary-600">{deptTeams.length}</div>
            <p className="text-xs text-gray-600 mt-1">Times</p>
          </div>
          
          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="text-2xl font-bold text-secondary-600">{deptUsers.length}</div>
            <p className="text-xs text-gray-600 mt-1">Pessoas</p>
          </div>
          
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-accent-600" />
            </div>
            <div className="text-2xl font-bold text-accent-600">{deptLeaders.length}</div>
            <p className="text-xs text-gray-600 mt-1">Líderes</p>
          </div>
        </div>

        {deptTeams.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Times neste departamento:</p>
            <div className="flex flex-wrap gap-2">
              {deptTeams.map(team => (
                <span key={team.id} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                  {team.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
              Gestão de Pessoas
            </h1>
            <p className="text-primary-100 mt-1">Gerencie colaboradores, times e departamentos</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-primary-100">Pessoas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalDirectors}</div>
              <div className="text-xs text-primary-100">Diretores</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalLeaders - stats.totalDirectors}</div>
              <div className="text-xs text-primary-100">Líderes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <div className="text-xs text-primary-100">Times</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span className="font-medium">Pessoas ({users.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'teams'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              <span className="font-medium">Times ({teams.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'departments'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building className="h-4 w-4" />
              <span className="font-medium">Departamentos ({departments.length})</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => openModal(activeTab === 'users' ? 'user' : activeTab === 'teams' ? 'team' : 'department')}
            icon={<Plus size={18} />}
            className="w-full sm:w-auto"
          >
            Adicionar {activeTab === 'users' ? 'Pessoa' : activeTab === 'teams' ? 'Time' : 'Departamento'}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou cargo..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                <span>Filtros</span>
                {(selectedDepartment || selectedTeam || showOnlyLeaders) && (
                  <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[selectedDepartment, selectedTeam, showOnlyLeaders].filter(Boolean).length}
                  </span>
                )}
              </button>

              {activeTab === 'users' && (
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setSortBy('name')}
                    className={`p-2 ${sortBy === 'name' ? 'text-primary-600' : 'text-gray-600'}`}
                    title="Ordenar por nome"
                  >
                    <ArrowUpDown size={18} />
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border-0 text-sm focus:ring-0 pr-8"
                  >
                    <option value="name">Nome</option>
                    <option value="date">Data de entrada</option>
                    <option value="department">Departamento</option>
                  </select>
                </div>
              )}
            </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-200"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">Todos os departamentos</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {activeTab === 'users' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <select
                        className="w-full rounded-lg border-gray-200"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                      >
                        <option value="">Todos os times</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 w-full">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={showOnlyLeaders}
                          onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                        />
                        <span className="text-gray-700">Apenas líderes</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {(selectedDepartment || selectedTeam || showOnlyLeaders) && (
                <button
                  onClick={() => {
                    setSelectedDepartment('');
                    setSelectedTeam('');
                    setShowOnlyLeaders(false);
                  }}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Limpar filtros
                </button>
              )}
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

      {/* Empty States */}
      {activeTab === 'users' && filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pessoa encontrada</h3>
          <p className="text-gray-500">Tente ajustar os filtros ou adicione uma nova pessoa.</p>
        </motion.div>
      )}

      {activeTab === 'teams' && filteredTeams.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum time encontrado</h3>
          <p className="text-gray-500">Comece criando o primeiro time.</p>
        </motion.div>
      )}

      {activeTab === 'departments' && filteredDepartments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum departamento encontrado</h3>
          <p className="text-gray-500">Crie o primeiro departamento para começar.</p>
        </motion.div>
      )}

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
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    {modalType === 'user' && <UserPlus className="h-5 w-5 mr-2 text-primary-600" />}
                    {modalType === 'team' && <UsersIcon className="h-5 w-5 mr-2 text-secondary-600" />}
                    {modalType === 'department' && <Building className="h-5 w-5 mr-2 text-accent-600" />}
                    {editingItem ? 'Editar' : 'Adicionar'} {modalType === 'user' ? 'Pessoa' : modalType === 'team' ? 'Time' : 'Departamento'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {modalType === 'user' && 'Preencha os dados do colaborador'}
                    {modalType === 'team' && 'Configure o novo time'}
                    {modalType === 'department' && 'Crie um novo departamento'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Info Banner */}
              {modalType === 'user' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Regras de cadastro:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Todo colaborador deve pertencer a pelo menos um time</li>
                      <li>Diretores pertencem apenas ao time "Diretoria"</li>
                      <li>Diretores são líderes de outros líderes</li>
                      <li>Líderes podem liderar múltiplos times</li>
                      <li>Todo líder também é um colaborador</li>
                    </ul>
                  </div>
                </div>
              )}

              {modalType === 'user' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : ''}`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João Silva"
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email corporativo *
                      </label>
                      <input
                        type="email"
                        className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.email ? 'border-red-300' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="joao.silva@empresa.com"
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.position ? 'border-red-300' : ''}`}
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Ex: Desenvolvedor Frontend"
                    />
                    {formErrors.position && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.position}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        checked={formData.isLeader && !formData.isDirector}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          isLeader: e.target.checked,
                          isDirector: false // Can't be both
                        })}
                        disabled={formData.isDirector}
                      />
                      <div>
                        <span className="text-gray-700 font-medium">É líder de time</span>
                        <p className="text-xs text-gray-500">Líderes podem gerenciar e avaliar suas equipes</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        checked={formData.isDirector}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          isDirector: e.target.checked,
                          isLeader: e.target.checked // Directors are always leaders
                        })}
                      />
                      <div>
                        <span className="text-gray-700 font-medium">É diretor</span>
                        <p className="text-xs text-gray-500">Diretores lideram outros líderes e pertencem apenas à Diretoria</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times *
                    </label>
                    {formData.isDirector ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-800 font-medium">
                            Diretores pertencem automaticamente ao time "Diretoria"
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${formErrors.teams ? 'border-red-300' : 'border-gray-200'}`}>
                        {teams.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum time cadastrado. Crie um time primeiro.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {departments.map(dept => {
                              const deptTeams = teams.filter(t => t.departmentId === dept.id && t.name !== 'Diretoria');
                              if (deptTeams.length === 0) return null;
                              
                              return (
                                <div key={dept.id}>
                                  <p className="text-xs font-medium text-gray-500 mb-1">{dept.name}</p>
                                  {deptTeams.map(team => (
                                    <label key={team.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        checked={formData.teamIds.includes(team.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData({ 
                                              ...formData, 
                                              teamIds: [...formData.teamIds, team.id]
                                            });
                                          } else {
                                            setFormData({ 
                                              ...formData, 
                                              teamIds: formData.teamIds.filter(id => id !== team.id)
                                            });
                                          }
                                        }}
                                      />
                                      <div className="flex-1">
                                        <span className="text-gray-700 text-sm">{team.name}</span>
                                        {formData.isLeader && formData.teamIds.includes(team.id) && !team.leaderId && (
                                          <span className="text-xs text-primary-600 ml-2">(Será líder deste time)</span>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {formErrors.teams && !formData.isDirector && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.teams}</p>
                    )}
                  </div>
                </div>
              )}

              {modalType === 'team' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Time *
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.teamName ? 'border-red-300' : ''}`}
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      placeholder="Ex: Squad Backend"
                    />
                    {formErrors.teamName && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.teamName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <select
                      className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.department ? 'border-red-300' : ''}`}
                      value={formData.teamDepartmentId}
                      onChange={(e) => setFormData({ ...formData, teamDepartmentId: e.target.value })}
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {formErrors.department && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Líder do Time *
                    </label>
                    <select
                      className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.leader ? 'border-red-300' : ''}`}
                      value={formData.teamLeaderId}
                      onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
                    >
                      <option value="">Selecione um líder</option>
                      {users.filter(u => u.isLeader && !u.isDirector).map(user => (
                        <option key={user.id} value={user.id}>{user.name} - {user.position}</option>
                      ))}
                    </select>
                    {formErrors.leader && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.leader}</p>
                    )}
                    {users.filter(u => u.isLeader).length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Nenhum líder cadastrado. Marque um usuário como líder primeiro.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membros do Time *
                    </label>
                    <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${formErrors.members ? 'border-red-300' : 'border-gray-200'}`}>
                      {users.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhum usuário cadastrado.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {users.map(user => (
                            <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-700 text-sm">{user.name}</span>
                                  {user.isDirector && <Sparkles className="h-3 w-3 text-purple-600" />}
                                  {user.isLeader && !user.isDirector && <Shield className="h-3 w-3 text-primary-600" />}
                                  {user.id === formData.teamLeaderId && (
                                    <span className="text-xs text-primary-600">(Líder)</span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">{user.position}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {formErrors.members && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.members}</p>
                    )}
                  </div>
                </div>
              )}

              {modalType === 'department' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Departamento *
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${formErrors.departmentName ? 'border-red-300' : ''}`}
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      placeholder="Ex: Engenharia"
                    />
                    {formErrors.departmentName && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.departmentName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                      rows={3}
                      value={formData.departmentDescription}
                      onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                      placeholder="Descreva as responsabilidades deste departamento..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-8">
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
                  {editingItem ? 'Salvar Alterações' : 'Adicionar'}
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