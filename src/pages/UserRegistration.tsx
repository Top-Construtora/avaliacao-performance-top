import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
  Users, Plus, Building, FilePlus, Shield, Mail, Calendar, 
  X, Check, AlertCircle, Briefcase, UserCheck, UsersIcon, 
  Sparkles, Crown, User, Phone, CalendarDays, Camera, Upload,
  GitBranch, Network, ArrowLeft, Eye, EyeOff, UserCog, Save,
  Zap, Target, Star, Hash, MapPin, FileText, Award, MessageSquare,
  ChevronRight, Info, HelpCircle, Loader2, CheckCircle2
} from 'lucide-react';

type TabType = 'user' | 'team' | 'department';

const UserRegistration = () => {
  const navigate = useNavigate();
  const { 
    users, teams, departments, addUser, addTeam, addDepartment,
    getUserById, getTeamById, getDepartmentById,
    addHierarchicalRelation, calculateAge
  } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    phone: '',
    birthDate: '',
    profileImage: null as string | null,
    reportsTo: '',
    
    // Team fields
    teamName: '',
    teamDepartmentId: '',
    teamResponsibleId: '',
    teamMemberIds: [] as string[],
    teamDescription: '',
    
    // Department fields
    departmentName: '',
    departmentDescription: '',
    departmentGoals: '',
    departmentResponsibleId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
        toast.success('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const positionTemplates = [
    { value: 'developer', label: 'Desenvolvedor(a)', icon: '💻', color: 'from-blue-500 to-blue-600' },
    { value: 'designer', label: 'Designer', icon: '🎨', color: 'from-purple-500 to-purple-600' },
    { value: 'manager', label: 'Gerente', icon: '📊', color: 'from-green-500 to-green-600' },
    { value: 'analyst', label: 'Analista', icon: '📈', color: 'from-orange-500 to-orange-600' },
    { value: 'coordinator', label: 'Coordenador(a)', icon: '🎯', color: 'from-red-500 to-red-600' },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (activeTab === 'user') {
      if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
      if (!formData.email.trim()) errors.email = 'Email é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido';
      }
      if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
      if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
      if (formData.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.phone)) {
        errors.phone = 'Telefone inválido';
      }
      if (formData.birthDate) {
        const age = calculateAge(formData.birthDate);
        if (age < 16) errors.birthDate = 'Idade mínima: 16 anos';
        if (age > 100) errors.birthDate = 'Data de nascimento inválida';
      }
      if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
        errors.teams = 'Selecione pelo menos um time';
      }
      if (formData.profileType === 'regular' && !formData.reportsTo) {
        errors.reportsTo = 'Selecione um líder';
      }
    } else if (activeTab === 'team') {
      if (!formData.teamName.trim()) errors.teamName = 'Nome do time é obrigatório';
      if (!formData.teamDepartmentId) errors.department = 'Selecione um departamento';
      if (!formData.teamResponsibleId) errors.responsible = 'Selecione um responsável';
      if (formData.teamMemberIds.length === 0) errors.members = 'Selecione pelo menos um membro';
    } else if (activeTab === 'department') {
      if (!formData.departmentName.trim()) errors.departmentName = 'Nome do departamento é obrigatório';
      if (!formData.departmentResponsibleId) errors.responsible = 'Selecione um responsável';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (activeTab === 'user') {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim(),
        isLeader: formData.profileType !== 'regular',
        isDirector: formData.profileType === 'director',
        teamIds: formData.profileType === 'director' ? ['team_dir'] : formData.teamIds,
        leaderOfTeamIds: [],
        departmentIds: formData.profileType === 'director' 
          ? departments.map(d => d.id)
          : [...new Set(formData.teamIds.map(teamId => {
              const team = getTeamById(teamId);
              return team?.departmentId;
            }).filter(Boolean) as string[])],
        joinDate: new Date().toISOString().split('T')[0],
        active: true,
        phone: formData.phone,
        birthDate: formData.birthDate,
        profileImage: formData.profileImage,
        reportsTo: formData.reportsTo || undefined,
        directReports: [],
      };

      addUser({ ...userData, profileImage: userData.profileImage ?? undefined });
      
      if (formData.reportsTo) {
        const teamId = formData.teamIds[0] || teams[0].id;
        const newUserId = `user${Date.now()}`;
        setTimeout(() => {
          addHierarchicalRelation({
            leaderId: formData.reportsTo,
            subordinateId: newUserId
          });
        }, 100);
      }

      toast.success('Usuário cadastrado com sucesso!');
    } else if (activeTab === 'team') {
      if (!formData.teamMemberIds.includes(formData.teamResponsibleId)) {
        formData.teamMemberIds.push(formData.teamResponsibleId);
      }

      const teamData = {
        name: formData.teamName.trim(),
        departmentId: formData.teamDepartmentId,
        responsibleId: formData.teamResponsibleId,
        memberIds: formData.teamMemberIds,
        description: formData.teamDescription.trim(),
        createdAt: new Date().toISOString(),
      };

      addTeam(teamData);
      toast.success('Time cadastrado com sucesso!');
    } else if (activeTab === 'department') {
      const departmentData = {
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim(),
        responsibleId: formData.departmentResponsibleId,
      };

      addDepartment(departmentData);
      toast.success('Departamento cadastrado com sucesso!');
    }

    setIsLoading(false);

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
      phone: '',
      birthDate: '',
      profileImage: null,
      reportsTo: '',
      teamName: '',
      teamDepartmentId: '',
      teamResponsibleId: '',
      teamMemberIds: [],
      teamDescription: '',
      departmentName: '',
      departmentDescription: '',
      departmentGoals: '',
      departmentResponsibleId: '',
    });
    setFormErrors({});
  };

  const renderUserForm = () => (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Type Selection */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Tipo de Usuário
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              value: 'regular',
              label: 'Colaborador',
              description: 'Membro da equipe',
              icon: UserCheck,
              gradient: 'from-secondary-500 to-secondary-600',
              bgGradient: 'from-secondary-50 to-secondary-100',
              borderColor: 'border-secondary-300',
              iconBg: 'bg-secondary-100',
              iconColor: 'text-secondary-600'
            },
            {
              value: 'leader',
              label: 'Líder',
              description: 'Lidera equipes',
              icon: Crown,
              gradient: 'from-primary-500 to-primary-600',
              bgGradient: 'from-primary-50 to-primary-100',
              borderColor: 'border-primary-300',
              iconBg: 'bg-primary-100',
              iconColor: 'text-primary-600'
            },
            {
              value: 'director',
              label: 'Diretor',
              description: 'Lidera líderes',
              icon: Sparkles,
              gradient: 'from-purple-500 to-purple-600',
              bgGradient: 'from-purple-50 to-purple-100',
              borderColor: 'border-purple-300',
              iconBg: 'bg-purple-100',
              iconColor: 'text-purple-600'
            }
          ].map((type) => (
            <label 
              key={type.value}
              className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                formData.profileType === type.value 
                  ? `bg-gradient-to-br ${type.bgGradient} ${type.borderColor} shadow-lg` 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="profileType"
                value={type.value}
                checked={formData.profileType === type.value}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  profileType: type.value as any,
                  isLeader: type.value !== 'regular',
                  isDirector: type.value === 'director'
                })}
                className="sr-only"
              />
              <div className="flex items-center flex-1">
                <div className={`p-3 rounded-xl ${type.iconBg} mr-4`}>
                  <type.icon className={`h-6 w-6 ${type.iconColor}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{type.description}</p>
                </div>
              </div>
              {formData.profileType === type.value && (
                <div className={`absolute top-3 right-3 p-1.5 rounded-full bg-gradient-to-br ${type.gradient} shadow-md`}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </label>
          ))}
        </div>
      </motion.div>

      {/* Basic Information */}
      <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <User className="h-5 w-5 mr-2 text-primary-500" />
          Informações Básicas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              className={`w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                formErrors.name ? 'border-red-300 bg-red-50' : ''
              }`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
            />
            {formErrors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email corporativo *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.email ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao.silva@empresa.com"
              />
            </div>
            {formErrors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha temporária *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 pr-10 ${
                  formErrors.password ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cargo *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {positionTemplates.slice(0, 3).map(template => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, position: template.label })}
                  className={`p-2.5 text-xs rounded-xl border-2 transition-all transform hover:scale-105 ${
                    formData.position === template.label
                      ? `border-primary-500 bg-gradient-to-r ${template.color} text-white shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="mr-1">{template.icon}</span>
                  <span className="font-medium">{template.label}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.position ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Digite ou selecione acima"
              />
            </div>
            {formErrors.position && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.position}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary-500" />
          Informações Pessoais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Foto de perfil
            </label>
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {formData.profileImage ? (
                    <img 
                      src={formData.profileImage} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profileImage: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar foto
                </button>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF até 5MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.phone ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(11) 98765-4321"
                maxLength={15}
              />
            </div>
            {formErrors.phone && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data de nascimento
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.birthDate ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
              />
            </div>
            {formErrors.birthDate && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.birthDate}
              </p>
            )}
            {formData.birthDate && (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Idade: {calculateAge(formData.birthDate)} anos
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Team Assignment */}
      {formData.profileType !== 'director' && (
        <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-primary-500" />
            Alocação em Times
          </h3>
          
          <div className={`border-2 rounded-xl overflow-hidden ${
            formErrors.teams ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {departments.map(dept => {
                const deptTeams = teams.filter(t => t.departmentId === dept.id && t.name !== 'Diretoria');
                if (deptTeams.length === 0) return null;
                
                return (
                  <div key={dept.id} className="border-b border-gray-100 last:border-0">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <p className="text-sm font-semibold text-gray-700 flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-500" />
                        {dept.name}
                      </p>
                    </div>
                    <div className="p-3 space-y-2">
                      {deptTeams.map(team => {
                        const isSelected = formData.teamIds.includes(team.id);
                        const responsible = team.responsibleId ? getUserById(team.responsibleId) : undefined;
                        
                        return (
                          <label
                            key={team.id}
                            className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 shadow-sm' 
                                : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 shadow-sm"
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
                              <p className="font-semibold text-gray-900 text-sm">
                                {team.name}
                              </p>
                              <div className="flex items-center mt-1 text-xs text-gray-600">
                                <Users className="h-3 w-3 mr-1" />
                                {team.memberIds.length} membros
                                {responsible && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <UserCog className="h-3 w-3 mr-1" />
                                    {responsible.name}
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-primary-600" />
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
            <p className="text-xs text-red-600 mt-2 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {formErrors.teams}
            </p>
          )}
        </motion.div>
      )}

      {/* Hierarchy */}
      {formData.profileType === 'regular' && (
        <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <GitBranch className="h-5 w-5 mr-2 text-primary-500" />
            Hierarquia
          </h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reporta para *
            </label>
            <div className="relative">
              <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.reportsTo ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.reportsTo}
                onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
              >
                <option value="">Selecione seu líder direto</option>
                {users
                  .filter(u => (u.isLeader || u.isDirector) && u.id !== formData.email)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.position}
                      {user.isDirector && ' (Diretor)'}
                    </option>
                  ))}
              </select>
            </div>
            {formErrors.reportsTo && (
              <p className="text-xs text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.reportsTo}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderTeamForm = () => (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary-500" />
          Informações do Time
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Time *
            </label>
            <input
              type="text"
              className={`w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                formErrors.teamName ? 'border-red-300 bg-red-50' : ''
              }`}
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="Ex: Backend, Frontend, UX Research"
            />
            {formErrors.teamName && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.teamName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Departamento *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.department ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.teamDepartmentId}
                onChange={(e) => setFormData({ ...formData, teamDepartmentId: e.target.value })}
              >
                <option value="">Selecione um departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            {formErrors.department && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.department}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                className="w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                rows={3}
                value={formData.teamDescription}
                onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
                placeholder="Descreva as responsabilidades e objetivos do time..."
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <UserCog className="h-5 w-5 mr-2 text-primary-500" />
          Responsável e Membros
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Responsável pelo Time *
            </label>
            <div className="relative">
              <Crown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.responsible ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.teamResponsibleId}
                onChange={(e) => setFormData({ ...formData, teamResponsibleId: e.target.value })}
              >
                <option value="">Selecione o responsável</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.position}
                    {user.isDirector && ' (Diretor)'}
                    {user.isLeader && !user.isDirector && ' (Líder)'}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.responsible && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.responsible}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Membros do Time *
            </label>
            <div className={`border-2 rounded-xl overflow-hidden ${
              formErrors.members ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}>
              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {users.map(user => {
                  const isSelected = formData.teamMemberIds.includes(user.id);
                  
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 shadow-sm' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 shadow-sm"
                        checked={isSelected}
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
                      <div className="ml-3 flex-1 flex items-center">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center mt-0.5">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {user.position}
                            {user.id === formData.teamResponsibleId && (
                              <span className="ml-2 text-primary-600 font-semibold">(Responsável)</span>
                            )}
                          </p>
                        </div>
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="h-10 w-10 rounded-xl ml-4"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-sm font-bold text-white ml-4">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary-600 ml-2" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
            {formErrors.members && (
              <p className="text-xs text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.members}
              </p>
            )}
            
            {formData.teamMemberIds.length > 0 && (
              <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-sm text-primary-700 font-medium">
                  {formData.teamMemberIds.length} {formData.teamMemberIds.length === 1 ? 'membro selecionado' : 'membros selecionados'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderDepartmentForm = () => (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary-500" />
          Informações do Departamento
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Departamento *
            </label>
            <input
              type="text"
              className={`w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                formErrors.departmentName ? 'border-red-300 bg-red-50' : ''
              }`}
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              placeholder="Ex: Engenharia, Design, Comercial"
            />
            {formErrors.departmentName && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.departmentName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                className="w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                rows={3}
                value={formData.departmentDescription}
                onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                placeholder="Descreva as responsabilidades do departamento..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Objetivos e Metas
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                className="w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                rows={3}
                value={formData.departmentGoals}
                onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
                placeholder="Defina os principais objetivos do departamento..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Responsável pelo Departamento *
            </label>
            <div className="relative">
              <Crown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className={`w-full pl-10 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 ${
                  formErrors.responsible ? 'border-red-300 bg-red-50' : ''
                }`}
                value={formData.departmentResponsibleId}
                onChange={(e) => setFormData({ ...formData, departmentResponsibleId: e.target.value })}
              >
                <option value="">Selecione o responsável</option>
                {users.filter(u => u.isLeader || u.isDirector).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.position}
                    {user.isDirector && ' (Diretor)'}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.responsible && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.responsible}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FilePlus className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 mr-3" />
              Novo Cadastro
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Cadastre novos usuários, times ou departamentos
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
        {/* Tabs */}
        <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl mb-8">
          {[
            { id: 'user', label: 'Usuário', icon: User, color: 'text-secondary-600' },
            { id: 'team', label: 'Time', icon: UsersIcon, color: 'text-primary-600' },
            { id: 'department', label: 'Departamento', icon: Building, color: 'text-accent-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : ''}`} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'user' && (
            <motion.div
              key="user"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderUserForm()}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderTeamForm()}
            </motion.div>
          )}

          {activeTab === 'department' && (
            <motion.div
              key="department"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderDepartmentForm()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-8 border-t border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/users')}
            size="lg"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            icon={isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : `Salvar ${activeTab === 'user' ? 'Usuário' : activeTab === 'team' ? 'Time' : 'Departamento'}`}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default UserRegistration;