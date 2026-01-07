import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import logo from '../../../assets/images/logo.png';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [hasTokenError, setHasTokenError] = useState(false);
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');

  // Detecta se está em modo de recuperação (veio do link de email)
  useEffect(() => {
    const checkRecoveryMode = async () => {
      // DEBUG: Log completo da URL
      console.log('🔍 DEBUG - Full URL:', window.location.href);
      console.log('🔍 DEBUG - Hash:', window.location.hash);
      console.log('🔍 DEBUG - Search:', window.location.search);

      const hash = window.location.hash;
      const search = window.location.search;

      // Verifica se há erro no hash da URL (Supabase retorna erros assim)
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        console.log('❌ DEBUG - Error found:', errorCode, errorDescription);

        if (errorCode === 'otp_expired') {
          setHasTokenError(true);
          setTokenErrorMessage('O link de recuperação expirou ou é inválido');
        } else if (errorCode) {
          setHasTokenError(true);
          setTokenErrorMessage(errorDescription || 'Erro ao validar o link de recuperação');
        }
        return;
      }

      // Verifica se há access_token no hash (Supabase envia assim no link de recuperação)
      if (hash.includes('access_token=')) {
        console.log('✅ DEBUG - Token found in hash!');
        setIsRecoveryMode(true);
      }
      // NOVO: Também verifica no search params (caso o Vercel mova o hash)
      else if (search.includes('access_token=')) {
        console.log('✅ DEBUG - Token found in search params!');
        setIsRecoveryMode(true);
      }
      // Verifica também se há type=recovery nos query params
      else {
        const type = searchParams.get('type');
        if (type === 'recovery') {
          console.log('✅ DEBUG - Recovery type found!');
          setIsRecoveryMode(true);
        } else {
          console.log('⚠️ DEBUG - No token or recovery type found');
          console.log('⚠️ User may have navigated directly to this page');
        }
      }
    };

    checkRecoveryMode();
  }, [searchParams]);

  const passwordRequirements = [
    { regex: /.{6,}/, text: 'Mínimo 6 caracteres' },
    { regex: /[a-zA-Z]/, text: 'Pelo menos uma letra' },
    { regex: /[0-9]/, text: 'Pelo menos um número' },
  ];

  const checkPasswordStrength = () => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(newPassword)
    }));
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.regex.test(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de campos obrigatórios
    if (isRecoveryMode) {
      // No modo recuperação, não precisa de email nem senha atual
      if (!newPassword || !confirmPassword) {
        setError('Por favor, preencha todos os campos');
        return;
      }
    } else {
      // No modo normal, precisa de todos os campos
      if (!email || !currentPassword || !newPassword || !confirmPassword) {
        setError('Por favor, preencha todos os campos');
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isPasswordValid()) {
      setError('A nova senha não atende aos requisitos mínimos');
      return;
    }

    try {
      setIsLoading(true);

      if (isRecoveryMode) {
        // Extrai o access_token do hash da URL ou dos query params
        const hash = window.location.hash;
        const search = window.location.search;

        console.log('🔐 DEBUG - Extracting token...');
        console.log('   Hash:', hash);
        console.log('   Search:', search);

        let accessToken = null;

        // Tenta primeiro no hash (padrão do Supabase)
        if (hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token');
          console.log('✅ Token extracted from hash:', accessToken ? 'Found' : 'Not found');
        }

        // Se não encontrou no hash, tenta nos search params
        if (!accessToken && search.includes('access_token=')) {
          const params = new URLSearchParams(search);
          accessToken = params.get('access_token');
          console.log('✅ Token extracted from search params:', accessToken ? 'Found' : 'Not found');
        }

        if (!accessToken) {
          console.error('❌ DEBUG - Token not found anywhere!');
          console.error('   Full URL:', window.location.href);
          throw new Error('Token de acesso não encontrado na URL. Por favor, solicite um novo link de recuperação.');
        }

        console.log('✅ DEBUG - Token successfully extracted!');

        // Usa a API REST do Supabase diretamente
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            password: newPassword
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar senha');
        }

        // Limpa o localStorage e sessionStorage
        localStorage.removeItem('gio-auth-token');
        sessionStorage.clear();

        toast.success('Senha redefinida com sucesso! Faça login com a nova senha.');

        // Limpa o hash da URL antes de navegar
        window.history.replaceState(null, '', '/login');
        navigate('/login');
      } else {
        // Modo normal: Primeiro valida o email e senha atual
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

        if (signInError) {
          setError('Email ou senha atual incorretos');
          setIsLoading(false);
          return;
        }

        // Se a senha atual estiver correta, atualiza para a nova
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          throw updateError;
        }

        // Faz logout após trocar a senha
        await supabase.auth.signOut();

        toast.success('Senha alterada com sucesso! Faça login com a nova senha.');
        navigate('/login');
      }
    } catch (err: any) {
      // Traduz mensagens de erro do Supabase
      let errorMessage = 'Erro ao alterar senha. Tente novamente.';
      if (err.message?.includes('New password should be different')) {
        errorMessage = 'A nova senha deve ser diferente da senha atual';
      } else if (err.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = checkPasswordStrength();

  // Tela de erro quando o token expirou ou é inválido
  if (hasTokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e2938] to-[#0f151c] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Link Expirado
              </h2>
              <p className="text-gray-600 mb-6">
                {tokenErrorMessage}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-yellow-800 mb-2">
                  Por segurança, os links de recuperação expiram após um tempo.
                </p>
                <p className="text-xs text-yellow-600">
                  Solicite um novo link de recuperação para redefinir sua senha.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md"
                  style={{backgroundColor: '#1e2938'}}
                >
                  Solicitar Novo Link
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Login
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e2938] to-[#0f151c] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg"
              style={{backgroundColor: '#1e2938'}}
            >
              <img src={logo} alt="Logo" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isRecoveryMode ? 'Criar Nova Senha' : 'Redefinir Senha'}
            </h1>
            <p className="text-gray-600">
              {isRecoveryMode
                ? 'Escolha uma nova senha segura para sua conta'
                : 'Escolha uma nova senha segura para sua conta'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - Apenas no modo normal (não recovery) */}
            {!isRecoveryMode && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      error ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Senha Atual - Apenas no modo normal (não recovery) */}
            {!isRecoveryMode && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                      error ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Nova Senha */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Requisitos da Senha */}
            {newPassword && (
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
                    error && confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
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
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
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
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 py-3 px-6 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid() || newPassword !== confirmPassword}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md ${
                  isLoading || !isPasswordValid() || newPassword !== confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:opacity-90 focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98]'
                }`}
                style={!(isLoading || !isPasswordValid() || newPassword !== confirmPassword) ? {backgroundColor: '#1e2938'} : {}}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Alterando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Alterar Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}