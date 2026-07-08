/**
 * Formata uma data no padrão pt-BR sem o bug de fuso horário.
 *
 * Datas "date-only" vindas do banco ("YYYY-MM-DD") são interpretadas por
 * `new Date(str)` como meia-noite UTC; ao renderizar em pt-BR (UTC-3) elas
 * "voltam" um dia (ex.: 2026-07-01 vira 30/06/2026). Aqui, strings date-only
 * são convertidas para uma data LOCAL, evitando o deslocamento. Timestamps
 * completos (com hora/offset) continuam sendo formatados normalmente.
 *
 * @param dateString data em string ("YYYY-MM-DD" ou ISO completa)
 * @param options    opções de formatação repassadas ao toLocaleDateString
 */
export function formatDateBR(
  dateString?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateString) return '';

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const date = isDateOnly
    ? new Date(
        Number(dateString.slice(0, 4)),
        Number(dateString.slice(5, 7)) - 1,
        Number(dateString.slice(8, 10)),
      )
    : new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', options);
}
