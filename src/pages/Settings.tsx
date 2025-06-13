import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../context/AuthContext';
import { 
  ArrowLeft,
  Save,
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Eye,
  EyeOff,
  Edit,
  X,
  Lock,
  Download,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  RotateCcw,
  Bell,
  Shield,
  Palette,
  Languages,
  Calendar,
  Clock,
  CheckCircle,
  Briefcase,
  Users,
  ChevronRight,
  Globe,
  Moon,
  Sun,
  Monitor,
  ToggleLeft,
  ToggleRight,
  FileText,
  Activity,
  Key,
  UserCheck,
  Loader2
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  avatar?: string;
  biography?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  evaluationReminders: boolean;
  consensusAlerts: boolean;
  deadlineWarnings: boolean;
  teamUpdates: boolean;
}

interface SystemPreferences {
  language: 'pt-BR' | 'en-US' | 'es-ES';
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 'sunday' | 'monday';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
}

type SettingSection = 'profile' | 'notifications' | 'preferences' | 'security' | 'data' | 'advanced';

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isDirector, isLeader, role } = useUserRole();
  
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para as diferentes seções
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: profile?.name || 'Usuário',
    email: user?.email || 'email@exemplo.com',
    phone: profile?.phone || '',
    position: profile?.position || '',
    department: profile?.department || '',
    location: profile?.location || 'São Paulo, SP - Brasil',
    biography: profile?.biography || ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    evaluationReminders: true,
    consensusAlerts: true,
    deadlineWarnings: true,
    teamUpdates: false
  });

  const [preferences, setPreferences] = useState<SystemPreferences>({
    language: 'pt-BR',
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 'monday'
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true
  });

  // Animações
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
        stiffness: 100
      }
    }
  };

  // Navegação lateral
  const settingSections = [
    { 
      id: 'profile' as SettingSection, 
      label: 'Perfil', 
      icon: User, 
      description: 'Informações pessoais e dados de contato' 
    },
    { 
      id: 'notifications' as SettingSection, 
      label: 'Notificações', 
      icon: Bell, 
      description: 'Alertas e comunicações do sistema' 
    },
    { 
      id: 'preferences' as SettingSection, 
      label: 'Preferências', 
      icon: Palette, 
      description: 'Idioma, tema e formatos de exibição' 
    },
    { 
      id: 'security' as SettingSection, 
      label: 'Segurança', 
      icon: Shield, 
      description: 'Senha, autenticação e privacidade' 
    },
    { 
      id: 'data' as SettingSection, 
      label: 'Dados', 
      icon: Database, 
      description: 'Exportação, importação e backup' 
    },
    ...(isDirector ? [{
      id: 'advanced' as SettingSection,
      label: 'Avançado',
      icon: Activity,
      description: 'Configurações administrativas do sistema'
    }] : [])
  ];

  // Handlers
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula salvamento
      
      toast.success('Configurações salvas com sucesso!');
      setUnsavedChanges(false);
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    toast('Configurações restauradas aos valores padrão');
    setUnsavedChanges(false);
    // Reset aos valores padrão
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Dados exportados com sucesso!');
      // Simula download
      const link = document.createElement('a');
      link.download = `avaliacoes_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      toast.error('Erro ao exportar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success('Dados importados com sucesso!');
        } catch (error) {
          toast.error('Erro ao importar dados');
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Conta excluída com sucesso');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao excluir conta');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateProfileField = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const toggleNotification = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
    setUnsavedChanges(true);
  };

  // Renderização das seções
  const renderProfileSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8 space-y-6 lg:space-y-0">
        {/* Avatar Section */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl">
              {userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 group">
              <Edit className="h-4 w-4 text-gray-600 group-hover:text-primary-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Informações Pessoais</h3>
            <Button
              variant={isEditing ? "outline" : "primary"}
              onClick={() => setIsEditing(!isEditing)}
              icon={isEditing ? <X size={16} /> : <Edit size={16} />}
              size="sm"
              disabled={isLoading}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => updateProfileField('name', e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => updateProfileField('email', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => updateProfileField('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="+55 (11) 99999-9999"
                  className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={userProfile.position}
                  onChange={(e) => updateProfileField('position', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={userProfile.department}
                  onChange={(e) => updateProfileField('department', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={userProfile.location}
                  onChange={(e) => updateProfileField('location', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Biografia */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biografia
            </label>
            <textarea
              value={userProfile.biography}
              onChange={(e) => updateProfileField('biography', e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="Conte um pouco sobre você..."
              className="w-full rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderNotificationsSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Preferências de Notificação</h3>
        
        <div className="space-y-4">
          {/* Canais de Notificação */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Canais de Notificação
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-sm text-gray-500">Receba notificações por email</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Push</p>
                    <p className="text-sm text-gray-500">Notificações no navegador</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Tipos de Notificação */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Tipos de Notificação
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Lembretes de Avaliação</p>
                    <p className="text-sm text-gray-500">Alertas sobre prazos de avaliações</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('evaluationReminders')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.evaluationReminders ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.evaluationReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Alertas de Consenso</p>
                    <p className="text-sm text-gray-500">Notificações sobre reuniões de consenso</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('consensusAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.consensusAlerts ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.consensusAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Avisos de Prazo</p>
                    <p className="text-sm text-gray-500">Alertas sobre prazos próximos</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('deadlineWarnings')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.deadlineWarnings ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.deadlineWarnings ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Atualizações da Equipe</p>
                    <p className="text-sm text-gray-500">Novidades sobre sua equipe</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('teamUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.teamUpdates ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.teamUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderPreferencesSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Preferências do Sistema</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Languages className="inline h-4 w-4 mr-2 text-gray-400" />
            Idioma
          </label>
          <select
            value={preferences.language}
            onChange={(e) => {
              setPreferences(prev => ({ ...prev, language: e.target.value as SystemPreferences['language'] }));
              setUnsavedChanges(true);
            }}
            className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        {/* Tema */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="inline h-4 w-4 mr-2 text-gray-400" />
            Tema
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: 'Claro' },
              { value: 'dark' as const, icon: Moon, label: 'Escuro' },
              { value: 'system' as const, icon: Monitor, label: 'Sistema' }
            ].map((theme) => (
              <button
                key={theme.value}
                onClick={() => {
                  setPreferences(prev => ({ ...prev, theme: theme.value }));
                  setUnsavedChanges(true);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  preferences.theme === theme.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <theme.icon className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formato de Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-2 text-gray-400" />
            Formato de Data
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => {
              setPreferences(prev => ({ ...prev, dateFormat: e.target.value as SystemPreferences['dateFormat'] }));
              setUnsavedChanges(true);
            }}
            className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="DD/MM/YYYY">DD/MM/AAAA</option>
            <option value="MM/DD/YYYY">MM/DD/AAAA</option>
            <option value="YYYY-MM-DD">AAAA-MM-DD</option>
          </select>
        </div>

        {/* Formato de Hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-2 text-gray-400" />
            Formato de Hora
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: '24h' as const, label: '24 horas' },
              { value: '12h' as const, label: '12 horas' }
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => {
                  setPreferences(prev => ({ ...prev, timeFormat: format.value }));
                  setUnsavedChanges(true);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.timeFormat === format.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primeiro dia da semana */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-2 text-gray-400" />
            Primeiro dia da semana
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'sunday' as const, label: 'Domingo' },
              { value: 'monday' as const, label: 'Segunda-feira' }
            ].map((day) => (
              <button
                key={day.value}
                onClick={() => {
                  setPreferences(prev => ({ ...prev, firstDayOfWeek: day.value }));
                  setUnsavedChanges(true);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.firstDayOfWeek === day.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{day.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSecuritySection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Segurança e Privacidade</h3>
      
      {/* Alterar Senha */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center">
          <Lock className="h-4 w-4 mr-2" />
          Alterar Senha
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pr-10 rounded-lg border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              className="w-full rounded-lg border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Digite sua nova senha"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              className="w-full rounded-lg border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Confirme sua nova senha"
            />
          </div>
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Última alteração: 15/01/2024
          </div>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            Alterar Senha
          </Button>
        </div>
      </div>

      {/* Configurações de Segurança */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Configurações de Segurança
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-800">Autenticação de Dois Fatores</p>
                <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
                setUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-800">Notificações de Login</p>
                <p className="text-sm text-gray-500">Receba alertas sobre novos acessos</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSecurity(prev => ({ ...prev, loginNotifications: !prev.loginNotifications }));
                setUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.loginNotifications ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  security.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo de Sessão (minutos)
            </label>
            <input
              type="number"
              value={security.sessionTimeout}
              onChange={(e) => {
                setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }));
                setUnsavedChanges(true);
              }}
              min="5"
              max="120"
              className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiração de Senha (dias)
            </label>
            <input
              type="number"
              value={security.passwordExpiry}
              onChange={(e) => {
                setSecurity(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }));
                setUnsavedChanges(true);
              }}
              min="30"
              max="365"
              className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDataSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Gerenciamento de Dados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportData}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl hover:border-primary-300 transition-all group"
        >
          <div className="p-4 bg-white rounded-xl shadow-sm mb-3 group-hover:shadow-md transition-shadow">
            <Download className="h-8 w-8 text-primary-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Exportar Dados</h4>
          <p className="text-sm text-gray-600 text-center">
            Baixe suas avaliações e informações
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleImportData}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 border-2 border-secondary-200 rounded-xl hover:border-secondary-300 transition-all group"
        >
          <div className="p-4 bg-white rounded-xl shadow-sm mb-3 group-hover:shadow-md transition-shadow">
            <Upload className="h-8 w-8 text-secondary-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Importar Dados</h4>
          <p className="text-sm text-gray-600 text-center">
            Carregue dados de avaliações anteriores
          </p>
        </motion.button>
      </div>

      {/* Zona de Perigo */}
      <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
        <h4 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Zona de Perigo
        </h4>
        <p className="text-sm text-red-700 mb-4">
          Ações irreversíveis. Proceda com cautela.
        </p>
        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(true)}
          className="border-red-300 text-red-600 hover:bg-red-100"
          icon={<Trash2 size={16} />}
        >
          Excluir Conta
        </Button>
      </div>
    </motion.div>
  );

  const renderAdvancedSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Configurações Administrativas</h3>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Área Restrita</p>
            <p className="text-sm text-amber-700 mt-1">
              Estas configurações afetam todo o sistema. Alterações inadequadas podem causar problemas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Ciclos de Avaliação</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração do Ciclo (meses)
              </label>
              <input
                type="number"
                defaultValue="6"
                min="1"
                max="12"
                className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Consenso (dias)
              </label>
              <input
                type="number"
                defaultValue="30"
                min="7"
                max="90"
                className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Permissões Globais</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Colaboradores podem ver avaliações de pares
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Líderes podem editar PDI dos subordinados
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Permitir autoavaliação fora do prazo
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-4">Logs de Auditoria</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Últimas Atividades</span>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>
              Exportar Logs
            </Button>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Admin</span> alterou configurações de ciclo • 2 horas atrás
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Sistema</span> backup automático realizado • 1 dia atrás
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Admin</span> atualizou permissões globais • 3 dias atrás
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-4 sm:space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                  <SettingsIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                Configurações
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Gerencie suas informações e preferências do sistema
              </p>
            </div>
          </div>
          
          {unsavedChanges && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto"
            >
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg w-full sm:w-auto">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Alterações não salvas</span>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  icon={<RotateCcw size={16} />}
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  Desfazer
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <section.icon className={`h-5 w-5 mr-3 ${
                    activeSection === section.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{section.description}</p>
                  </div>
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && renderProfileSection()}
              {activeSection === 'notifications' && renderNotificationsSection()}
              {activeSection === 'preferences' && renderPreferencesSection()}
              {activeSection === 'security' && renderSecuritySection()}
              {activeSection === 'data' && renderDataSection()}
              {activeSection === 'advanced' && isDirector && renderAdvancedSection()}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-xl mr-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Excluir Conta</h3>
                  <p className="text-sm text-gray-600">Esta ação é irreversível</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir sua conta? Todos os seus dados serão permanentemente removidos.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Excluindo...' : 'Excluir Conta'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;