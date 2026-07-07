// Neutraliza CSV/Formula Injection (achado de segurança H9) em exports XLSX/CSV.
//
// Células de TEXTO iniciadas por `= + - @` (ou tab/CR) são interpretadas como
// fórmula pelo Excel/Google Sheets. Um dado controlado pelo usuário (nome,
// cargo, departamento, time...) como `=HYPERLINK(...)` ou `=cmd|...` executaria
// na máquina de quem abre o relatório. Prefixar uma aspa simples força o valor
// a ser tratado como texto literal. Números/booleans passam intactos.

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeCellValue<T>(value: T): T | string {
  if (typeof value === 'string' && FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Sanitiza os valores de texto de cada objeto-linha antes de virar planilha. */
export function sanitizeSheetData<T extends Record<string, any>>(rows: T[]): T[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = sanitizeCellValue(value);
    }
    return out as T;
  });
}
