// Utilitários para filtrar usuários restritos

// ===== RESTRIÇÃO GERAL (Gerenciar Usuários, etc.) =====
// Emails dos usuários que devem ser ocultados
const RESTRICTED_USERS = [
  'lais.gardini@topconstrutora.com',
  'jessyca.victoria@topconstrutora.com'
];

// Emails dos usuários que não podem ver os usuários restritos (geral)
const RESTRICTED_VIEWERS: string[] = [];

// ===== RESTRIÇÃO ESPECÍFICA PARA AVALIAÇÕES (Comitê e Consenso) =====
// Usuários ocultos em Comitê/Consenso para AMBOS (recrutatop e genteegestao)
const EVALUATION_RESTRICTED_USERS_COMMON = [
  'lais.gardini@topconstrutora.com'
];

// Usuários ocultos em Comitê/Consenso APENAS para recrutatop
const EVALUATION_RESTRICTED_USERS_RECRUTA = [
  'jessyca.victoria@topconstrutora.com'
];

// Quem não pode ver os usuários restritos comuns em Comitê/Consenso
const EVALUATION_RESTRICTED_VIEWERS = [
  'recrutatop@topconstrutora.com',
  'genteegestao@topconstrutora.com'
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

/**
 * Monta a lista de usuários ocultos em Comitê/Consenso de acordo com quem está logado
 */
function getEvaluationRestrictedList(currentUserEmail: string): string[] {
  const lowerEmail = currentUserEmail.toLowerCase();
  const restricted = [...EVALUATION_RESTRICTED_USERS_COMMON];

  if (lowerEmail === 'recrutatop@topconstrutora.com') {
    restricted.push(...EVALUATION_RESTRICTED_USERS_RECRUTA);
  }

  return restricted;
}

/**
 * Filtra usuários restritos especificamente em Comitê e Consenso
 */
export function filterEvaluationRestrictedUsers<T extends { email?: string }>(
  currentUserEmail: string | undefined,
  users: T[]
): T[] {
  if (!currentUserEmail) return users;

  const isRestrictedViewer = EVALUATION_RESTRICTED_VIEWERS.some(email =>
    email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (isRestrictedViewer) {
    const restrictedList = getEvaluationRestrictedList(currentUserEmail);
    return users.filter(user =>
      !user.email || !restrictedList.some(email =>
        email.toLowerCase() === user.email?.toLowerCase()
      )
    );
  }

  return users;
}

/**
 * Filtra relações de employee restritos especificamente em Comitê e Consenso
 */
export function filterEvaluationRestrictedEmployeeRelations<T extends { employee?: any; employee_email?: string }>(
  currentUserEmail: string | undefined,
  items: T[]
): T[] {
  if (!currentUserEmail) return items;

  const isRestrictedViewer = EVALUATION_RESTRICTED_VIEWERS.some(email =>
    email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (isRestrictedViewer) {
    const restrictedList = getEvaluationRestrictedList(currentUserEmail);
    return items.filter(item => {
      const employeeEmail = item.employee?.email || item.employee_email;
      if (!employeeEmail) return true;

      return !restrictedList.some(email =>
        email.toLowerCase() === employeeEmail.toLowerCase()
      );
    });
  }

  return items;
}
