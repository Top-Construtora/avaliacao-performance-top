import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseUsers, useSupabaseTeams, useSupabaseDepartments } from '../hooks/useSupabaseData';
import { authService } from '../services/auth.service';
import Button from '../components/Button';
import { 
  Users, Plus, Building, Shield, Mail, Calendar, 
  X, Check, AlertCircle, Briefcase, UserCheck, 
  Sparkles, Crown, User, Phone, CalendarDays, Camera, Upload,
  ArrowLeft, Eye, EyeOff, Save, Loader2, Star, Award,
  CheckCircle2, ChevronDown, Info, UserPlus, UsersIcon, Building2
} from 'lucide-react';

type TabType = 'user' | 'team' | 'department';

const UserRegistration = () => {
  const navigate = useNavigate();
  
  // Hooks do Supabase
  const { users, loading: usersLoading, reload: reloadUsers } = useSupabaseUsers();
  const { teams, loading: teamsLoading, createTeam, reload: reloadTeams } = useSupabaseTeams();
  const { departments, loading: depsLoading, createDepartment, reload: reloadDeps } = useSupabaseDepartments();

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

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (activeTab === 'user') {
      if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
      if (!formData.email.trim()) errors.email = 'Email é obrigatório';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido';
      }
      if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
      if (formData.password && formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
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

    try {
      if (activeTab === 'user') {
        // Verificar se email já existe
        const emailExists = await authService.checkEmailExists(formData.email);
        if (emailExists) {
          toast.error('Este email já está cadastrado');
          setIsLoading(false);
          return;
        }

        // Criar usuário no Supabase
        const { user, error } = await authService.createUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          name: formData.name.trim(),
          position: formData.position.trim(),
          is_leader: formData.profileType !== 'regular',
          is_director: formData.profileType === 'director',
          phone: formData.phone,
          birth_date: formData.birthDate,
          profile_image: formData.profileImage || undefined,
          reports_to: formData.reportsTo || undefined,
          team_ids: formData.profileType === 'director' ? [] : formData.teamIds,
        });

        if (error || !user) {
          console.error('Erro ao criar usuário:', error);
          setIsLoading(false);
          return;
        }

        // Recarregar lista de usuários
        await reloadUsers();

        // Limpar formulário após sucesso
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
        
        toast.success('Usuário criado com sucesso!');
        
        // Redirecionar após sucesso
        setTimeout(() => {
          navigate('/users');
        }, 1500);
        
      } else if (activeTab === 'team') {
        // Garantir que o responsável está na lista de membros
        if (!formData.teamMemberIds.includes(formData.teamResponsibleId)) {
          formData.teamMemberIds.push(formData.teamResponsibleId);
        }

        await createTeam({
          name: formData.teamName.trim(),
          department_id: formData.teamDepartmentId,
          responsible_id: formData.teamResponsibleId,
          description: formData.teamDescription.trim() || null,
        });

        await reloadTeams();
        toast.success('Time cadastrado com sucesso!');
        
        // Limpar campos do time
        setFormData(prev => ({
          ...prev,
          teamName: '',
          teamDepartmentId: '',
          teamResponsibleId: '',
          teamMemberIds: [],
          teamDescription: '',
        }));
        
      } else if (activeTab === 'department') {
        await createDepartment({
          name: formData.departmentName.trim(),
          description: formData.departmentDescription.trim() || null,
          responsible_id: formData.departmentResponsibleId,
        });

        await reloadDeps();
        toast.success('Departamento cadastrado com sucesso!');
        
        // Limpar campos do departamento
        setFormData(prev => ({
          ...prev,
          departmentName: '',
          departmentDescription: '',
          departmentGoals: '',
          departmentResponsibleId: '',
        }));
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao processar cadastro');
    } finally {
      setIsLoading(false);
    }
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
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-500" />
          Tipo de Perfil
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              value: 'regular',
              label: 'Colaborador',
              description: 'Membro da equipe com acesso padrão',
              icon: UserCheck,
              bgColor: 'bg-gradient-to-br from-secondary-50 to-secondary-100',
              borderColor: 'border-secondary-200',
              selectedBg: 'bg-gradient-to-br from-secondary-100 to-secondary-200',
              selectedBorder: 'border-secondary-400',
              iconColor: 'text-secondary-600',
              selectedIcon: 'bg-secondary-500'
            },
            {
              value: 'leader',
              label: 'Líder',
              description: 'Gerencia equipes e avaliações',
              icon: Crown,
              bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
              borderColor: 'border-primary-200',
              selectedBg: 'bg-gradient-to-br from-primary-100 to-primary-200',
              selectedBorder: 'border-primary-400',
              iconColor: 'text-primary-600',
              selectedIcon: 'bg-primary-500'
            },
            {
              value: 'director',
              label: 'Diretor',
              description: 'Acesso completo ao sistema',
              icon: Sparkles,
              bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
              borderColor: 'border-purple-200',
              selectedBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
              selectedBorder: 'border-purple-400',
              iconColor: 'text-purple-600',
              selectedIcon: 'bg-purple-500'
            }
          ].map((type) => (
            <label 
              key={type.value}
              className={`relative flex flex-col p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                formData.profileType === type.value 
                  ? `${type.selectedBg} ${type.selectedBorder} shadow-lg`
                  : `${type.bgColor} ${type.borderColor} hover:shadow-md`
              }`}
            >
              <input
                type="radio"
                name="profileType"
                value={type.value}
                checked={formData.profileType === type.value}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  profileType: e.target.value as any,
                  isLeader: e.target.value !== 'regular',
                  isDirector: e.target.value === 'director'
                })}
                className="sr-only"
              />
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${formData.profileType === type.value ? type.selectedIcon : 'bg-white'}`}>
                  <type.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.profileType === type.value ? 'text-white' : type.iconColor}`} />
                </div>
                {formData.profileType === type.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-6 w-6 sm:h-7 sm:w-7 bg-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </motion.div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">{type.label}</h4>
              <p className="text-xs sm:text-sm text-gray-600">{type.description}</p>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Profile Image */}
      <motion.div variants={itemVariants}>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-500" />
          Foto do Perfil
        </h3>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <div 
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-shadow"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.profileImage ? (
                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                  <span className="text-xs text-gray-500 font-medium">Clique aqui</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center rounded-2xl">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <p className="font-medium mb-1">Formato: JPG, PNG ou GIF</p>
            <p>Tamanho máximo: 5MB</p>
          </div>
        </div>
      </motion.div>

      {/* Basic Information */}
      <motion.div variants={itemVariants}>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-500" />
          Informações Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all ${
                formErrors.name 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome completo"
            />
            {formErrors.name && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email corporativo *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="email"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all ${
                  formErrors.email 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            {formErrors.email && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha temporária *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all pr-10 sm:pr-12 ${
                  formErrors.password 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all ${
                  formErrors.position 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Analista de Vendas"
              />
            </div>
            {formErrors.position && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formErrors.position}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="tel"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all ${
                  formErrors.phone 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
              />
            </div>
            {formErrors.phone && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de nascimento
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="date"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all ${
                  formErrors.birthDate 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            {formErrors.birthDate && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {formErrors.birthDate}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Team Selection (not for directors) */}
      {formData.profileType !== 'director' && (
        <motion.div variants={itemVariants}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-500" />
            Alocação em Times *
          </h3>
          <div className="bg-gray-50 rounded-xl p-2 max-h-48 sm:max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {teams.map(team => (
                <label key={team.id} className={`flex items-center p-3 sm:p-4 rounded-lg cursor-pointer transition-all ${
                  formData.teamIds.includes(team.id)
                    ? 'bg-primary-100 border-2 border-primary-400'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.teamIds.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, teamIds: [...formData.teamIds, team.id] });
                      } else {
                        setFormData({ ...formData, teamIds: formData.teamIds.filter(id => id !== team.id) });
                      }
                    }}
                  />
                  <span className="ml-3 sm:ml-4 flex-1">
                    <span className="font-medium text-gray-900 block text-sm sm:text-base">{team.name}</span>
                    {team.department && (
                      <span className="text-xs sm:text-sm text-gray-500">Depto: {team.department.name}</span>
                    )}
                  </span>
                  {formData.teamIds.includes(team.id) && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 ml-2" />
                  )}
                </label>
              ))}
            </div>
          </div>
          {formErrors.teams && (
            <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {formErrors.teams}
            </p>
          )}
        </motion.div>
      )}

      {/* Leader Selection (for regular collaborators) */}
      {formData.profileType === 'regular' && (
        <motion.div variants={itemVariants}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-500" />
            Hierarquia
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporta para *
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
              <select
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all appearance-none ${
                  formErrors.reportsTo 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                value={formData.reportsTo}
                onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
              >
                <option value="">Selecione um líder</option>
                {users
                  .filter(u => u.is_leader || u.is_director)
                  .map(leader => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} - {leader.position}
                    </option>
                  ))}
              </select>
            </div>
            {formErrors.reportsTo && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2 text-secondary-500" />
          Informações do Time
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Time *
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all ${
                formErrors.teamName 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300 focus:border-secondary-500 focus:ring-secondary-500'
              }`}
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="Ex: Time de Vendas Norte"
            />
            {formErrors.teamName && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.teamName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                className={`w-full pl-12 pr-10 py-3 text-base rounded-xl border-2 transition-all appearance-none ${
                  formErrors.department 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-secondary-500 focus:ring-secondary-500'
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
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.department}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável pelo Time *
            </label>
            <div className="relative">
              <Crown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                className={`w-full pl-12 pr-10 py-3 text-base rounded-xl border-2 transition-all appearance-none ${
                  formErrors.responsible 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-secondary-500 focus:ring-secondary-500'
                }`}
                value={formData.teamResponsibleId}
                onChange={(e) => setFormData({ ...formData, teamResponsibleId: e.target.value })}
              >
                <option value="">Selecione um responsável</option>
                {users
                  .filter(u => u.is_leader || u.is_director)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.position}
                    </option>
                  ))}
              </select>
            </div>
            {formErrors.responsible && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.responsible}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-secondary-500" />
          Membros do Time *
        </h3>
        <div className="bg-gray-50 rounded-xl p-2 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {users.map(user => (
              <label key={user.id} className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                formData.teamMemberIds.includes(user.id)
                  ? 'bg-secondary-100 border-2 border-secondary-400'
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                  checked={formData.teamMemberIds.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, teamMemberIds: [...formData.teamMemberIds, user.id] });
                    } else {
                      setFormData({ ...formData, teamMemberIds: formData.teamMemberIds.filter(id => id !== user.id) });
                    }
                  }}
                />
                <div className="ml-4 flex-1">
                  <span className="font-medium text-gray-900 block">{user.name}</span>
                  <span className="text-sm text-gray-500">{user.position}</span>
                </div>
                {formData.teamMemberIds.includes(user.id) && (
                  <CheckCircle2 className="h-5 w-5 text-secondary-600 ml-2" />
                )}
              </label>
            ))}
          </div>
        </div>
        {formErrors.members && (
          <p className="text-sm text-red-600 mt-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {formErrors.members}
          </p>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Time
        </label>
        <textarea
          className="w-full px-4 py-3 text-base rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 focus:border-secondary-500 focus:ring-secondary-500"
          rows={4}
          value={formData.teamDescription}
          onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
          placeholder="Descreva os objetivos e responsabilidades do time..."
        />
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
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Building className="h-5 w-5 mr-2 text-purple-500" />
          Informações do Departamento
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Departamento *
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all ${
                formErrors.departmentName 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500'
              }`}
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              placeholder="Ex: Vendas"
            />
            {formErrors.departmentName && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.departmentName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável pelo Departamento *
            </label>
            <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                className={`w-full pl-12 pr-10 py-3 text-base rounded-xl border-2 transition-all appearance-none ${
                  formErrors.responsible 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                }`}
                value={formData.departmentResponsibleId}
                onChange={(e) => setFormData({ ...formData, departmentResponsibleId: e.target.value })}
              >
                <option value="">Selecione um responsável</option>
                {users
                  .filter(u => u.is_director)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.position}
                    </option>
                  ))}
              </select>
            </div>
            {formErrors.responsible && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.responsible}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Departamento
        </label>
        <textarea
          className="w-full px-4 py-3 text-base rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          rows={4}
          value={formData.departmentDescription}
          onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
          placeholder="Descreva as responsabilidades e objetivos do departamento..."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metas e Objetivos
        </label>
        <textarea
          className="w-full px-4 py-3 text-base rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          rows={4}
          value={formData.departmentGoals}
          onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
          placeholder="Liste as principais metas do departamento..."
        />
      </motion.div>
    </motion.div>
  );

  // Loading state
  if (usersLoading || teamsLoading || depsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/users')}
            className="group flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Voltar</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-0 sm:mr-5 shadow-lg">
              <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Novo Cadastro
              </h1>
              <p className="text-gray-600 mt-1 text-base sm:text-lg">
                Adicione novos membros, times ou departamentos ao sistema
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Tipo de Cadastro</h3>
              <nav className="space-y-2">
                {[
                  { id: 'user', label: 'Novo Usuário', icon: UserPlus, color: 'primary' },
                  { id: 'team', label: 'Novo Time', icon: Users, color: 'secondary' },
                  { id: 'department', label: 'Novo Departamento', icon: Building2, color: 'purple' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${
                      activeTab === tab.id
                        ? tab.color === 'primary' 
                          ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                          : tab.color === 'secondary'
                          ? 'bg-secondary-100 text-secondary-700 border-l-4 border-secondary-500'
                          : 'bg-purple-100 text-purple-700 border-l-4 border-purple-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-xl">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mb-2" />
                <p className="text-xs sm:text-sm text-blue-800">
                  {activeTab === 'user' && 'Adicione novos colaboradores e defina suas permissões.'}
                  {activeTab === 'team' && 'Crie times e atribua membros e responsáveis.'}
                  {activeTab === 'department' && 'Organize a estrutura da empresa em departamentos.'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'user' && renderUserForm()}
                {activeTab === 'team' && renderTeamForm()}
                {activeTab === 'department' && renderDepartmentForm()}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div 
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/users')}
                  disabled={isLoading}
                  size="lg"
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  size="lg"
                  className="w-full sm:w-auto order-1 sm:order-2"
                  icon={isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Save className="h-4 w-4 sm:h-5 sm:w-5" />}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Cadastro'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;