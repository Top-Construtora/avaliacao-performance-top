import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseUsers, useSupabaseTeams, useSupabaseDepartments } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { 
  Users, Shield, Mail, Calendar, AlertCircle, Briefcase, UserCheck, 
  Sparkles, Crown, User, Phone, CalendarDays, Camera, Upload,
  ArrowLeft, Save, Loader2, CheckCircle2, ChevronDown, UserPlus,
  Edit2, X, Check, Info, Building2, Lock, Unlock
} from 'lucide-react';
import { PermissionGuard } from '../components/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const permissions = usePermissions();
  
  // Hooks do Supabase
  const { users, loading: usersLoading, updateUser, reload: reloadUsers } = useSupabaseUsers();
  const { teams, loading: teamsLoading } = useSupabaseTeams();
  const { departments, loading: depsLoading } = useSupabaseDepartments();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    isLeader: false,
    isDirector: false,
    teamIds: [] as string[],
    profileType: 'regular' as 'regular' | 'leader' | 'director',
    phone: '',
    birthDate: '',
    joinDate: '',
    profileImage: null as string | null,
    reportsTo: '',
    active: true,
  });

  const [originalData, setOriginalData] = useState(formData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar dados do usuário
  useEffect(() => {
    if (id && users.length > 0) {
      loadUserData();
    }
  }, [id, users]);

  const loadUserData = async () => {
    setLoadingUser(true);
    try {
      const user = users.find(u => u.id === id);
      
      if (!user) {
        toast.error('Usuário não encontrado');
        navigate('/users');
        return;
      }

      // Buscar times do usuário
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', id);

      const userTeamIds = teamMemberships?.map(tm => tm.team_id) || [];

      const userData = {
        name: user.name || '',
        email: user.email || '',
        position: user.position || '',
        isLeader: user.is_leader || false,
        isDirector: user.is_director || false,
        teamIds: userTeamIds,
        profileType: user.is_director ? 'director' : user.is_leader ? 'leader' : 'regular' as any,
        phone: user.phone || '',
        birthDate: user.birth_date || '',
        joinDate: user.join_date || '',
        profileImage: user.profile_image || null,
        reportsTo: user.reports_to || '',
        active: user.active !== false,
      };

      setFormData(userData);
      setOriginalData(userData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoadingUser(false);
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
    
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) errors.email = 'Email é obrigatório';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
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
    
    // Validação da data de admissão
    if (!formData.joinDate) {
      errors.joinDate = 'Data de admissão é obrigatória';
    } else {
      const joinDate = new Date(formData.joinDate);
      const today = new Date();
      
      if (joinDate > today) {
        errors.joinDate = 'Data de admissão não pode ser futura';
      }
      
      if (formData.birthDate) {
        const birthDate = new Date(formData.birthDate);
        const minWorkAge = new Date(birthDate);
        minWorkAge.setFullYear(minWorkAge.getFullYear() + 16);
        
        if (joinDate < minWorkAge) {
          errors.joinDate = 'Data de admissão inválida (colaborador teria menos de 16 anos)';
        }
      }
    }
    
    if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
      errors.teams = 'Selecione pelo menos um time';
    }
    if (formData.profileType === 'regular' && !formData.reportsTo) {
      errors.reportsTo = 'Selecione um líder';
    }

    // Validação de senha se estiver mudando
    if (showPasswordChange) {
      if (!newPassword) errors.password = 'Nova senha é obrigatória';
      if (newPassword && newPassword.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
      if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'As senhas não coincidem';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || showPasswordChange;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!hasChanges()) {
      toast('Nenhuma alteração foi feita');
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar dados do usuário
      await updateUser(id!, {
        name: formData.name.trim(),
        position: formData.position.trim(),
        is_leader: formData.profileType !== 'regular',
        is_director: formData.profileType === 'director',
        phone: formData.phone || null,
        birth_date: formData.birthDate || null,
        join_date: formData.joinDate,
        profile_image: formData.profileImage || null,
        reports_to: formData.reportsTo || null,
        active: formData.active,
      });

      // Atualizar times do usuário
      // Primeiro remove todos os times
      await supabase
        .from('team_members')
        .delete()
        .eq('user_id', id);

      // Depois adiciona os novos
      if (formData.teamIds.length > 0 && formData.profileType !== 'director') {
        const teamMembers = formData.teamIds.map(teamId => ({
          team_id: teamId,
          user_id: id!,
        }));

        await supabase
          .from('team_members')
          .insert(teamMembers);
      }

      // Atualizar senha se necessário
      if (showPasswordChange && newPassword) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          id!,
          { password: newPassword }
        );

        if (passwordError) {
          throw new Error('Erro ao atualizar senha');
        }
      }

      await reloadUsers();
      toast.success('Usuário atualizado com sucesso!');
      
      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/users');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (usersLoading || teamsLoading || depsLoading || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard resource="users" action="update">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/users')}
              className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Voltar</span>
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl flex items-center justify-center mr-4 sm:mr-5 shadow-lg dark:shadow-xl">
                  <Edit2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                    Editar Usuário
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-base sm:text-lg">
                    Atualize as informações do colaborador
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                  formData.active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {formData.active ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Inativo
                    </>
                  )}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6 sm:p-8"
          >
            <div className="space-y-8">
              {/* Profile Type Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Tipo de Perfil
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      value: 'regular',
                      label: 'Colaborador',
                      description: 'Membro da equipe com acesso padrão',
                      icon: UserCheck,
                      bgColor: 'bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20',
                      borderColor: 'border-secondary-200 dark:border-secondary-700',
                      selectedBg: 'bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800/30 dark:to-secondary-700/30',
                      selectedBorder: 'border-secondary-400 dark:border-secondary-500',
                      iconColor: 'text-secondary-600 dark:text-secondary-400',
                      selectedIcon: 'bg-secondary-500 dark:bg-secondary-600'
                    },
                    {
                      value: 'leader',
                      label: 'Líder',
                      description: 'Gerencia equipes e avaliações',
                      icon: Crown,
                      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
                      borderColor: 'border-primary-200 dark:border-primary-700',
                      selectedBg: 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800/30 dark:to-primary-700/30',
                      selectedBorder: 'border-primary-400 dark:border-primary-500',
                      iconColor: 'text-primary-600 dark:text-primary-400',
                      selectedIcon: 'bg-primary-500 dark:bg-primary-600'
                    },
                    {
                      value: 'director',
                      label: 'Diretor',
                      description: 'Acesso completo ao sistema',
                      icon: Sparkles,
                      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20',
                      borderColor: 'border-gray-400 dark:border-gray-600',
                      selectedBg: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600/30 dark:to-gray-500/30',
                      selectedBorder: 'border-gray-600 dark:border-gray-500',
                      iconColor: 'text-gray-600 dark:text-gray-400',
                      selectedIcon: 'bg-gray-800 dark:bg-gray-700'
                    }
                  ].map((type) => (
                    <label 
                      key={type.value}
                      className={`relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                        formData.profileType === type.value 
                          ? `${type.selectedBg} ${type.selectedBorder} shadow-lg dark:shadow-xl`
                          : `${type.bgColor} ${type.borderColor} hover:shadow-md dark:hover:shadow-lg`
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
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-xl ${formData.profileType === type.value ? type.selectedIcon : 'bg-white dark:bg-gray-700'}`}>
                          <type.icon className={`h-6 w-6 ${formData.profileType === type.value ? 'text-white' : type.iconColor}`} />
                        </div>
                        {formData.profileType === type.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-7 w-7 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md dark:shadow-lg"
                          >
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </motion.div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">{type.label}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Profile Image */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Foto do Perfil
                </h3>
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div 
                      className="h-28 w-28 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden cursor-pointer group shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl transition-shadow"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Clique aqui</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center rounded-2xl">
                        <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium mb-1">Formato: JPG, PNG ou GIF</p>
                    <p>Tamanho máximo: 5MB</p>
                    {formData.profileImage && (
                      <button
                        onClick={() => setFormData({ ...formData, profileImage: null })}
                        className="mt-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                        formErrors.name 
                          ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                      }`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome completo"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="email"
                        className="w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 transition-all bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                        value={formData.email}
                        disabled
                        title="Email não pode ser alterado"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Email não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        className={`w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                          formErrors.position 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                        }`}
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Ex: Analista de Vendas"
                      />
                    </div>
                    {formErrors.position && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.position}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="tel"
                        className={`w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                          formErrors.phone 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                        }`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="date"
                        className={`w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          formErrors.birthDate 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                        }`}
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    {formErrors.birthDate && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.birthDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Admissão *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="date"
                        className={`w-full pl-12 pr-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          formErrors.joinDate 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                        }`}
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {formErrors.joinDate && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.joinDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Selection (not for directors) */}
              {formData.profileType !== 'director' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                    Alocação em Times *
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {teams.map(team => (
                        <label key={team.id} className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                          formData.teamIds.includes(team.id)
                            ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-400 dark:border-primary-500'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                            checked={formData.teamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, teamIds: [...formData.teamIds, team.id] });
                              } else {
                                setFormData({ ...formData, teamIds: formData.teamIds.filter(id => id !== team.id) });
                              }
                            }}
                          />
                          <span className="ml-4 flex-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 block">{team.name}</span>
                            {team.department && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Depto: {team.department.name}</span>
                            )}
                          </span>
                          {formData.teamIds.includes(team.id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400 ml-2" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                  {formErrors.teams && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.teams}
                    </p>
                  )}
                </div>
              )}

              {/* Leader Selection (for regular collaborators) */}
              {formData.profileType === 'regular' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <UserPlus className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                    Hierarquia
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reporta para *
                    </label>
                    <div className="relative">
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <select
                        className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          formErrors.reportsTo 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                        }`}
                        value={formData.reportsTo}
                        onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                      >
                        <option value="">Selecione um líder</option>
                        {users
                          .filter(u => (u.is_leader || u.is_director) && u.id !== id)
                          .map(leader => (
                            <option key={leader.id} value={leader.id}>
                              {leader.name} - {leader.position}
                            </option>
                          ))}
                      </select>
                    </div>
                    {formErrors.reportsTo && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.reportsTo}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Account Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Configurações da Conta
                </h3>
                
                <div className="space-y-4">
                  {/* Active Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Status da Conta</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Usuários inativos não podem acessar o sistema
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, active: !formData.active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Password Change */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Alterar Senha</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Defina uma nova senha para o usuário
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(!showPasswordChange);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                      >
                        {showPasswordChange ? 'Cancelar' : 'Alterar'}
                      </button>
                    </div>

                    {showPasswordChange && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nova senha
                          </label>
                          <input
                            type="password"
                            className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                              formErrors.password 
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                          />
                          {formErrors.password && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {formErrors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirmar senha
                          </label>
                          <input
                            type="password"
                            className={`w-full px-4 py-3 text-base rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                              formErrors.confirmPassword 
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Digite a senha novamente"
                          />
                          {formErrors.confirmPassword && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {formErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {hasChanges() && (
                  <span className="flex items-center text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Alterações não salvas
                  </span>
                )}
              </div>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/users')}
                  disabled={isLoading}
                  size="lg"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading || !hasChanges()}
                  size="lg"
                  icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default UserEdit;