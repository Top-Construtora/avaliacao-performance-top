import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import gioWordmark from '@/assets/images/gio-wordmark.png';
import { useAuth } from '../../context/AuthContext';

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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err);
      setError(
        err.message || 'Erro ao enviar email de recuperação. Verifique se o email está correto.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A] text-white">
      {/* Grade blueprint — pano de fundo técnico (lime translúcido sobre obsidian) */}
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

            {emailSent ? (
              /* ═══ ESTADO: E-MAIL ENVIADO ═══ */
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#D2FF00]/30 bg-[#D2FF00]/10"
                >
                  <CheckCircle className="h-9 w-9 text-[#D2FF00]" />
                </motion.div>
                <h2 className="mb-1.5 text-[22px] font-semibold tracking-[-0.03em] text-white">
                  E-mail enviado!
                </h2>
                <p className="mb-5 text-[14px] text-[#8B8B95]">
                  Enviamos um link de recuperação para{' '}
                  <strong className="text-white">{email}</strong>
                </p>
                <div className="mb-7 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left">
                  <p className="mb-1.5 text-[13px] text-white/80">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </p>
                  <p className="text-[12px] text-[#8B8B95]">
                    O e-mail pode levar alguns minutos para chegar. Não esqueça de conferir a pasta
                    de spam.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar para o login
                </button>
              </div>
            ) : (
              /* ═══ ESTADO: FORMULÁRIO ═══ */
              <>
                <h2 className="mb-1.5 text-center text-[22px] font-semibold tracking-[-0.03em] text-white">
                  Esqueceu sua senha?
                </h2>
                <p className="mb-8 text-center text-[14px] text-[#8B8B95]">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>

                {/* Erro */}
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

                <form onSubmit={handleSubmit}>
                  {/* E-mail */}
                  <div className="mb-6 flex flex-col gap-1.5">
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
                      disabled={loading}
                      required
                      className="h-12 w-full rounded-[10px] border border-white/10 bg-white/[0.06] px-4 text-[14.5px] text-white outline-none transition placeholder:text-[#8B8B95] placeholder:opacity-55 hover:border-white/[0.14] focus:border-[#D2FF00] focus:shadow-[0_0_0_3px_rgba(210,255,0,0.18)]"
                    />
                  </div>

                  {/* Enviar — CTA primário em lime */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative mb-3 flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#D2FF00] text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar link de recuperação</span>
                    )}
                  </button>

                  {/* Voltar — secundário em vidro */}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] text-[14.5px] font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.1]"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Voltar para o login</span>
                  </button>
                </form>
              </>
            )}

            <div className="mt-[26px] text-center text-[11px] tracking-[0.03em] text-[#8B8B95] opacity-55">
              © 2026 gio · Sistema protegido por autenticação segura
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
