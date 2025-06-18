import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Eye,
  EyeOff,
  Lock,
  Palette,
  Briefcase,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
  Calendar,
  Shield
} from 'lucide-react';

interface SystemPreferences {
  theme: 'light' | 'dark' | 'system';
}

type SettingSection = 'profile' | 'preferences' | 'security';

const Settings = () => {
  const { user, profile } = useAuth();
  
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [preferences, setPreferences] = useState<SystemPreferences>({
    theme: 'light'
  });

  // Estados para senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
      description: 'Suas informações pessoais'
    },
    { 
      id: 'preferences' as SettingSection, 
      label: 'Aparência', 
      icon: Palette, 
      description: 'Personalize o visual'
    },
    { 
      id: 'security' as SettingSection, 
      label: 'Segurança', 
      icon: Shield, 
      description: 'Alterar sua senha'
    }
  ];

  // Handlers
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setPreferences({ theme });
    toast.success(`Tema ${theme === 'light' ? 'claro' : theme === 'dark' ? 'escuro' : 'do sistema'} aplicado!`);
  };

  // Renderização das seções
  const renderProfileSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Informações do Perfil</h2>
        
        {/* Avatar e Nome */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
            {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'US'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{profile?.name || 'Usuário'}</h3>
            <p className="text-gray-600">{profile?.position || 'Cargo não informado'}</p>
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user?.email || 'email@exemplo.com'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{profile?.phone || 'Não informado'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Building className="h-4 w-4" />
                <span>{profile?.department || 'Não informado'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{profile?.location || 'São Paulo, SP'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>{profile?.position || 'Não informado'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{profile?.join_date ? new Date(profile.join_date).toLocaleDateString('pt-BR') : 'Não informado'}</span>
              </div>
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
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Aparência</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Tema do Sistema
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light' as const, icon: Sun, label: 'Claro' },
              { value: 'dark' as const, icon: Moon, label: 'Escuro' },
              { value: 'system' as const, icon: Monitor, label: 'Sistema' }
            ].map((theme) => (
              <button
                key={theme.value}
                onClick={() => handleThemeChange(theme.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  preferences.theme === theme.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <theme.icon className={`h-6 w-6 mb-2 ${
                  preferences.theme === theme.value ? 'text-primary-600' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  preferences.theme === theme.value ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {theme.label}
                </span>
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
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Segurança</h2>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Alterar Senha
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Última alteração: 15/01/2024
            </span>
            <Button 
              variant="primary"
              onClick={handlePasswordChange}
              disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock size={16} />}
            >
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8"
      >
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center flex-wrap">
              <SettingsIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-500 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Configurações</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Gerencie suas informações e preferências</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <section.icon className={`h-5 w-5 mr-3 ${
                    activeSection === section.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && renderProfileSection()}
              {activeSection === 'preferences' && renderPreferencesSection()}
              {activeSection === 'security' && renderSecuritySection()}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;