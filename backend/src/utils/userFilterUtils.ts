// Utilitários para filtrar usuários restritos

// Emails dos usuários que devem ser ocultados
const RESTRICTED_USERS = [
  'lais.gardini@topconstrutora.com',
  'jessyca.victoria@topconstrutora.com'
];

// Emails dos usuários que não podem ver os usuários restritos
const RESTRICTED_VIEWERS = [
  'genteegestao@topconstrutora.com',
  'recrutatop@topconstrutora.com'
];

/**
 * Verifica se o usuário atual pode ver um determinado usuário
 * @param currentUserEmail - Email do usuário logado
 * @param targetUserEmail - Email do usuário alvo
 * @returns true se pode ver, false se não pode
 */
export function canViewUser(currentUserEmail: string, targetUserEmail: string): boolean {
  if (!currentUserEmail || !targetUserEmail) return true;

  // Se o usuário logado está na lista de visualizadores restritos
  const isRestrictedViewer = RESTRICTED_VIEWERS.some(email =>
    email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (isRestrictedViewer) {
    // Verificar se o usuário alvo está na lista de restritos
    return !RESTRICTED_USERS.some(email =>
      email.toLowerCase() === targetUserEmail.toLowerCase()
    );
  }

  return true;
}

/**
 * Filtra uma lista de usuários removendo os que não podem ser vistos
 * @param currentUserEmail - Email do usuário logado
 * @param users - Lista de usuários
 * @returns Lista filtrada de usuários
 */
export function filterRestrictedUsers<T extends { email?: string }>(
  currentUserEmail: string | undefined,
  users: T[]
): T[] {
  if (!currentUserEmail) return users;

  // Se o usuário logado está na lista de visualizadores restritos
  const isRestrictedViewer = RESTRICTED_VIEWERS.some(email =>
    email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (isRestrictedViewer) {
    return users.filter(user =>
      !user.email || !RESTRICTED_USERS.some(email =>
        email.toLowerCase() === user.email?.toLowerCase()
      )
    );
  }

  return users;
}

/**
 * Filtra objetos que têm um relacionamento com employee (usuário)
 * @param currentUserEmail - Email do usuário logado
 * @param items - Lista de itens com relacionamento employee
 * @returns Lista filtrada de itens
 */
export function filterRestrictedEmployeeRelations<T extends { employee?: any; employee_email?: string }>(
  currentUserEmail: string | undefined,
  items: T[]
): T[] {
  if (!currentUserEmail) return items;

  // Se o usuário logado está na lista de visualizadores restritos
  const isRestrictedViewer = RESTRICTED_VIEWERS.some(email =>
    email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (isRestrictedViewer) {
    return items.filter(item => {
      const employeeEmail = item.employee?.email || item.employee_email;
      if (!employeeEmail) return true;

      return !RESTRICTED_USERS.some(email =>
        email.toLowerCase() === employeeEmail.toLowerCase()
      );
    });
  }

  return items;
}
