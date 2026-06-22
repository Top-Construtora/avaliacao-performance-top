import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Mail,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import gioWordmark from '@/assets/images/gio-wordmark.png';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// gio — Identidade v4.0: fundo obsidian + grade blueprint + card com vidro e barra lime.
const INVERT_TO_WHITE = 'invert(1) brightness(1.1)';

const blueprintBackground = {
  backgroundImage: `linear-gradient(rgba(210,255,0,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(210,255,0,.05) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)`,
  backgroundSize: '90px 90px, 90px 90px, 22.5px 22.5px, 22.5px 22.5px',
  maskImage: 'radial-gradient(ellipse 100% 100% at 50% 45%, black 30%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 45%, black 30%, transparent 100%)',
} as const;

// Estilo compartilhado dos inputs (vidro sobre obsidian, focus lime)
const inputClass =
  'h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] pl-10 pr-12 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)]';

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
      const hash = window.location.hash;
      const search = window.location.search;

      // Verifica se há erro no hash da URL (Supabase retorna erros assim)
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

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
        setIsRecoveryMode(true);
      }
      // Também verifica no search params (caso o Vercel mova o hash)
      else if (search.includes('access_token=')) {
        setIsRecoveryMode(true);
      }
      // Verifica também se há type=recovery nos query params
      else {
        const type = searchParams.get('type');
        if (type === 'recovery') {
          setIsRecoveryMode(true);
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
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(newPassword),
    }));
  };

  const isPasswordValid = () => {
    return passwordRequirements.every((req) => req.regex.test(newPassword));
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

        let accessToken = null;

        // Tenta primeiro no hash (padrão do Supabase)
        if (hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token');
        }

        // Se não encontrou no hash, tenta nos search params
        if (!accessToken && search.includes('access_token=')) {
          const params = new URLSearchParams(search);
          accessToken = params.get('access_token');
        }

        if (!accessToken) {
          throw new Error(
            'Token de acesso não encontrado na URL. Por favor, solicite um novo link de recuperação.',
          );
        }

        // Usa a API REST do Supabase diretamente
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            password: newPassword,
          }),
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
          password: newPassword,
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
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A] text-white">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={blueprintBackground}
        />
        <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-[430px] max-w-[calc(100%-48px)] sm:max-w-[calc(100%-80px)]"
          >
            <div
              className="relative rounded-[20px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-10 pb-10 pt-11 shadow-[0_32px_64px_rgba(0,0,0,0.35)]"
              style={{
                backdropFilter: 'blur(28px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
              }}
            >
              <div className="absolute -top-px left-10 right-10 h-0.5 rounded-b-[4px] bg-[#D2FF00] opacity-90" />
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,80,80,0.3)] bg-[rgba(255,80,80,0.12)]">
                  <AlertCircle className="h-9 w-9 text-[#ff9090]" />
                </div>
                <h2 className="mb-1.5 text-[22px] font-semibold tracking-[-0.03em] text-white">
                  Link expirado
                </h2>
                <p className="mb-5 text-[14px] text-[#8B8B95]">{tokenErrorMessage}</p>
                <div className="mb-7 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left">
                  <p className="mb-1.5 text-[13px] text-white/80">
                    Por segurança, os links de recuperação expiram após um tempo.
                  </p>
                  <p className="text-[12px] text-[#8B8B95]">
                    Solicite um novo link de recuperação para redefinir sua senha.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0"
                  >
                    Solicitar novo link
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] text-[14.5px] font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.1]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={blueprintBackground}
      />
      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[430px] max-w-[calc(100%-48px)] sm:max-w-[calc(100%-80px)]"
        >
          <div
            className="relative rounded-[20px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-10 pb-10 pt-11 shadow-[0_32px_64px_rgba(0,0,0,0.35)]"
            style={{
              backdropFilter: 'blur(28px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
            }}
          >
            <div className="absolute -top-px left-10 right-10 h-0.5 rounded-b-[4px] bg-[#D2FF00] opacity-90" />

            {/* Cabeçalho */}
            <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
              <img
                src={gioWordmark}
                alt="gio"
                className="block h-[40px] w-auto"
                style={{ filter: INVERT_TO_WHITE, imageRendering: 'auto' }}
              />
              <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                {isRecoveryMode ? 'Criar nova senha' : 'Redefinir senha'}
              </h1>
              <p className="text-[14px] text-[#8B8B95]">
                Escolha uma nova senha segura para sua conta.
              </p>
            </div>

            <div className="mb-[26px] h-px w-full bg-white/[0.09]" />

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email - Apenas no modo normal (não recovery) */}
              {!isRecoveryMode && (
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B8B95]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="seu@email.com.br"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Senha Atual - Apenas no modo normal (não recovery) */}
              {!isRecoveryMode && (
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                  >
                    Senha atual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B8B95]" />
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] opacity-70 transition hover:opacity-100"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Nova Senha */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B8B95]" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] opacity-70 transition hover:opacity-100"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requisitos da Senha */}
              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 rounded-[10px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="mb-2 text-[13px] font-medium text-white/80">Requisitos da senha:</p>
                  {requirements.map((req, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-2 text-[13px] ${
                        req.met ? 'text-success' : 'text-[#8B8B95]'
                      }`}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${req.met ? 'text-success' : 'text-white/20'}`}
                      />
                      <span>{req.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Confirmar Senha */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B8B95]" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] opacity-70 transition hover:opacity-100"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 flex items-center text-[12px] text-[#ff9090]">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-[9px] border border-[rgba(255,80,80,0.22)] bg-[rgba(255,80,80,0.1)] px-3.5 py-[11px] text-[13px] text-[#ff9090]"
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
                  className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] text-[14.5px] font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.1]"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid() || newPassword !== confirmPassword}
                  className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>Alterar senha</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
