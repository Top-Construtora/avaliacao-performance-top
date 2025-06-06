import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Button from '../components/Button';
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
  RotateCcw
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  avatar?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Luiz',
    email: 'exemplo@empresa.com',
    phone: '+55 (11) 99999-9999',
    position: 'Exemplo de Cargo',
    department: 'Exemplo',
    location: 'São Paulo, SP - Brasil'
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
    setUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleReset = () => {
    toast('Configurações restauradas aos valores padrão');
    setUnsavedChanges(false);
  };

  const handleExportData = () => {
    toast.success('Dados exportados com sucesso!');
  };

  const handleImportData = () => {
    toast.success('Dados importados com sucesso!');
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 mr-3">
                  <SettingsIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                Configurações
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie suas informações pessoais</p>
            </div>
          </div>
          
          {unsavedChanges && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
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
                >
                  Desfazer
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  icon={<Save size={16} />}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Perfil do Usuário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6 lg:space-y-0">
          {/* Avatar Section */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg">
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <Edit className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Informações Pessoais</h2>
              <Button
                variant={isEditing ? "outline" : "primary"}
                onClick={() => setIsEditing(!isEditing)}
                icon={isEditing ? <X size={16} /> : <Edit size={16} />}
                size="sm"
                className="w-full sm:w-auto"
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
                  onChange={(e) => updateProfile('name', e.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
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
                    onChange={(e) => updateProfile('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
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
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={userProfile.position}
                    onChange={(e) => updateProfile('position', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <select
                  value={userProfile.department}
                  onChange={(e) => updateProfile('department', e.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                >
                  <option value="People & Management">People & Management</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
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
                    onChange={(e) => updateProfile('location', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 rounded-lg border-gray-200 bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Alteração de senha */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <Lock className="h-5 w-5 mr-2 text-primary-600" />
          Alterar Senha
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pr-10 rounded-lg border-gray-200 transition-all duration-200"
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
              className="w-full rounded-lg border-gray-200 transition-all duration-200"
              placeholder="Digite sua nova senha"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              className="w-full rounded-lg border-gray-200 transition-all duration-200"
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
      </motion.div>

      {/* Gerenciamento de Dados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <Database className="h-5 w-5 mr-2 text-accent-600" />
          Gerenciamento de Dados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={handleExportData}
            icon={<Download size={16} />}
            size="lg"
            className="flex-col h-auto py-4"
          >
            <span className="font-medium">Exportar Dados</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleImportData}
            icon={<Upload size={16} />}
            size="lg"
            className="flex-col h-auto py-4"
          >
            <span className="font-medium">Importar Dados</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => toast.error('Esta ação requer confirmação administrativa')}
            icon={<Trash2 size={16} />}
            size="lg"
            className="flex-col h-auto py-4 border-red-200 text-red-600 hover:bg-red-50"
          >
            <span className="font-medium">Excluir Conta</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;