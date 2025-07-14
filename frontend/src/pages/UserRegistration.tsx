import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  User, Users, Shield, Check, Calendar, Phone, Mail, 
  Upload, X, Save, Loader2, Building, GitBranch, 
  Briefcase, Layers, DollarSign, FileText
} from 'lucide-react';
import Button from '../components/Button';
import { authService } from '../services/auth.service';
import { departmentsService } from '../services/departments.service';
import { salaryService, CareerTrack, TrackPosition, SalaryLevel } from '../services/salary.service';
import { useUsers } from '../context/UserContext';

interface FormData {
  // Dados básicos
  name: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  joinDate: string;
  profileImage: string | null;
  profileType: 'regular' | 'leader' | 'director';
  isLeader: boolean;
  isDirector: boolean;
  reportsTo: string;
  
  // Dados de cargo e salário
  department_id: string;
  track_id: string;
  track_position_id: string;
  salary_level_id: string;
  contract_type: 'CLT' | 'PJ';
  base_salary: number;
  current_salary: number;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

const UserRegistration = () => {
  const navigate = useNavigate();
  const { reloadUsers, users } = useUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    joinDate: new Date().toISOString().split('T')[0],
    profileImage: null,
    profileType: 'regular',
    isLeader: false,
    isDirector: false,
    reportsTo: '',
    department_id: '',
    track_id: '',
    track_position_id: '',
    salary_level_id: '',
    contract_type: 'CLT',
    base_salary: 0,
    current_salary: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estados para dados auxiliares
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [trackPositions, setTrackPositions] = useState<TrackPosition[]>([]);
  const [salaryLevels, setSalaryLevels] = useState<SalaryLevel[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      loadTracksByDepartment();
    } else {
      setTracks([]);
      setFormData(prev => ({ ...prev, track_id: '', track_position_id: '', salary_level_id: '' }));
    }
  }, [formData.department_id]);

  useEffect(() => {
    if (formData.track_id) {
      loadPositionsByTrack();
    } else {
      setTrackPositions([]);
      setFormData(prev => ({ ...prev, track_position_id: '', salary_level_id: '' }));
    }
  }, [formData.track_id]);

  useEffect(() => {
    if (formData.track_position_id && formData.salary_level_id) {
      calculateSalary();
    }
  }, [formData.track_position_id, formData.salary_level_id]);

  useEffect(() => {
    filterLeadershipByType();
  }, [users, formData.profileType]);

  const loadInitialData = async () => {
    try {
      const [depsData, levelsData] = await Promise.all([
        departmentsService.getDepartments(),
        salaryService.getLevels()
      ]);
      
      setDepartments(depsData.filter((d: any) => d.active !== false));
      setSalaryLevels(levelsData.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const loadTracksByDepartment = async () => {
    try {
      const tracksData = await salaryService.getTracksByDepartment(formData.department_id);
      setTracks(tracksData.filter(t => t.active));
    } catch (error) {
      console.error('Erro ao carregar trilhas:', error);
      setTracks([]);
    }
  };

  const loadPositionsByTrack = async () => {
    try {
      const positionsData = await salaryService.getPositionsByTrack(formData.track_id);
      setTrackPositions(positionsData.filter(p => p.active).sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      setTrackPositions([]);
    }
  };

  const calculateSalary = async () => {
    const position = trackPositions.find(p => p.id === formData.track_position_id);
    const level = salaryLevels.find(l => l.id === formData.salary_level_id);
    
    if (position && level) {
      const baseSalary = position.base_salary;
      const calculatedSalary = baseSalary * (1 + level.percentage / 100);
      
      setFormData(prev => ({
        ...prev,
        base_salary: baseSalary,
        current_salary: calculatedSalary
      }));
    }
  };

  const filterLeadershipByType = () => {
    if (!users) return;
    
    const leadersData = users.filter(u => u.is_leader && !u.is_director && u.active);
    const directorsData = users.filter(u => u.is_director && u.active);
    
    setLeaders(leadersData);
    setDirectors(directorsData);
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
    
    // Validações básicas
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) errors.email = 'Email é obrigatório';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    // Validações de cargo e salário
    if (!formData.department_id) errors.department = 'Departamento é obrigatório';
    if (!formData.track_id) errors.track = 'Trilha é obrigatória';
    if (!formData.track_position_id) errors.position = 'Cargo é obrigatório';
    if (!formData.salary_level_id) errors.level = 'Nível é obrigatório';
    if (!formData.contract_type) errors.contract = 'Tipo de contrato é obrigatório';
    
    // Validações de liderança
    if (formData.profileType === 'regular' && !formData.reportsTo) {
      errors.reportsTo = 'Selecione um líder';
    }
    if (formData.profileType === 'leader' && !formData.reportsTo) {
      errors.reportsTo = 'Selecione um diretor';
    }
    
    // Validações de data
    if (!formData.joinDate) {
      errors.joinDate = 'Data de admissão é obrigatória';
    }
    
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      if (age < 16) errors.birthDate = 'Idade mínima: 16 anos';
      if (age > 100) errors.birthDate = 'Data de nascimento inválida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Verificar se email já existe
      const emailExists = await authService.checkEmailExists(formData.email);
      if (emailExists) {
        toast.error('Este email já está cadastrado');
        setIsLoading(false);
        return;
      }

      // Criar usuário com todos os dados
      const { user, error } = await authService.createUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        position: trackPositions.find(p => p.id === formData.track_position_id)?.position?.name || '',
        is_leader: formData.profileType !== 'regular',
        is_director: formData.profileType === 'director',
        phone: formData.phone,
        birth_date: formData.birthDate,
        join_date: formData.joinDate,
        profile_image: formData.profileImage || undefined,
        reports_to: formData.reportsTo || undefined,
        // Dados de salário
        track_position_id: formData.track_position_id,
        salary_level_id: formData.salary_level_id,
        base_salary: formData.base_salary,
        current_salary: formData.current_salary,
        contract_type: formData.contract_type,
      });

      if (error || !user) {
        console.error('Erro ao criar usuário:', error);
        toast.error('Erro ao criar usuário');
        setIsLoading(false);
        return;
      }

      await reloadUsers();
      toast.success('Usuário criado com sucesso!');
      
      setTimeout(() => {
        navigate('/users');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const profileTypes = [
    {
      value: 'regular',
      label: 'Colaborador',
      description: 'Membro da equipe sem responsabilidades de liderança',
      icon: User,
      gradient: 'from-blue-500 to-blue-600',
      selectedBg: 'bg-blue-50 dark:bg-blue-900/20',
      selectedBorder: 'border-blue-300 dark:border-blue-700',
      selectedText: 'text-blue-700 dark:text-blue-300'
    },
    {
      value: 'leader',
      label: 'Líder',
      description: 'Responsável por liderar times e reportar aos diretores',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      selectedBg: 'bg-purple-50 dark:bg-purple-900/20',
      selectedBorder: 'border-purple-300 dark:border-purple-700',
      selectedText: 'text-purple-700 dark:text-purple-300'
    },
    {
      value: 'director',
      label: 'Diretor',
      description: 'Responsável estratégico com visão completa do sistema',
      icon: Shield,
      gradient: 'from-amber-500 to-amber-600',
      selectedBg: 'bg-amber-50 dark:bg-amber-900/20',
      selectedBorder: 'border-amber-300 dark:border-amber-700',
      selectedText: 'text-amber-700 dark:text-amber-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastrar Novo Usuário
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Preencha as informações para criar um novo usuário no sistema
          </p>
        </motion.div>

        {/* Tipo de Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Tipo de Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profileTypes.map((type) => (
              <label
                key={type.value}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.profileType === type.value
                    ? `${type.selectedBg} ${type.selectedBorder} shadow-lg`
                    : 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-600'
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
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${type.gradient}`}>
                    <type.icon className="h-5 w-5 text-white" />
                  </div>
                  {formData.profileType === type.value && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{type.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{type.description}</p>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Informações Básicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Informações Básicas
          </h3>

          {/* Foto do Perfil */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto do Perfil
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="h-24 w-24 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profileImage: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="João da Silva"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="joao@empresa.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Mínimo 6 caracteres"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {formErrors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.birthDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Admissão *
              </label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.joinDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {formErrors.joinDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.joinDate}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Cargo e Salário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
            Cargo e Salário
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.department ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              >
                <option value="">Selecione um departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {formErrors.department && (
                <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trilha de Carreira *
              </label>
              <select
                value={formData.track_id}
                onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                disabled={!formData.department_id}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.track ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  !formData.department_id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Selecione uma trilha</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>{track.name}</option>
                ))}
              </select>
              {formErrors.track && (
                <p className="mt-1 text-sm text-red-600">{formErrors.track}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo *
              </label>
              <select
                value={formData.track_position_id}
                onChange={(e) => setFormData({ ...formData, track_position_id: e.target.value })}
                disabled={!formData.track_id}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.position ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  !formData.track_id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Selecione um cargo</option>
                {trackPositions.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.position?.name || 'Cargo não encontrado'}
                  </option>
                ))}
              </select>
              {formErrors.position && (
                <p className="mt-1 text-sm text-red-600">{formErrors.position}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nível Salarial *
              </label>
              <select
                value={formData.salary_level_id}
                onChange={(e) => setFormData({ ...formData, salary_level_id: e.target.value })}
                disabled={!formData.track_position_id}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.level ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  !formData.track_position_id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Selecione um nível</option>
                {salaryLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    Nível {level.name} {level.percentage > 0 && `(+${level.percentage}%)`}
                  </option>
                ))}
              </select>
              {formErrors.level && (
                <p className="mt-1 text-sm text-red-600">{formErrors.level}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Contrato *
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as 'CLT' | 'PJ' })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.contract ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </select>
              {formErrors.contract && (
                <p className="mt-1 text-sm text-red-600">{formErrors.contract}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Salário Calculado
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={formData.current_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Preview do salário */}
          {formData.base_salary > 0 && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <p className="text-sm text-purple-800 dark:text-purple-300">
                <strong>Salário Base:</strong> R$ {formData.base_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {' • '}
                <strong>Salário Final:</strong> R$ {formData.current_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </motion.div>

        {/* Hierarquia */}
        {(formData.profileType === 'regular' || formData.profileType === 'leader') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Hierarquia
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.profileType === 'regular' ? 'Reporta para (Líder)' : 'Reporta para (Diretor)'} *
              </label>
              <select
                value={formData.reportsTo}
                onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  formErrors.reportsTo ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              >
                <option value="">Selecione</option>
                {(formData.profileType === 'regular' ? leaders : directors).map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} - {person.position}
                  </option>
                ))}
              </select>
              {formErrors.reportsTo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.reportsTo}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Botões de Ação */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
        >
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/users')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            >
              {isLoading ? 'Salvando...' : 'Salvar Cadastro'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserRegistration;