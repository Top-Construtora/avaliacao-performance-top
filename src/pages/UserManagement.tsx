import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { 
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  Plus,
  X,
  Users,
  User,
  Mail,
  Building,
  UserCheck,
  Crown,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  type: 'colaborador' | 'lider' | 'lider-maximo';
  leaderId?: string;
  department: string;
  team: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  type: 'colaborador' | 'lider' | 'lider-maximo';
  leaderId: string;
  department: string;
  team: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  
  // Estados
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['colaborador']));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    type: 'colaborador',
    leaderId: '',
    department: '',
    team: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Dados mockados para exemplo
  const mockUsers: UserData[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      type: 'lider-maximo',
      department: 'Tecnologia',
      team: 'Gestão',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      type: 'lider',
      leaderId: '1',
      department: 'Tecnologia',
      team: 'Desenvolvimento',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@empresa.com',
      type: 'colaborador',
      leaderId: '2',
      department: 'Tecnologia',
      team: 'Desenvolvimento Frontend',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20'
    }
  ];

  useEffect(() => {
    // Carrega os usuários (aqui seria uma chamada à API)
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  useEffect(() => {
    // Aplica filtros
    let filtered = users;

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.type === filterType);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, filterType, searchTerm]);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Departamento é obrigatório';
    }

    if (!formData.team.trim()) {
      newErrors.team = 'Time é obrigatório';
    }

    if (formData.type !== 'lider-maximo' && !formData.leaderId) {
      newErrors.leaderId = 'Líder é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingUser) {
      // Atualizar usuário
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              ...formData, 
              updatedAt: new Date().toISOString().split('T')[0] 
            }
          : user
      );
      setUsers(updatedUsers);
      toast.success('Usuário atualizado com sucesso!');
    } else {
      // Criar novo usuário
      const newUser: UserData = {
        id: Date.now().toString(),
        ...formData,
        leaderId: formData.type === 'lider-maximo' ? undefined : formData.leaderId,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
      toast.success('Usuário cadastrado com sucesso!');
    }

    handleCloseModal();
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      type: user.type,
      leaderId: user.leaderId || '',
      department: user.department,
      team: user.team
    });
    setIsModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    // Verifica se há dependências
    const hasDependents = users.some(user => user.leaderId === userId);
    
    if (hasDependents) {
      toast.error('Não é possível excluir este usuário pois existem colaboradores vinculados a ele');
      return;
    }

    setUsers(users.filter(user => user.id !== userId));
    setShowDeleteConfirm(null);
    toast.success('Usuário excluído com sucesso!');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      type: 'colaborador',
      leaderId: '',
      department: '',
      team: ''
    });
    setErrors({});
  };

  const exportData = () => {
    const csvData = users.map(user => ({
      Nome: user.name,
      Email: user.email,
      Tipo: getUserTypeLabel(user.type),
      Líder: getLeaderName(user.leaderId),
      Departamento: user.department,
      Time: user.team,
      'Data de Cadastro': user.createdAt
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Dados exportados com sucesso!');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getUserTypeLabel = (type: string) => {
    const labels = {
      'colaborador': 'Colaborador',
      'lider': 'Líder',
      'lider-maximo': 'Líder Máximo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getUserTypeIcon = (type: string) => {
    if (type === 'lider-maximo') return Crown;
    if (type === 'lider') return Shield;
    return User;
  };

  const getUserTypeColor = (type: string) => {
    if (type === 'lider-maximo') return 'text-accent-600 bg-accent-50 border-accent-200';
    if (type === 'lider') return 'text-primary-600 bg-primary-50 border-primary-200';
    return 'text-secondary-600 bg-secondary-50 border-secondary-200';
  };

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return '-';
    const leader = users.find(u => u.id === leaderId);
    return leader ? leader.name : '-';
  };

  const getAvailableLeaders = () => {
    if (formData.type === 'lider-maximo') return [];
    if (formData.type === 'lider') {
      return users.filter(u => u.type === 'lider-maximo');
    }
    return users.filter(u => u.type === 'lider' || u.type === 'lider-maximo');
  };

  // Agrupa usuários por tipo
  const groupedUsers = {
    'lider-maximo': filteredUsers.filter(u => u.type === 'lider-maximo'),
    'lider': filteredUsers.filter(u => u.type === 'lider'),
    'colaborador': filteredUsers.filter(u => u.type === 'colaborador')
  };

  const stats = {
    total: users.length,
    lideresMaximos: users.filter(u => u.type === 'lider-maximo').length,
    lideres: users.filter(u => u.type === 'lider').length,
    colaboradores: users.filter(u => u.type === 'colaborador').length
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8"
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
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Cadastro de Usuários
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Gerencie colaboradores, líderes e líderes máximos
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={exportData}
              icon={<Download size={16} />}
              size="sm"
              className="w-full sm:w-auto"
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus size={16} />}
              size="sm"
              className="w-full sm:w-auto"
            >
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total de Usuários</p>
          </div>

          <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-200">
            <div className="flex items-center justify-between mb-2">
              <Crown className="h-5 w-5 text-accent-600" />
              <span className="text-2xl font-bold text-accent-700">{stats.lideresMaximos}</span>
            </div>
            <p className="text-sm text-accent-700">Líderes Máximos</p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-primary-600" />
              <span className="text-2xl font-bold text-primary-700">{stats.lideres}</span>
            </div>
            <p className="text-sm text-primary-700">Líderes</p>
          </div>

          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200">
            <div className="flex items-center justify-between mb-2">
              <User className="h-5 w-5 text-secondary-600" />
              <span className="text-2xl font-bold text-secondary-700">{stats.colaboradores}</span>
            </div>
            <p className="text-sm text-secondary-700">Colaboradores</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, departamento ou time..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              className="rounded-lg border-gray-200 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="lider-maximo">Líderes Máximos</option>
              <option value="lider">Líderes</option>
              <option value="colaborador">Colaboradores</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Users List by Type */}
      <div className="space-y-4">
        {Object.entries(groupedUsers).map(([type, typeUsers], index) => {
          const isExpanded = expandedSections.has(type);
          const TypeIcon = getUserTypeIcon(type);
          const typeLabel = getUserTypeLabel(type);
          
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(type)}
                className={`w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 ${
                  getUserTypeColor(type).split(' ')[1]
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getUserTypeColor(type)}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">{typeLabel}</h3>
                    <p className="text-sm text-gray-600">{typeUsers.length} usuários</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && typeUsers.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <th className="pb-3">Nome</th>
                              <th className="pb-3 hidden sm:table-cell">Email</th>
                              <th className="pb-3 hidden lg:table-cell">Líder</th>
                              <th className="pb-3 hidden md:table-cell">Departamento</th>
                              <th className="pb-3 hidden lg:table-cell">Time</th>
                              <th className="pb-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {typeUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center text-white font-semibold">
                                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{user.name}</p>
                                      <p className="text-xs text-gray-500 sm:hidden">{user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 hidden sm:table-cell">
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm">{user.email}</span>
                                  </div>
                                </td>
                                <td className="py-3 hidden lg:table-cell">
                                  <span className="text-sm text-gray-600">
                                    {getLeaderName(user.leaderId)}
                                  </span>
                                </td>
                                <td className="py-3 hidden md:table-cell">
                                  <span className="text-sm text-gray-600">{user.department}</span>
                                </td>
                                <td className="py-3 hidden lg:table-cell">
                                  <span className="text-sm text-gray-600">{user.team}</span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleEdit(user)}
                                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(user.id)}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isExpanded && typeUsers.length === 0 && (
                <div className="p-8 text-center border-t border-gray-100">
                  <TypeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum {typeLabel.toLowerCase()} cadastrado</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <UserPlus className="h-6 w-6 mr-3 text-primary-600" />
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Tipo de Usuário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Usuário *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'colaborador', label: 'Colaborador', icon: User },
                      { value: 'lider', label: 'Líder', icon: Shield },
                      { value: 'lider-maximo', label: 'Líder Máximo', icon: Crown }
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: option.value as any, leaderId: '' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            formData.type === option.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{option.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dados Básicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-lg border ${
                        errors.name ? 'border-red-300' : 'border-gray-200'
                      } focus:border-primary-500 focus:ring-primary-500`}
                      placeholder="Digite o nome completo"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full pl-10 rounded-lg border ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        } focus:border-primary-500 focus:ring-primary-500`}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Líder (apenas para colaboradores e líderes) */}
                {formData.type !== 'lider-maximo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Líder Responsável *
                    </label>
                    <select
                      value={formData.leaderId}
                      onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                      className={`w-full rounded-lg border ${
                        errors.leaderId ? 'border-red-300' : 'border-gray-200'
                      } focus:border-primary-500 focus:ring-primary-500`}
                    >
                      <option value="">Selecione o líder</option>
                      {getAvailableLeaders().map((leader) => (
                        <option key={leader.id} value={leader.id}>
                          {leader.name} ({getUserTypeLabel(leader.type)})
                        </option>
                      ))}
                    </select>
                    {errors.leaderId && (
                      <p className="mt-1 text-xs text-red-600">{errors.leaderId}</p>
                    )}
                  </div>
                )}

                {/* Organização */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className={`w-full pl-10 rounded-lg border ${
                          errors.department ? 'border-red-300' : 'border-gray-200'
                        } focus:border-primary-500 focus:ring-primary-500`}
                        placeholder="Ex: Tecnologia, RH, Comercial"
                      />
                    </div>
                    {errors.department && (
                      <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.team}
                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        className={`w-full pl-10 rounded-lg border ${
                          errors.team ? 'border-red-300' : 'border-gray-200'
                        } focus:border-primary-500 focus:ring-primary-500`}
                        placeholder="Ex: Desenvolvimento, Suporte, Vendas"
                      />
                    </div>
                    {errors.team && (
                      <p className="mt-1 text-xs text-red-600">{errors.team}</p>
                    )}
                  </div>
                </div>

                {/* Informação sobre hierarquia */}
                {formData.type === 'lider-maximo' && (
                  <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Crown className="h-5 w-5 text-accent-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-accent-900">Líder Máximo</h4>
                        <p className="text-xs text-accent-700 mt-1">
                          Este usuário não terá um líder superior e poderá ter líderes e colaboradores sob sua gestão.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    icon={<Save size={18} />}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(null)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(showDeleteConfirm)}
                    icon={<Trash2 size={16} />}
                    className="w-full sm:w-auto"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;