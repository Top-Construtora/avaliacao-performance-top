import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import gioWordmark from '@/assets/images/gio-wordmark.png';
import { useAuth } from '../../context/AuthContext';
import { devLog } from '../../utils/logger';

// gio — Identidade v4.0: split obsidian + grade blueprint + lime.
// Marca GIO (wordmark) sobre obsidian; CTA lime; card com vidro.
const INVERT_TO_WHITE = 'invert(1) brightness(1.1)';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithMicrosoft, isAuthenticated, loading, sessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const [error, setError] = useState('');

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!loading && isAuthenticated) {
      devLog('✅ Usuário já autenticado, redirecionando para home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      devLog('🔑 Tentando fazer login...');

      const success = await signIn(email, password);

      devLog('📊 Resultado do login:', success);

      if (success) {
        devLog('✅ Login bem-sucedido, redirecionando...');
        navigate('/');
      } else {
        devLog('❌ Login falhou');
        setError('Email ou senha inválidos');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Erro ao fazer login:', err);
      setError('Email ou senha inválidos');
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoadingMicrosoft(true);
      setError('');
      await signInWithMicrosoft();
    } catch (err: any) {
      setError('Erro ao fazer login com Microsoft');
    } finally {
      setIsLoadingMicrosoft(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A] text-white">
      {/* Grade blueprint — pano de fundo técnico (lime translúcido sobre obsidian) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(210,255,0,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(210,255,0,.05) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)`,
          backgroundSize: '90px 90px, 90px 90px, 22.5px 22.5px, 22.5px 22.5px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 45% 45%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 100% at 45% 45%, black 30%, transparent 100%)',
        }}
      />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* ═══ ESQUERDA — PAINEL DE MARCA ═══ */}
        <aside className="relative hidden flex-col justify-center overflow-hidden px-16 py-16 lg:flex xl:px-24">
          <div className="relative z-[1] max-w-[560px]">
            {/* Logo + tagline da marca */}
            <div className="mb-12">
              <img
                src={gioWordmark}
                alt="gio"
                className="w-[240px] max-w-full"
                style={{ filter: INVERT_TO_WHITE }}
              />
              <span className="mt-3 block text-[12px] font-medium uppercase tracking-[0.18em] text-white/35">
                Gestão Inteligente de Obras
              </span>
            </div>

            {/* Headline + subtítulo, ancorados por uma linha lime */}
            <div className="flex gap-[14px]">
              <div className="mt-2 w-[3px] shrink-0 self-stretch rounded-full bg-gradient-to-b from-[#D2FF00] via-[#D2FF00]/40 to-transparent" />
              <div>
                <h1 className="mb-6 text-[48px] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
                  Pessoas no centro,{' '}
                  <em className="not-italic text-[#D2FF00]">resultados em foco</em>.
                </h1>
                <p className="max-w-[460px] text-[17px] leading-[1.6] text-white/55">
                  Avaliações de desempenho, comitê de gente e PDI em um só lugar, com o
                  acompanhamento estruturado que o desenvolvimento da sua equipe precisa.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ DIREITA — FORMULÁRIO ═══ */}
        <main className="relative flex items-center justify-center p-6 lg:px-16">
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
              {/* Barra de destaque lime (assinatura do card de autenticação) */}
              <div className="absolute -top-px left-10 right-10 h-0.5 rounded-b-[4px] bg-[#D2FF00] opacity-90" />

              {/* Logo + tagline */}
              <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
                <img
                  src={gioWordmark}
                  alt="gio"
                  className="block h-[40px] w-auto"
                  style={{ filter: INVERT_TO_WHITE, imageRendering: 'auto' }}
                />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.13em] text-[#8B8B95]">
                  Gente &amp; Gestão
                </span>
              </div>

              <div className="mb-[26px] h-px w-full bg-white/[0.09]" />

              <h2 className="mb-1.5 text-center text-[22px] font-semibold tracking-[-0.03em] text-white">
                Bem-vindo(a)!
              </h2>
              <p className="mb-8 text-center text-[14px] text-[#8B8B95]">
                Acesse sua conta para continuar.
              </p>

              {/* Aviso de sessão expirada */}
              {sessionExpired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-[18px] flex items-center gap-2 rounded-[9px] border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.12)] px-3.5 py-[11px] text-[13px] text-[#fcd34d]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Sua sessão expirou. Faça login novamente.</span>
                </motion.div>
              )}

              {/* Erro de autenticação */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-[18px] flex items-center gap-2 rounded-[9px] border border-[rgba(255,80,80,0.22)] bg-[rgba(255,80,80,0.1)] px-3.5 py-[11px] text-[13px] text-[#ff9090]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Botão Principal — Login com Microsoft */}
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={isLoading || isLoadingMicrosoft}
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.06] text-[14.5px] font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMicrosoft ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                    </svg>
                    <span>Entrar com Microsoft</span>
                  </>
                )}
              </button>

              {/* Link para login alternativo */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowEmailLogin(!showEmailLogin)}
                  className="text-[13px] text-[#8B8B95] transition-colors hover:text-[#D2FF00]"
                >
                  {showEmailLogin ? 'Ocultar login com email' : 'Entrar com email e senha'}
                </button>
              </div>

              {/* Formulário de Email/Senha (colapsável) */}
              <AnimatePresence>
                {showEmailLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 border-t border-white/[0.09] pt-5">
                      <form onSubmit={handleSubmit}>
                        {/* E-mail */}
                        <div className="mb-4 flex flex-col gap-1.5">
                          <label
                            htmlFor="email"
                            className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                          >
                            E-mail
                          </label>
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com.br"
                            disabled={isLoading}
                            className="h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] px-4 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)]"
                          />
                        </div>

                        {/* Senha */}
                        <div className="mb-6 flex flex-col gap-1.5">
                          <label
                            htmlFor="password"
                            className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#8B8B95]"
                          >
                            Senha
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              disabled={isLoading}
                              className="h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] pl-4 pr-12 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] opacity-70 transition hover:opacity-100"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="h-[18px] w-[18px]" />
                              ) : (
                                <Eye className="h-[18px] w-[18px]" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Entrar — CTA primário em lime vibrante */}
                        <button
                          type="submit"
                          disabled={isLoading || isLoadingMicrosoft}
                          className="relative flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
                        </button>

                        {/* Link Esqueci senha */}
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-[12px] text-[#8B8B95] transition-colors hover:text-[#D2FF00]"
                          >
                            Esqueci minha senha
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-[26px] text-center text-[11px] tracking-[0.03em] text-[#8B8B95] opacity-55">
                © 2026 gio · Sistema protegido por autenticação segura
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
