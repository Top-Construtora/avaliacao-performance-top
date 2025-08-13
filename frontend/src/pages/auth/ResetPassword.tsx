import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Verificar se é primeiro login
  useEffect(() => {
    if (user?.user_metadata?.must_reset_password) {
      setIsFirstLogin(true);
    }
  }, [user]);

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'Mínimo 8 caracteres' },
    { regex: /[A-Z]/, text: 'Uma letra maiúscula' },
    { regex: /[a-z]/, text: 'Uma letra minúscula' },
    { regex: /[0-9]/, text: 'Um número' },
    { regex: /[^A-Za-z0-9]/, text: 'Um caractere especial' },
  ];

  const checkPasswordStrength = () => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.regex.test(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isPasswordValid()) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(password);
      
      toast.success(
        isFirstLogin 
          ? 'Senha definida com sucesso! Bem-vindo ao sistema!' 
          : 'Senha atualizada com sucesso!'
      );
      
      navigate('/');
    } catch (err: any) {
      setError('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = checkPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl shadow-lg"
            >
              <Key className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isFirstLogin ? 'Definir Nova Senha' : 'Redefinir Senha'}
            </h1>
            <p className="text-gray-600">
              {isFirstLogin 
                ? 'Por segurança, defina uma nova senha para seu primeiro acesso'
                : 'Escolha uma nova senha segura para sua conta'
              }
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nova Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    error ? 'border-status-danger' : 'border-naue-border-gray'
                  } focus:border-primary focus:ring-2 focus:ring-primary-light transition-all bg-white placeholder-naue-text-gray`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Requisitos da Senha */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 p-4 bg-gray-50 rounded-xl"
              >
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Requisitos da senha:
                </p>
                {requirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-2 text-sm ${
                      req.met ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    <CheckCircle className={`h-4 w-4 ${
                      req.met ? 'text-green-600' : 'text-gray-300'
                    }`} />
                    <span>{req.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    error && confirmPassword ? 'border-status-danger' : 'border-naue-border-gray'
                  } focus:border-primary focus:ring-2 focus:ring-primary-light transition-all bg-white placeholder-naue-text-gray`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-status-danger mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  As senhas não coincidem
                </p>
              )}
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-status-danger bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid() || password !== confirmPassword}
              className={`w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isLoading || !isPasswordValid() || password !== confirmPassword
                  ? 'bg-naue-text-gray cursor-not-allowed hover:transform-none hover:shadow-none focus:ring-naue-text-gray'
                  : 'bg-primary hover:bg-primary-hover focus:ring-primary-500'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Atualizando...
                </span>
              ) : (
                'Definir Nova Senha'
              )}
            </button>

            {/* Link para voltar */}
            {!isFirstLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}