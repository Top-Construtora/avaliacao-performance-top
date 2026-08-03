import { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

/**
 * Estado vazio padronizado: ícone num círculo, título, descrição e CTA
 * opcional, com entrada suave. Substitui o padrão repetido de ícone
 * `opacity-50` + parágrafo espalhado pelas telas.
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** CTA opcional (ex.: <Button>Cadastrar</Button>). */
  action?: ReactNode;
  /** 'page' = card cheio de página; 'section' = bloco compacto dentro de um card. */
  variant?: 'page' | 'section';
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'section',
  className = '',
}: EmptyStateProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto max-w-md text-center"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 22, delay: 0.05 }}
        className={`mx-auto mb-4 flex items-center justify-center rounded-full bg-secondary ${
          variant === 'page' ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-14 w-14'
        }`}
      >
        <Icon
          className={`text-lime-deep dark:text-lime ${
            variant === 'page' ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-7 w-7'
          }`}
        />
      </motion.div>
      <h3
        className={`font-semibold text-foreground ${
          variant === 'page' ? 'text-lg sm:text-xl mb-2' : 'text-base mb-1'
        }`}
      >
        {title}
      </h3>
      {description && <p className="text-sm sm:text-base text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  );

  if (variant === 'page') {
    return (
      <div
        className={`bg-card rounded-2xl shadow-sm border border-border p-10 sm:p-16 ${className}`}
      >
        {content}
      </div>
    );
  }
  return <div className={`py-8 ${className}`}>{content}</div>;
}
