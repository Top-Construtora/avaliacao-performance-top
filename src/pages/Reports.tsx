import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
  Users, Plus, Edit, Trash2, Search, Filter, Building, UserPlus,
  Shield, Mail, Calendar, X, Check, AlertCircle, Briefcase,
  UserCheck, UsersIcon, MoreVertical, Star, ChevronRight,
  ArrowUpDown, Sparkles, Hash, Info, ChevronLeft, Zap,
  Crown, Target, Layers, Eye, EyeOff, Copy, Download,
  FolderPlus, UserCog, MapPin, FileText, BarChart
} from 'lucide-react';

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';
type WizardStep = 'type' | 'basic' | 'role' | 'teams' | 'review';

const UserManagement = () => {
  const { 
    users, teams, departments, addUser, updateUser, deleteUser,
    addTeam, updateTeam, deleteTeam, addDepartment, updateDepartment,
    deleteDepartment, getUserById, getTeamById, getDepartmentById,
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
  const [wizardStep, setWizardStep] = useState<WizardStep>('type');
  const [showPassword, setShowPassword] = useState(false);

  // Form states with better structure
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    password: '',
    position: '',
    isLeader: false,
    isDirector: false,
    teamIds: [] as string[],
    profileType: 'regular' as 'regular' | 'leader' | 'director',
    
    // Team fields
    teamName: '',
    teamDepartmentId: '',
    teamLeaderId: '',
    teamMemberIds: [] as string[],
    teamDescription: '',
    
    // Department fields
    departmentName: '',
    departmentDescription: '',
    departmentGoals: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Quick templates
  const positionTemplates = [
    { value: 'developer', label: 'Desenvolvedor(a)', icon: '💻' },
    { value: 'designer', label: 'Designer', icon: '🎨' },
    { value: 'manager', label: 'Gerente', icon: '📊' },
    { value: 'analyst', label: 'Analista', icon: '📈' },
    { value: 'coordinator', label: 'Coordenador(a)', icon: '🎯' },
  ];

  const teamTemplates = [
    { value: 'development', label: 'Desenvolvimento', icon: '💻', description: 'Time de engenharia e desenvolvimento' },
    { value: 'design', label: 'Design', icon: '🎨', description: 'Time de design e experiência do usuário' },
    { value: 'marketing', label: 'Marketing', icon: '📢', description: 'Time de marketing e comunicação' },
    { value: 'sales', label: 'Vendas', icon: '💼', description: 'Time comercial e vendas' },
    { value: 'support', label: 'Suporte', icon: '🛟', description: 'Time de suporte ao cliente' },
  ];

  const departmentTemplates = [
    { value: 'tech', label: 'Tecnologia', icon: '💻', description: 'Desenvolvimento e Infraestrutura' },
    { value: 'people', label: 'Pessoas', icon: '👥', description: 'Recursos Humanos e Cultura' },
    { value: 'finance', label: 'Financeiro', icon: '💰', description: 'Finanças e Contabilidade' },
    { value: 'operations', label: 'Operações', icon: '⚙️', description: 'Operações e Processos' },
    { value: 'commercial', label: 'Comercial', icon: '📈', description: 'Vendas e Relacionamento' },
  ];

  // Wizard steps configuration
  const wizardSteps = modalType === 'user' ? [
    { id: 'type', label: 'Tipo', icon: UserCheck },
    { id: 'basic', label: 'Dados Básicos', icon: User },
    { id: 'role', label: 'Função', icon: Briefcase },
    { id: 'teams', label: 'Times', icon: Users },
    { id: 'review', label: 'Revisar', icon: Check },
  ] : [];

  const getCurrentStepIndex = () => wizardSteps.findIndex(s => s.id === wizardStep);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (modalType === 'user') {
      if (wizardStep === 'basic') {
        if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
        if (!formData.email.trim()) errors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Email inválido';
        }
        if (!editingItem && !formData.password.trim()) errors.password = 'Senha é obrigatória';
      } else if (wizardStep === 'role') {
        if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
      } else if (wizardStep === 'teams') {
        if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
          errors.teams = 'Selecione pelo menos um time';
        }
      }
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

  const handleNextStep = () => {
    if (validateForm()) {
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < wizardSteps.length - 1) {
        setWizardStep(wizardSteps[currentIndex + 1].id as WizardStep);
      }
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setWizardStep(wizardSteps[currentIndex - 1].id as WizardStep);
    }
  };

  const openModal = (type: 'user' | 'team' | 'department', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setFormErrors({});
    setWizardStep('type');
    
    if (item) {
      if (type === 'user') {
        setFormData({
          ...formData,
          name: item.name,
          email: item.email,
          password: '',
          position: item.position,
          isLeader: item.isLeader,
          isDirector: item.isDirector || false,
          teamIds: item.teamIds,
          profileType: item.isDirector ? 'director' : item.isLeader ? 'leader' : 'regular',
        });
      } else if (type === 'team') {
        setFormData({
          ...formData,
          teamName: item.name,
          teamDepartmentId: item.departmentId,
          teamLeaderId: item.leaderId,
          teamMemberIds: item.memberIds,
          teamDescription: item.description || '',
        });
      } else if (type === 'department') {
        setFormData({
          ...formData,
          departmentName: item.name,
          departmentDescription: item.description || '',
          departmentGoals: item.goals || '',
        });
      }
    } else {
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        position: '',
        isLeader: false,
        isDirector: false,
        teamIds: [],
        profileType: 'regular',
        teamName: '',
        teamDepartmentId: '',
        teamLeaderId: '',
        teamMemberIds: [],
        teamDescription: '',
        departmentName: '',
        departmentDescription: '',
        departmentGoals: '',
      });
    }
    
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (modalType === 'user') {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim(),
        isLeader: formData.profileType !== 'regular',
        isDirector: formData.profileType === 'director',
        teamIds: formData.profileType === 'director' ? ['team_dir'] : formData.teamIds,
        leaderOfTeamIds: formData.profileType === 'leader' ? formData.teamIds : [],
        departmentIds: formData.profileType === 'director' 
          ? departments.map(d => d.id)
          : [...new Set(formData.teamIds.map(teamId => {
              const team = getTeamById(teamId);
              return team?.departmentId;
            }).filter(Boolean) as string[])],
        joinDate: editingItem?.joinDate || new Date().toISOString().split('T')[0],
        active: true,
      };

      if (editingItem) {
        updateUser(editingItem.id, userData);
      } else {
        addUser(userData);
      }
    } else if (modalType === 'team') {
      if (!formData.teamMemberIds.includes(formData.teamLeaderId)) {
        formData.teamMemberIds.push(formData.teamLeaderId);
      }

      const teamData = {
        name: formData.teamName.trim(),
        departmentId: formData.teamDepartmentId,
        leaderId: formData.teamLeaderId,
        memberIds: formData.teamMemberIds,
        description: formData.teamDescription.trim(),
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      if (editingItem) {
        updateTeam(editingItem.id, teamData);
      } else {
        addTeam(teamData);
      }
    } else if (modalType === 'department') {
      const departmentData = {
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim(),
        goals: formData.departmentGoals.trim(),
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

  // Quick actions
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

  // Filters with better performance
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

  // Statistics with visual hierarchy
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalLeaders: users.filter(u => u.isLeader && !u.isDirector).length,
    totalDirectors: users.filter(u => u.isDirector).length,
    totalCollaborators: users.filter(u => !u.isLeader).length,
    totalTeams: teams.length,
    totalDepartments: departments.length,
  }), [users, teams, departments]);

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 'type':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Que tipo de usuário você deseja cadastrar?
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <label 
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.profileType === 'regular' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="profileType"
                  value="regular"
                  checked={formData.profileType === 'regular'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    profileType: 'regular',
                    isLeader: false,
                    isDirector: false
                  })}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div className="p-3 rounded-lg bg-gray-100 mr-4">
                    <UserCheck className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Colaborador</p>
                    <p className="text-sm text-gray-600">Membro regular da equipe</p>
                  </div>
                </div>
                {formData.profileType === 'regular' && (
                  <Check className="h-5 w-5 text-primary-600" />
                )}
              </label>

              <label 
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.profileType === 'leader' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="profileType"
                  value="leader"
                  checked={formData.profileType === 'leader'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    profileType: 'leader',
                    isLeader: true,
                    isDirector: false
                  })}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div className="p-3 rounded-lg bg-primary-100 mr-4">
                    <Crown className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Líder</p>
                    <p className="text-sm text-gray-600">Gerencia times e avalia equipes</p>
                  </div>
                </div>
                {formData.profileType === 'leader' && (
                  <Check className="h-5 w-5 text-primary-600" />
                )}
              </label>

              <label 
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.profileType === 'director' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="profileType"
                  value="director"
                  checked={formData.profileType === 'director'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    profileType: 'director',
                    isLeader: true,
                    isDirector: true
                  })}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div className="p-3 rounded-lg bg-purple-100 mr-4">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Diretor</p>
                    <p className="text-sm text-gray-600">Lidera outros líderes e departamentos</p>
                  </div>
                </div>
                {formData.profileType === 'director' && (
                  <Check className="h-5 w-5 text-purple-600" />
                )}
              </label>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Informações básicas
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-300' : ''
                }`}
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
                className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.email ? 'border-red-300' : ''
                }`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao.silva@empresa.com"
              />
              {formErrors.email && (
                <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>

            {!editingItem && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha temporária *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 pr-10 ${
                      formErrors.password ? 'border-red-300' : ''
                    }`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  O usuário deverá alterar na primeira entrada
                </p>
              </div>
            )}
          </div>
        );

      case 'role':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Cargo e função
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo *
              </label>
              
              {/* Quick templates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {positionTemplates.map(template => (
                  <button
                    key={template.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, position: template.label })}
                    className={`p-2 text-sm rounded-lg border transition-all ${
                      formData.position === template.label
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-1">{template.icon}</span>
                    {template.label}
                  </button>
                ))}
              </div>
              
              <input
                type="text"
                className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.position ? 'border-red-300' : ''
                }`}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Digite ou selecione acima"
              />
              {formErrors.position && (
                <p className="text-xs text-red-600 mt-1">{formErrors.position}</p>
              )}
            </div>

            {/* Role summary */}
            <div className={`p-4 rounded-lg ${
              formData.profileType === 'director' 
                ? 'bg-purple-50 border border-purple-200' 
                : formData.profileType === 'leader'
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-start">
                <div className="mr-3">
                  {formData.profileType === 'director' ? (
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  ) : formData.profileType === 'leader' ? (
                    <Crown className="h-5 w-5 text-primary-600" />
                  ) : (
                    <UserCheck className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">
                    {formData.profileType === 'director' 
                      ? 'Permissões de Diretor'
                      : formData.profileType === 'leader'
                        ? 'Permissões de Líder'
                        : 'Permissões de Colaborador'
                    }
                  </p>
                  <ul className="space-y-1 text-gray-600">
                    {formData.profileType === 'director' ? (
                      <>
                        <li>• Acesso a todos os departamentos</li>
                        <li>• Gerencia outros líderes</li>
                        <li>• Visualiza relatórios executivos</li>
                        <li>• Define metas organizacionais</li>
                      </>
                    ) : formData.profileType === 'leader' ? (
                      <>
                        <li>• Gerencia times específicos</li>
                        <li>• Avalia membros da equipe</li>
                        <li>• Acessa relatórios do time</li>
                        <li>• Define metas da equipe</li>
                      </>
                    ) : (
                      <>
                        <li>• Acessa suas avaliações</li>
                        <li>• Participa de times</li>
                        <li>• Visualiza metas pessoais</li>
                        <li>• Colabora em projetos</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Alocação em times
            </h3>
            
            {formData.profileType === 'director' ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">
                      Alocação automática
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      Diretores são automaticamente alocados ao time "Diretoria" e têm acesso a todos os departamentos.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar times..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 text-sm"
                    />
                  </div>
                </div>

                <div className={`border rounded-lg overflow-hidden ${
                  formErrors.teams ? 'border-red-300' : 'border-gray-200'
                }`}>
                  <div className="max-h-64 overflow-y-auto">
                    {departments.map(dept => {
                      const deptTeams = teams.filter(t => t.departmentId === dept.id && t.name !== 'Diretoria');
                      if (deptTeams.length === 0) return null;
                      
                      return (
                        <div key={dept.id} className="border-b border-gray-100 last:border-0">
                          <div className="px-4 py-2 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 flex items-center">
                              <Building className="h-4 w-4 mr-2 text-gray-500" />
                              {dept.name}
                            </p>
                          </div>
                          <div className="p-2">
                            {deptTeams.map(team => {
                              const isSelected = formData.teamIds.includes(team.id);
                              const leader = getUserById(team.leaderId);
                              
                              return (
                                <label
                                  key={team.id}
                                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-primary-50 border border-primary-200' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    checked={isSelected}
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
                                  <div className="ml-3 flex-1">
                                    <p className="font-medium text-gray-900 text-sm">
                                      {team.name}
                                    </p>
                                    <div className="flex items-center mt-1 text-xs text-gray-600">
                                      <Users className="h-3 w-3 mr-1" />
                                      {team.memberIds.length} membros
                                      {leader && (
                                        <>
                                          <span className="mx-2">•</span>
                                          <Shield className="h-3 w-3 mr-1" />
                                          {leader.name}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {formData.profileType === 'leader' && isSelected && !team.leaderId && (
                                    <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                                      Será líder
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {formErrors.teams && (
                  <p className="text-xs text-red-600">{formErrors.teams}</p>
                )}
              </>
            )}
          </div>
        );

      case 'review':
        const selectedTeams = teams.filter(t => formData.teamIds.includes(t.id));
        const selectedDepartments = [...new Set(selectedTeams.map(t => t.departmentId))].map(id => 
          departments.find(d => d.id === id)
        ).filter(Boolean);
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Confirme os dados
            </h3>
            
            <div className="space-y-4">
              {/* Profile type badge */}
              <div className="flex items-center justify-center mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                  formData.profileType === 'director'
                    ? 'bg-purple-100 text-purple-800'
                    : formData.profileType === 'leader'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.profileType === 'director' ? (
                    <Sparkles className="h-5 w-5 mr-2" />
                  ) : formData.profileType === 'leader' ? (
                    <Crown className="h-5 w-5 mr-2" />
                  ) : (
                    <UserCheck className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">
                    {formData.profileType === 'director' 
                      ? 'Diretor' 
                      : formData.profileType === 'leader'
                        ? 'Líder'
                        : 'Colaborador'
                    }
                  </span>
                </div>
              </div>

              {/* Basic info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informações básicas</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Nome:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Email:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Cargo:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.position}</dd>
                  </div>
                </dl>
              </div>

              {/* Teams allocation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Alocação</h4>
                {formData.profileType === 'director' ? (
                  <p className="text-sm text-gray-600">
                    Alocado automaticamente ao time Diretoria com acesso a todos os departamentos
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Times ({selectedTeams.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedTeams.map(team => (
                            <span
                              key={team.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-gray-200"
                            >
                              {team.name}
                              {formData.profileType === 'leader' && !team.leaderId && (
                                <Shield className="h-3 w-3 ml-1 text-primary-600" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Departamentos</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedDepartments.map(dept => dept && (
                            <span
                              key={dept.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-gray-200"
                            >
                              {dept.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTeamModal = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Time *
        </label>
        
        {/* Templates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {teamTemplates.map(template => (
            <button
              key={template.value}
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                teamName: template.label,
                teamDescription: template.description
              })}
              className={`p-3 text-left rounded-lg border transition-all ${
                formData.teamName === template.label
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{template.icon}</span>
                <span className="font-medium text-sm">{template.label}</span>
              </div>
              <p className="text-xs text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>
        
        <input
          type="text"
          className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
            formErrors.teamName ? 'border-red-300' : ''
          }`}
          value={formData.teamName}
          onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
          placeholder="Digite o nome do time"
        />
        {formErrors.teamName && (
          <p className="text-xs text-red-600 mt-1">{formErrors.teamName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Time
        </label>
        <textarea
          className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
          rows={3}
          value={formData.teamDescription}
          onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
          placeholder="Descreva as responsabilidades e objetivos do time..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Departamento *
        </label>
        <select
          className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
            formErrors.department ? 'border-red-300' : ''
          }`}
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
        
        {departments.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Nenhum departamento cadastrado. 
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setTimeout(() => openModal('department'), 100);
                }}
                className="ml-1 font-medium text-yellow-900 underline"
              >
                Criar departamento
              </button>
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Líder do Time *
        </label>
        <select
          className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
            formErrors.leader ? 'border-red-300' : ''
          }`}
          value={formData.teamLeaderId}
          onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
        >
          <option value="">Selecione um líder</option>
          {users.filter(u => u.isLeader && !u.isDirector).map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.position}
            </option>
          ))}
        </select>
        {formErrors.leader && (
          <p className="text-xs text-red-600 mt-1">{formErrors.leader}</p>
        )}
        
        {users.filter(u => u.isLeader).length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Nenhum líder disponível. Cadastre um usuário como líder primeiro.
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Membros do Time *
        </label>
        
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar colaboradores..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 text-sm"
            />
          </div>
        </div>
        
        <div className={`border rounded-lg max-h-48 overflow-y-auto ${
          formErrors.members ? 'border-red-300' : 'border-gray-200'
        }`}>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            <div className="p-2">
              {/* Quick select all */}
              <label className="flex items-center p-2 mb-2 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600"
                  checked={formData.teamMemberIds.length === users.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ 
                        ...formData, 
                        teamMemberIds: users.map(u => u.id)
                      });
                    } else {
                      setFormData({ 
                        ...formData, 
                        teamMemberIds: []
                      });
                    }
                  }}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Selecionar todos ({users.length})
                </span>
              </label>
              
              <div className="space-y-1">
                {users.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600"
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
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{user.name}</span>
                        {user.isDirector && <Sparkles className="h-3 w-3 ml-2 text-purple-600" />}
                        {user.isLeader && !user.isDirector && <Shield className="h-3 w-3 ml-2 text-primary-600" />}
                        {user.id === formData.teamLeaderId && (
                          <span className="ml-2 text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                            Líder
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{user.position}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        {formErrors.members && (
          <p className="text-xs text-red-600 mt-1">{formErrors.members}</p>
        )}
        
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Info className="h-3 w-3 mr-1" />
          <span>{formData.teamMemberIds.length} membros selecionados</span>
        </div>
      </div>
    </div>
  );

  const renderDepartmentModal = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Departamento *
        </label>
        
        {/* Templates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {departmentTemplates.map(template => (
            <button
              key={template.value}
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                departmentName: template.label,
                departmentDescription: template.description
              })}
              className={`p-3 text-left rounded-lg border transition-all ${
                formData.departmentName === template.label
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{template.icon}</span>
                <span className="font-medium text-sm">{template.label}</span>
              </div>
              <p className="text-xs text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>
        
        <input
          type="text"
          className={`w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
            formErrors.departmentName ? 'border-red-300' : ''
          }`}
          value={formData.departmentName}
          onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
          placeholder="Digite o nome do departamento"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objetivos e Metas
        </label>
        <textarea
          className="w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500"
          rows={3}
          value={formData.departmentGoals}
          onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
          placeholder="Defina os principais objetivos e metas do departamento..."
        />
      </div>

      {/* Preview */}
      {(formData.departmentName || formData.departmentDescription) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Visualização</h4>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-100 to-primary-100 mr-3">
                <Building className="h-5 w-5 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {formData.departmentName || 'Nome do Departamento'}
                </h3>
                {formData.departmentDescription && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.departmentDescription}
                  </p>
                )}
                {formData.departmentGoals && (
                  <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                    <p className="text-xs font-medium text-primary-900 mb-1">Objetivos:</p>
                    <p className="text-xs text-primary-700">
                      {formData.departmentGoals}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUserCard = (user: typeof users[0]) => {
    const userTeams = teams.filter(team => user.teamIds.includes(team.id));
    const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        {/* Header with visual hierarchy */}
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                  user.isDirector 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                    : user.isLeader 
                      ? 'bg-gradient-to-br from-primary-500 to-primary-700' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
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
                onClick={() => openModal('user', user)}
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
          
          {/* Role badge */}
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

        {/* Content with better organization */}
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm truncate">{user.email}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm">
                Desde {new Date(user.joinDate).toLocaleDateString('pt-BR', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Teams section */}
          {userTeams.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Times</p>
              <div className="flex flex-wrap gap-1.5">
                {userTeams.map(team => (
                  <span
                    key={team.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                  >
                    {team.name}
                    {user.leaderOfTeamIds?.includes(team.id) && (
                      <Shield className="h-3 w-3 ml-1 text-primary-600" />
                    )}
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
    const leader = getUserById(team.leaderId);
    const department = getDepartmentById(team.departmentId);
    const members = users.filter(user => team.memberIds.includes(user.id));
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary-100 to-primary-100 mr-3">
                <UsersIcon className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-600">{department?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => openModal('team', team)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete('team', team.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          </div>

          {/* Leader */}
          {leader && (
            <div className="mb-4 p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Líder:</span>
                <span className="ml-2 text-sm text-gray-900">{leader.name}</span>
              </div>
            </div>
          )}

          {/* Members count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>{members.length} membros</span>
            </div>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Ver todos
            </button>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
     >
       <div className="p-5">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center">
             <div className="p-2 rounded-lg bg-gradient-to-br from-accent-100 to-primary-100 mr-3">
               <Building className="h-5 w-5 text-accent-600" />
             </div>
             <div>
               <h3 className="font-semibold text-gray-900">{department.name}</h3>
               {department.description && (
                 <p className="text-sm text-gray-600">{department.description}</p>
               )}
             </div>
           </div>
           
           <div className="flex items-center space-x-1">
             <button
               onClick={() => openModal('department', department)}
               className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
               title="Editar"
             >
               <Edit className="h-4 w-4 text-gray-500" />
             </button>
             <button
               onClick={() => handleDelete('department', department.id)}
               className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
               title="Excluir"
             >
               <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
             </button>
           </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-3 gap-3 mb-4">
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-2xl font-bold text-primary-600">{deptTeams.length}</div>
             <p className="text-xs text-gray-600">Times</p>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-2xl font-bold text-secondary-600">{deptUsers.length}</div>
             <p className="text-xs text-gray-600">Pessoas</p>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-2xl font-bold text-accent-600">{deptLeaders.length}</div>
             <p className="text-xs text-gray-600">Líderes</p>
           </div>
         </div>

         {/* Teams preview */}
         {deptTeams.length > 0 && (
           <div className="flex items-center justify-between text-sm">
             <span className="text-gray-600">
               {deptTeams.slice(0, 2).map(t => t.name).join(', ')}
               {deptTeams.length > 2 && ` +${deptTeams.length - 2}`}
             </span>
             <button className="text-primary-600 hover:text-primary-700 font-medium">
               Ver times
             </button>
           </div>
         )}
       </div>
     </motion.div>
   );
 };

 return (
   <div className="space-y-6 max-w-7xl mx-auto">
     {/* Enhanced Header */}
     <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-2xl shadow-xl p-8 text-white"
     >
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
         <div>
           <h1 className="text-3xl font-bold flex items-center">
             <Users className="h-8 w-8 mr-3" />
             Gestão de Pessoas
           </h1>
           <p className="text-primary-100 mt-1">
             Gerencie colaboradores, times e departamentos de forma integrada
           </p>
         </div>
         
         {/* Quick stats */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div className="text-center">
             <div className="text-3xl font-bold">{stats.totalUsers}</div>
             <div className="text-sm text-primary-100">Total</div>
           </div>
           <div className="text-center">
             <div className="text-3xl font-bold">{stats.totalDirectors}</div>
             <div className="text-sm text-primary-100">Diretores</div>
           </div>
           <div className="text-center">
             <div className="text-3xl font-bold">{stats.totalLeaders}</div>
             <div className="text-sm text-primary-100">Líderes</div>
           </div>
           <div className="text-center">
             <div className="text-3xl font-bold">{stats.totalCollaborators}</div>
             <div className="text-sm text-primary-100">Colaboradores</div>
           </div>
         </div>
       </div>

       {/* Quick actions */}
       <div className="mt-6 flex flex-wrap gap-2">
         <button
           onClick={() => handleQuickAction('import')}
           className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
         >
           <Download className="h-4 w-4 mr-1" />
           Importar CSV
         </button>
         <button
           onClick={() => handleQuickAction('export')}
           className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
         >
           <Copy className="h-4 w-4 mr-1" />
           Exportar dados
         </button>
       </div>
     </motion.div>

     {/* Enhanced Controls */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
     >
       {/* Better tab design */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
         <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
           {[
             { id: 'users', label: 'Pessoas', icon: UserCheck, count: users.length },
             { id: 'teams', label: 'Times', icon: UsersIcon, count: teams.length },
             { id: 'departments', label: 'Departamentos', icon: Building, count: departments.length },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                 activeTab === tab.id
                   ? 'bg-white text-primary-600 shadow-sm'
                   : 'text-gray-600 hover:text-gray-800'
               }`}
             >
               <tab.icon className="h-4 w-4" />
               <span className="font-medium">{tab.label}</span>
               <span className={`px-2 py-0.5 text-xs rounded-full ${
                 activeTab === tab.id
                   ? 'bg-primary-100 text-primary-700'
                   : 'bg-gray-200 text-gray-600'
               }`}>
                 {tab.count}
               </span>
             </button>
           ))}
         </div>

         <Button
           variant="primary"
           onClick={() => openModal(activeTab === 'users' ? 'user' : activeTab === 'teams' ? 'team' : 'department')}
           icon={<Plus size={18} />}
           className="shadow-md"
         >
           Adicionar {activeTab === 'users' ? 'Pessoa' : activeTab === 'teams' ? 'Time' : 'Departamento'}
         </Button>
       </div>

       {/* Enhanced search and filters */}
       <div className="space-y-4">
         <div className="flex flex-col lg:flex-row lg:items-center gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
             <input
               type="text"
               placeholder={`Buscar ${activeTab === 'users' ? 'pessoas' : activeTab === 'teams' ? 'times' : 'departamentos'}...`}
               className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
               <button
                 onClick={() => setSearchTerm('')}
                 className="absolute right-3 top-1/2 transform -translate-y-1/2"
               >
                 <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
               </button>
             )}
           </div>
           
           <div className="flex items-center gap-2">
             <button
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
                 showFilters 
                   ? 'bg-primary-50 border-primary-300 text-primary-700' 
                   : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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

             {/* View mode toggle */}
             <div className="flex items-center border border-gray-300 rounded-lg">
               <button
                 onClick={() => setViewMode('grid')}
                 className={`p-2 ${viewMode === 'grid' ? 'text-primary-600 bg-primary-50' : 'text-gray-600'}`}
                 title="Visualização em grade"
               >
                 <Layers size={18} />
               </button>
               <button
                 onClick={() => setViewMode('list')}
                 className={`p-2 ${viewMode === 'list' ? 'text-primary-600 bg-primary-50' : 'text-gray-600'}`}
                 title="Visualização em lista"
               >
                 <Target size={18} />
               </button>
             </div>
           </div>
         </div>

         {/* Enhanced filters */}
         <AnimatePresence>
           {showFilters && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
             >
               <div className="pt-4 border-t border-gray-200">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {(activeTab === 'users' || activeTab === 'teams') && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Departamento
                       </label>
                       <select
                         className="w-full rounded-lg border-gray-200"
                         value={selectedDepartment}
                         onChange={(e) => setSelectedDepartment(e.target.value)}
                       >
                         <option value="">Todos</option>
                         {departments.map(dept => (
                           <option key={dept.id} value={dept.id}>{dept.name}</option>
                         ))}
                       </select>
                     </div>
                   )}

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
                           <option value="">Todos</option>
                           {teams.map(team => (
                             <option key={team.id} value={team.id}>{team.name}</option>
                           ))}
                         </select>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Ordenar por
                         </label>
                         <select
                           className="w-full rounded-lg border-gray-200"
                           value={sortBy}
                           onChange={(e) => setSortBy(e.target.value as any)}
                         >
                           <option value="name">Nome</option>
                           <option value="date">Data de entrada</option>
                           <option value="department">Departamento</option>
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
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     </motion.div>

     {/* Content Grid */}
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className={`grid ${
         viewMode === 'grid' 
           ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
           : 'grid-cols-1 gap-4'
       }`}
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

     {/* Empty states */}
     {activeTab === 'users' && filteredUsers.length === 0 && (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="text-center py-12"
       >
         <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
         <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pessoa encontrada</h3>
         <p className="text-gray-500 mb-4">Tente ajustar os filtros ou adicione uma nova pessoa.</p>
         <Button
           variant="primary"
           onClick={() => openModal('user')}
           icon={<Plus size={18} />}
         >
           Adicionar Pessoa
         </Button>
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
         <p className="text-gray-500 mb-4">Comece criando o primeiro time.</p>
         <Button
           variant="primary"
           onClick={() => openModal('team')}
           icon={<Plus size={18} />}
         >
           Criar Time
         </Button>
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
         <p className="text-gray-500 mb-4">Crie o primeiro departamento para começar.</p>
         <Button
           variant="primary"
           onClick={() => openModal('department')}
           icon={<Plus size={18} />}
         >
           Criar Departamento
         </Button>
       </motion.div>
     )}

     {/* Enhanced Modal */}
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
             className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Modal Header */}
             <div className="px-6 py-4 border-b border-gray-100">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center">
                   {modalType === 'user' && <UserPlus className="h-5 w-5 mr-2 text-primary-600" />}
                   {modalType === 'team' && <UsersIcon className="h-5 w-5 mr-2 text-secondary-600" />}
                   {modalType === 'department' && <Building className="h-5 w-5 mr-2 text-accent-600" />}
                   {editingItem ? 'Editar' : 'Adicionar'} {
                     modalType === 'user' ? 'Pessoa' : 
                     modalType === 'team' ? 'Time' : 
                     'Departamento'
                   }
                 </h2>
                 <button
                   onClick={() => setShowModal(false)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="h-5 w-5 text-gray-500" />
                 </button>
               </div>

               {/* Progress Steps for User */}
               {modalType === 'user' && (
                 <div className="mt-4">
                   <div className="flex items-center justify-between">
                     {wizardSteps.map((step, index) => {
                       const StepIcon = step.icon;
                       const isActive = step.id === wizardStep;
                       const isCompleted = getCurrentStepIndex() > index;
                       
                       return (
                         <div key={step.id} className="flex items-center flex-1">
                           <div
                             className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                               isActive
                                 ? 'bg-primary-600 text-white'
                                 : isCompleted
                                   ? 'bg-primary-100 text-primary-600'
                                   : 'bg-gray-100 text-gray-400'
                             }`}
                           >
                             {isCompleted ? (
                               <Check className="h-5 w-5" />
                             ) : (
                               <StepIcon className="h-5 w-5" />
                             )}
                           </div>
                           <div className="ml-2 hidden sm:block">
                             <p className={`text-sm font-medium ${
                               isActive ? 'text-gray-900' : 'text-gray-500'
                             }`}>
                               {step.label}
                             </p>
                           </div>
                           {index < wizardSteps.length - 1 && (
                             <div className={`flex-1 h-0.5 mx-4 ${
                               isCompleted ? 'bg-primary-200' : 'bg-gray-200'
                             }`} />
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-6">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={modalType === 'user' ? wizardStep : modalType}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.2 }}
                 >
                   {modalType === 'user' && renderWizardStep()}
                   {modalType === 'team' && renderTeamModal()}
                   {modalType === 'department' && renderDepartmentModal()}
                 </motion.div>
               </AnimatePresence>
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
               <div className="flex justify-between">
                 {modalType === 'user' ? (
                   <>
                     <Button
                       variant="outline"
                       onClick={getCurrentStepIndex() > 0 ? handlePreviousStep : () => setShowModal(false)}
                       icon={<ChevronLeft size={18} />}
                     >
                       {getCurrentStepIndex() > 0 ? 'Voltar' : 'Cancelar'}
                     </Button>
                     
                     {wizardStep === 'review' ? (
                       <Button
                         variant="primary"
                         onClick={handleSubmit}
                         icon={<Check size={18} />}
                       >
                         {editingItem ? 'Salvar Alterações' : 'Criar Usuário'}
                       </Button>
                     ) : (
                       <Button
                         variant="primary"
                         onClick={handleNextStep}
                         icon={<ChevronRight size={18} />}
                       >
                         Próximo
                       </Button>
                     )}
                   </>
                 ) : (
                   <>
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
                       {editingItem ? 'Salvar Alterações' : 
                         modalType === 'team' ? 'Criar Time' : 'Criar Departamento'
                       }
                     </Button>
                   </>
                 )}
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