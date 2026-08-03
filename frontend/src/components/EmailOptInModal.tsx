import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Bell, Loader2, Mail, MailX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApiService, NotificationPreference } from '../services/notification.service';

interface EmailOptInModalProps {
  isOpen: boolean;
  preferences: NotificationPreference[];
  onClose: () => void;
}

/**
 * Opt-in de e-mail exibido uma única vez, no primeiro acesso do usuário
 * (enquanto não existir nenhuma linha em notification_preferences).
 * Qualquer uma das respostas grava todas as categorias e o modal não volta.
 */
const EmailOptInModal: React.FC<EmailOptInModalProps> = ({ isOpen, preferences, onClose }) => {
  const { profile } = useAuth();
  const [saving, setSaving] = useState<'accept' | 'decline' | null>(null);

  const handleAnswer = async (emailEnabled: boolean) => {
    setSaving(emailEnabled ? 'accept' : 'decline');
    try {
      await notificationApiService.updatePreferences(
        preferences.map((p) => ({ category: p.category, email_enabled: emailEnabled })),
      );
      toast.success(
        emailEnabled
          ? 'Pronto! Você vai receber os avisos importantes por e-mail.'
          : 'Combinado — avisos só dentro do sistema.',
      );
      onClose();
    } catch {
      toast.error('Não foi possível salvar sua escolha. Tente de novo em Configurações.');
      onClose();
    } finally {
      setSaving(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-lime/10 mb-4">
                <Bell className="w-8 h-8 text-lime-deep dark:text-lime" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground font-lemon-milk tracking-wide">
                Avisos por e-mail?
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {profile?.name?.split(' ')[0] ? `${profile.name.split(' ')[0]}, além` : 'Além'} dos
                avisos dentro do sistema, a GIO pode te avisar por e-mail sobre avaliações,
                pesquisas, PDI e entrevistas. Quer receber?
              </p>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => handleAnswer(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-obsidian font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving === 'accept' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Sim, quero receber por e-mail
              </button>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => handleAnswer(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-secondary text-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-60"
              >
                {saving === 'decline' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MailX className="w-4 h-4" />
                )}
                Não, só dentro do sistema
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-5">
              Você pode mudar isso a qualquer momento em Configurações &gt; Notificações.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailOptInModal;
