import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import BlurText from '../../components/BlurText';
import RotatingText from '../../components/RotatingText';
import gioWordmark from '@/assets/images/gio-wordmark.png';
import { useAuth } from '../../context/AuthContext';
import { devLog } from '../../utils/logger';
import AuthBackdrop from '../../components/AuthBackdrop';

// gio — Identidade v4.0: split obsidian + grade blueprint + lime.
// Marca GIO (wordmark) sobre obsidian; CTA lime; card com vidro.
const INVERT_TO_WHITE = 'invert(1) brightness(1.1)';

const REDIRECT_KEY = 'post_login_redirect';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithMicrosoft, isAuthenticated, loading, sessionExpired } = useAuth();

  // Guarda o destino de origem (enviado pelo ProtectedRoute) para voltar após
  // o login — inclusive sobrevivendo ao redirect do OAuth (via sessionStorage).
  useEffect(() => {
    const from = (location.state as any)?.from;
    if (from) sessionStorage.setItem(REDIRECT_KEY, JSON.stringify(from));
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  // Telas baixas (notebook 768p): o card expandido precisa de cada pixel —
  // o spacer de alinhamento encolhe quase a zero e o card fica compacto.
  const [isShortViewport, setIsShortViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-height: 820px)');
    const update = () => setIsShortViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  // Em telas baixas o card expandido rola dentro da coluna — ao abrir o
  // formulário, garante que ele apareça na vista.
  const emailFormRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showEmailLogin) return;
    const id = window.setTimeout(() => {
      emailFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 350);
    return () => window.clearTimeout(id);
  }, [showEmailLogin]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const [error, setError] = useState('');
  /** Fade-out do conteúdo em andamento antes do redirect pós-login. */
  const [leaving, setLeaving] = useState(false);
  /** Voltamos do redirect do OAuth? (code/token na URL — o Supabase ainda está
      processando a sessão; o overlay cobre esse limbo até o redirect). */
  const [oauthReturning] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.location.hash.includes('access_token') || window.location.search.includes('code=')),
  );
  const connecting = isLoadingMicrosoft || oauthReturning;

  const redirectAfterLogin = () => {
    if (leaving) return;
    const from = (location.state as any)?.from;
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    const loc = from || (stored ? JSON.parse(stored) : null);
    sessionStorage.removeItem(REDIRECT_KEY);
    let target = '/';
    if (loc) {
      target =
        typeof loc === 'string'
          ? loc
          : (loc.pathname || '/') + (loc.search || '') + (loc.hash || '');
    }
    // Nunca voltar para as próprias telas de auth.
    if (target.startsWith('/login')) target = '/';
    // Fade-out curto antes de navegar (vindo do OAuth o overlay já cobre tudo,
    // então navega direto)
    if (oauthReturning) {
      navigate(target, { replace: true });
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate(target, { replace: true }), 380);
  };

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!loading && isAuthenticated) {
      devLog('✅ Usuário já autenticado, redirecionando...');
      redirectAfterLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading]);

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
        redirectAfterLogin();
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
      <AuthBackdrop />

      {/* Overlay do OAuth: cobre o clique no botão E a volta do redirect da
          Microsoft (detectada pelo code/token na URL) — sem tela "morta" */}
      <AnimatePresence>
        {connecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[#1A1A1A]/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#D2FF00]" />
              <p className="text-[14px] text-white/70">Conectando à Microsoft…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade-out do conteúdo antes do redirect pós-login (fecha o ciclo da
          animação de entrada) */}
      <motion.div
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 flex min-h-screen flex-col lg:h-screen"
      >
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ═══ ESQUERDA — PAINEL DE MARCA ═══
              Marca no topo e headline grande centrada; os tópicos vivem no
              rodapé de tela inteira, que ancora as duas colunas. */}
          <aside className="relative hidden flex-col overflow-hidden px-16 pt-14 lg:flex xl:px-24">
            {/* Logo + tagline da marca (tagline centralizada sob o wordmark) */}
            <div className="relative z-[1] w-[240px] max-w-full text-center">
              <img
                src={gioWordmark}
                alt="gio"
                className="w-full"
                style={{ filter: INVERT_TO_WHITE }}
              />
              <span className="mt-3 block whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.18em] text-white/35">
                Gestão Inteligente de Obras
              </span>
            </div>

            {/* Headline grande ao centro, ancorada pela linha lime */}
            <div className="relative z-[1] flex flex-1 items-center">
              <div className="flex gap-[18px]">
                <div className="mt-3 w-[3px] shrink-0 self-stretch rounded-full bg-gradient-to-b from-[#D2FF00] via-[#D2FF00]/40 to-transparent" />
                <h1 className="text-[clamp(30px,3.4vw,64px)] font-semibold leading-[1.1] tracking-[-0.035em] text-white">
                  <BlurText text="Pessoas no centro," />
                  <br />
                  <RotatingText
                    className="text-[#D2FF00]"
                    items={['resultados em foco.', 'evolução contínua.', 'decisões com dados.']}
                  />
                </h1>
              </div>
            </div>
          </aside>

          {/* ═══ DIREITA — FORMULÁRIO ═══
            No desktop, um spacer espelha o bloco da logo do painel esquerdo:
            o card centra no mesmo espaço vertical da headline, alinhando os
            dois lados em qualquer altura de tela. */}
          <main className="relative flex flex-col p-6 lg:min-h-0 lg:overflow-y-auto lg:px-16 lg:pt-14 lg:pb-0 lg:[@media(max-height:820px)]:pt-6">
            {/* Marca no mobile (o painel esquerdo some abaixo de lg) */}
            <div className="mt-6 text-center lg:hidden">
              <img
                src={gioWordmark}
                alt="gio"
                className="mx-auto h-[44px] w-auto"
                style={{ filter: INVERT_TO_WHITE }}
              />
              <span className="mt-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                Gestão Inteligente de Obras
              </span>
            </div>

            {/* Spacer que espelha o bloco da logo para alinhar o card com a
                headline; quando o formulário de email expande, encolhe e o
                card sobe — sem nunca encostar no rodapé */}
            <motion.div
              aria-hidden
              className="hidden w-full flex-shrink-0 lg:block"
              initial={false}
              animate={{ height: showEmailLogin ? (isShortViewport ? 8 : 40) : 202 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            <div className="flex w-full flex-1 items-center justify-center lg:min-h-0 lg:py-5 lg:[@media(max-height:820px)]:py-3">
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring' as const, stiffness: 170, damping: 22 }}
                className="w-[460px] max-w-[calc(100%-48px)] sm:max-w-[calc(100%-80px)]"
              >
                <div
                  className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-10 pb-10 pt-11 shadow-[0_32px_64px_rgba(0,0,0,0.35)] lg:[@media(max-height:820px)]:px-8 lg:[@media(max-height:820px)]:pb-6 lg:[@media(max-height:820px)]:pt-7"
                  style={{
                    backdropFilter: 'blur(28px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
                  }}
                >
                  {/* Barra de destaque lime (assinatura do card de autenticação) */}
                  <div className="absolute -top-px left-10 right-10 h-0.5 rounded-b-[4px] bg-[#D2FF00] opacity-90" />

                  {/* Assinatura do produto (a marca grande já vive no painel esquerdo) */}
                  <div className="mb-7 text-center lg:[@media(max-height:820px)]:mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B8B95]">
                      Gente &amp; Gestão
                    </span>
                  </div>

                  <div className="mb-[26px] h-px w-full bg-white/[0.09] lg:[@media(max-height:820px)]:mb-4" />

                  <h2 className="mb-1.5 text-center text-[22px] font-semibold tracking-[-0.03em] text-white">
                    Entre na sua conta
                  </h2>
                  <p className="mb-8 text-center text-[14px] text-[#8B8B95] lg:[@media(max-height:820px)]:mb-5">
                    Use sua conta corporativa para acessar a GIO.
                  </p>

                  {/* Aviso de sessão expirada */}
                  {sessionExpired && (
                    <motion.div
                      role="alert"
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
                      role="alert"
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
                    className="group relative flex h-[52px] w-full items-center justify-center gap-3 overflow-hidden rounded-[10px] border border-white/[0.14] bg-white/[0.08] text-[14.5px] font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition hover:border-[#D2FF00]/40 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2FF00]/50 disabled:cursor-not-allowed disabled:opacity-60 lg:[@media(max-height:820px)]:h-[46px]"
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

                  {/* Login alternativo fica oculto: o Microsoft é o caminho oficial */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowEmailLogin(!showEmailLogin)}
                      className="rounded px-1 text-[13px] text-[#8B8B95] transition-colors hover:text-[#D2FF00] focus-visible:text-[#D2FF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2FF00]/50"
                    >
                      {showEmailLogin ? 'Ocultar login com email' : 'Entrar com email e senha'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showEmailLogin && (
                      <motion.div
                        ref={emailFormRef}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 border-t border-white/[0.09] pt-5 lg:[@media(max-height:820px)]:mt-4 lg:[@media(max-height:820px)]:pt-4">
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
                                className="h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] px-4 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)] lg:[@media(max-height:820px)]:h-11"
                              />
                            </div>

                            {/* Senha */}
                            <div className="mb-6 flex flex-col gap-1.5 lg:[@media(max-height:820px)]:mb-4">
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
                                  className="h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] pl-4 pr-12 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)] lg:[@media(max-height:820px)]:h-11"
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
                              className="relative flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 lg:[@media(max-height:820px)]:h-[46px]"
                            >
                              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
                            </button>

                            {/* Link Esqueci senha */}
                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="rounded px-1 text-[12px] text-[#8B8B95] transition-colors hover:text-[#D2FF00] focus-visible:text-[#D2FF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2FF00]/50"
                              >
                                Esqueci minha senha
                              </button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* No desktop o © vive no rodapé de tela inteira; aqui só no mobile */}
                  <div className="mt-[26px] text-center text-[11px] tracking-[0.03em] text-[#8B8B95] opacity-55 lg:hidden">
                    © 2026 gio · Sistema protegido por autenticação segura
                  </div>
                </div>
              </motion.div>
            </div>
          </main>
        </div>

        {/* ═══ RODAPÉ DE TELA INTEIRA — ancora as duas colunas ═══ */}
        {/* Altura fixa de 2 células do grid (140px): com a malha ancorada na
            base, a divisória do rodapé cai exatamente numa linha do grid */}
        <footer className="relative z-10 hidden h-[140px] border-t border-white/[0.08] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid grid-cols-3 content-center gap-8 px-16 xl:px-24">
            {[
              {
                title: 'Avaliações 360°',
                desc: 'Autoavaliação, líder e consenso num fluxo só.',
              },
              {
                title: 'Comitê de Gente',
                desc: 'Matriz 9-Box viva para decisões de talento.',
              },
              {
                title: 'PDI estruturado',
                desc: 'Desenvolvimento com prazos e acompanhamento.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55 + index * 0.13, ease: 'easeOut' }}
              >
                <span className="block text-[14px] font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-[13px] leading-[1.55] text-white/45">
                  {item.desc}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-end px-16">
            <span className="text-right text-[11px] tracking-[0.03em] text-white/30">
              © 2026 gio · Sistema protegido por autenticação segura
            </span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
