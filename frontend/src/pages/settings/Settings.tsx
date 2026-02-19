import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  Building,
  Eye,
  EyeOff,
  Lock,
  Palette,
  Briefcase,
  Moon,
  Sun,
  Loader2,
  Calendar,
  Shield,
  Users,
  FileText,
  BadgeCheck
} from 'lucide-react';

type SettingSection = 'profile' | 'preferences' | 'security';

const Settings = () => {
  const { user, profile, updatePassword, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Helpers
  const getRoleName = () => {
    if (profile?.is_admin) return 'Administrador';
    if (profile?.is_director) return 'Diretor';
    if (profile?.is_leader) return 'Líder';
    return 'Colaborador';
  };

  const getRoleBadgeClasses = () => {
    if (profile?.is_admin) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (profile?.is_director) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (profile?.is_leader) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  };

  const getContractLabel = (type?: string | null) => {
    switch (type) {
      case 'CLT': return 'CLT';
      case 'PJ': return 'PJ';
      case 'INTERN': return 'Estagiário';
      default: return null;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

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
      // Primeiro, verifica a senha atual fazendo um re-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        setIsLoading(false);
        return;
      }

      // Se a senha atual está correta, atualiza para a nova senha
      await updatePassword(passwordForm.newPassword);

      // Aguarda 1 segundo para o usuário ver a mensagem de sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Desloga o usuário
      await signOut();

      // Redireciona para a tela de login
      navigate('/login');

      toast.success('Por favor, faça login novamente com sua nova senha');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} aplicado!`);
  };

  // Renderização das seções
  const renderProfileSection = () => {
    const admissionDate = formatDate(profile?.admission_date) || formatDate(profile?.join_date);
    const contractLabel = getContractLabel(profile?.contract_type);
    const departmentName = profile?.department?.name;
    const teamNames = profile?.teams?.map(t => t.name).filter(Boolean);

    return (
      <motion.div
        variants={itemVariants}
        className="space-y-6"
      >
        {/* Avatar + Info Principal */}
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-400 flex-shrink-0">
            {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
              {profile?.name || 'Usuário'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {profile?.position || 'Cargo não informado'}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClasses()}`}>
                <BadgeCheck className="h-3 w-3" />
                {getRoleName()}
              </span>
              {contractLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                  <FileText className="h-3 w-3" />
                  {contractLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Informações */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Informações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email - sempre presente */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Email</p>
                <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Cargo - sempre presente */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Cargo</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{profile?.position || 'Não informado'}</p>
              </div>
            </div>

            {/* Departamento */}
            {departmentName && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                  <Building className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Departamento</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{departmentName}</p>
                </div>
              </div>
            )}

            {/* Times */}
            {teamNames && teamNames.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Time{teamNames.length > 1 ? 's' : ''}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{teamNames.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Telefone - só se preenchido */}
            {profile?.phone && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Telefone</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{profile.phone}</p>
                </div>
              </div>
            )}

            {/* Data de Admissão - só se existir */}
            {admissionDate && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Data de Admissão</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{admissionDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPreferencesSection = () => (
    <motion.div
      variants={itemVariants}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Aparência</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Tema do Sistema
          </label>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'light' as const, icon: Sun, label: 'Claro' },
              { value: 'dark' as const, icon: Moon, label: 'Escuro' }
            ].map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  theme === themeOption.value
                    ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }`}
              >
                <themeOption.icon className={`h-6 w-6 mb-2 ${
                  theme === themeOption.value
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === themeOption.value
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {themeOption.label}
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Segurança</h2>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Alterar Senha
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <p className={`text-xs mt-1 ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword
                    ? '✓ As senhas coincidem'
                    : '✗ As senhas não coincidem'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handlePasswordChange}
              disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || passwordForm.newPassword.length < 6}
              size="lg"
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
        className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 md:p-8"
      >
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center flex-wrap">
              <SettingsIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-600 dark:text-primary-400 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Configurações</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Gerencie suas informações e preferências</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <section.icon className={`h-5 w-5 mr-3 ${
                    activeSection === section.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
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
