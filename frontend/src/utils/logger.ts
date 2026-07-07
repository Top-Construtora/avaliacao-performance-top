// Log de nível informativo que só emite em desenvolvimento (achado M8).
// Em produção não polui o console do usuário nem expõe detalhes do fluxo de
// autenticação. Erros reais continuam usando console.error/console.warn.
export const devLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};
