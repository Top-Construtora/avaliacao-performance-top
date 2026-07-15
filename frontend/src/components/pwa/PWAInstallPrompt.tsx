import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Download, Share, Plus, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

/**
 * Convite discreto para instalar o PWA na tela inicial.
 *
 * - Android/Chrome: usa o evento nativo `beforeinstallprompt`.
 * - iOS/Safari: mostra instruções manuais (o iOS não expõe o evento).
 * - Só aparece no mobile, quando ainda não instalado, e some após dispensa
 *   (persistida em localStorage com cooldown — não insiste).
 */

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias
const SHOW_DELAY_MS = 3500; // deixa o usuário "respirar" antes de convidar

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se identifica como Mac com touch
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    if (raw === 'never') return true;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (!isMobile || isStandalone() || recentlyDismissed()) return;

    let showTimer: ReturnType<typeof setTimeout>;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // impede o mini-infobar padrão do Chrome
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS não dispara beforeinstallprompt → oferecer instruções manuais
    if (isIOS()) {
      setIosMode(true);
      showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    // Se o app for instalado, esconde e não volta a insistir
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(DISMISS_KEY, 'never');
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(showTimer);
    };
  }, [isMobile]);

  const dismiss = (permanent = false) => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, permanent ? 'never' : String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    // Aceito ou recusado, não reaparece nesta sessão; recusa entra em cooldown
    dismiss(outcome === 'accepted');
  };

  const sheet = (
    <motion.div
      role="dialog"
      aria-label="Instalar aplicativo GIO"
      initial={reduceMotion ? { opacity: 0 } : { y: '110%' }}
      animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { y: '110%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start gap-3 p-4">
          <img
            src="/icons/icon-192.png"
            alt=""
            aria-hidden="true"
            className="h-12 w-12 flex-shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Instalar o app GIO</h2>
            {iosMode ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Toque em <Share className="mb-0.5 inline h-4 w-4 align-middle text-foreground" />{' '}
                <span className="font-medium text-foreground">Compartilhar</span> e depois em{' '}
                <span className="whitespace-nowrap font-medium text-foreground">
                  <Plus className="mb-0.5 inline h-4 w-4 align-middle" /> Adicionar à Tela de Início
                </span>
                .
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Acesse suas avaliações direto da tela inicial, com abertura rápida e em tela cheia.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(false)}
            aria-label="Fechar"
            className="-m-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!iosMode && (
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              type="button"
              onClick={() => dismiss(false)}
              className="h-11 flex-1 rounded-xl border border-border bg-transparent text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-lime text-sm font-semibold text-obsidian hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Instalar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return <AnimatePresence>{visible && sheet}</AnimatePresence>;
}
