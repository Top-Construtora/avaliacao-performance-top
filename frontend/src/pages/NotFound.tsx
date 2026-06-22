import { useNavigate } from 'react-router-dom';
import { Home, FileSearch, AlertCircle, ArrowLeft } from 'lucide-react';

// gio — Identidade v4.0: fundo obsidian + grade blueprint + destaque lime.
const blueprintBackground = {
  backgroundImage: `linear-gradient(rgba(210,255,0,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(210,255,0,.05) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)`,
  backgroundSize: '90px 90px, 90px 90px, 22.5px 22.5px, 22.5px 22.5px',
  maskImage: 'radial-gradient(ellipse 100% 100% at 50% 45%, black 30%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 45%, black 30%, transparent 100%)',
} as const;

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1A1A1A] text-white">
      {/* Grade blueprint */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={blueprintBackground}
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Ícone ilustrativo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#D2FF00]/20 blur-3xl" />
              <div className="relative rounded-full border border-white/10 bg-white/[0.06] p-8 shadow-xl">
                <FileSearch className="h-20 w-20 text-[#D2FF00]" />
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-lemon-milk text-8xl font-bold text-[#D2FF00]">404</h1>
              <h2 className="mt-4 font-lemon-milk text-3xl font-semibold tracking-wide text-white">
                Ops! Página não encontrada
              </h2>
            </div>

            <p className="mx-auto max-w-md px-4 text-lg text-white/55">
              Parece que você tentou acessar uma página que não existe no sistema de Gente &amp;
              Gestão.
            </p>

            {/* Sugestões */}
            <div className="mx-auto max-w-md rounded-[14px] border border-white/10 bg-white/[0.04] p-6 shadow-lg">
              <div className="flex items-start space-x-3 text-left">
                <AlertCircle className="mt-1 flex-shrink-0 text-[#D2FF00]" size={20} />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">
                    Isso pode ter acontecido porque:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-white/55">
                    <li>O link pode estar desatualizado</li>
                    <li>A página foi movida ou removida</li>
                    <li>Você não tem permissão para acessar este conteúdo</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <button
                onClick={() => navigate('/')}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] bg-[#D2FF00] px-8 text-[15px] font-bold tracking-[0.02em] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-px hover:bg-[#C2EE00] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] active:translate-y-0"
              >
                <Home size={18} />
                Voltar ao início
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-sm font-medium text-[#8B8B95] transition-colors hover:text-[#D2FF00]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar à página anterior
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
