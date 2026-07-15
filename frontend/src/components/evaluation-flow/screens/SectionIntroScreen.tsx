import type { ElementType } from 'react';

interface SectionIntroScreenProps {
  icon?: ElementType;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Metadados curtos (ex.: "5 competências · peso 50%"). */
  meta?: string;
}

/**
 * Tela de abertura de seção — orienta o usuário antes de uma nova etapa.
 * Grande, arejada, com ícone e uma frase de contexto.
 */
export default function SectionIntroScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
}: SectionIntroScreenProps) {
  return (
    <div
      data-flow-autofocus
      tabIndex={-1}
      className="flex flex-col items-center justify-center px-2 py-8 text-center outline-none sm:py-12"
    >
      {Icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-lime/15 text-lime-deep dark:text-lime">
          <Icon className="h-10 w-10" />
        </div>
      )}
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lime-deep dark:text-lime">
          {eyebrow}
        </p>
      )}
      <h2 className="max-w-md text-2xl font-bold leading-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
      {meta && (
        <p className="mt-5 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground">
          {meta}
        </p>
      )}
    </div>
  );
}
