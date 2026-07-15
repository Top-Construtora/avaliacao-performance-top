/**
 * Escalas de avaliação (labels + cores) centralizadas.
 *
 * Antes duplicadas inline em SelfEvaluation.tsx (~1013), EvaluationSection.tsx (73)
 * e PotentialAndPDI.tsx (280). Manter os labels e a ordem idênticos preserva a
 * semântica dos payloads (a nota gravada é o `value`, não o label).
 */

export interface RatingOption {
  value: number;
  /** Rótulo curto exibido na pill/badge. */
  label: string;
  /** Classe de fundo quando selecionado (token GIO). */
  color: string;
  /** Classe de texto para exibição read-only. */
  textColor: string;
}

/** Competências técnicas / comportamentais / organizacionais — escala 1 a 4. */
export const COMPETENCY_SCALE: RatingOption[] = [
  { value: 1, label: 'Insatisfatório', color: 'bg-destructive', textColor: 'text-destructive' },
  { value: 2, label: 'Em Desenvolvimento', color: 'bg-warning', textColor: 'text-warning' },
  { value: 3, label: 'Satisfatório', color: 'bg-success/80', textColor: 'text-success' },
  {
    value: 4,
    label: 'Excepcional',
    color: 'bg-green-700',
    textColor: 'text-green-700 dark:text-green-500',
  },
];

/** Potencial (avaliação do líder) — escala 1 a 4. */
export const POTENTIAL_SCALE: RatingOption[] = [
  {
    value: 1,
    label: 'Não atende o esperado',
    color: 'bg-destructive',
    textColor: 'text-destructive',
  },
  { value: 2, label: 'Em desenvolvimento', color: 'bg-warning', textColor: 'text-warning' },
  { value: 3, label: 'Atende ao esperado', color: 'bg-success/80', textColor: 'text-success' },
  {
    value: 4,
    label: 'Supera',
    color: 'bg-green-700',
    textColor: 'text-green-700 dark:text-green-500',
  },
];

/** Status de itens do PDI — escala 1 a 5 (usada em <select>). */
export const PDI_STATUS_OPTIONS = [
  {
    value: '1',
    label: 'Não iniciado',
    color: 'bg-secondary text-muted-foreground font-medium border-border',
  },
  { value: '2', label: 'Iniciado', color: 'bg-success/10 text-success border-success/30' },
  { value: '3', label: 'Em andamento', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: '4', label: 'Quase concluído', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: '5', label: 'Concluído', color: 'bg-success/10 text-success border-success/30' },
] as const;

/** Retorna a opção correspondente a uma nota, ou null. */
export function getRatingOption(
  scale: RatingOption[],
  value: number | undefined,
): RatingOption | null {
  if (!value) return null;
  return scale.find((o) => o.value === value) ?? null;
}
