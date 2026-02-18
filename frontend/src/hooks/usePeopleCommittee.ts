import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salaryService, PeopleCommitteePermission } from '../services/salary.service';

/**
 * Hook para verificar se o usuário atual tem permissão para visualizar o Comitê de Gente/Nine Box
 *
 * Regras:
 * - Admin e Director: sempre podem ver (todos os dados)
 * - Leader: pode ver apenas se:
 *   1. Seu cargo (job_position) tiver can_view_people_committee = true, OU
 *   2. Tiver can_view_subordinate_ninebox = true (configurado no perfil do usuário)
 *   Em ambos os casos, visualiza apenas seus liderados (visualização restrita)
 */
export function usePeopleCommitteePermission() {
  const { profile } = useAuth();
  const [permission, setPermission] = useState<PeopleCommitteePermission>({ canView: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!profile) {
        setPermission({ canView: false });
        setLoading(false);
        return;
      }

      // Admin e Director sempre podem ver
      if (profile.is_admin || profile.is_director) {
        setPermission({ canView: true });
        setLoading(false);
        return;
      }

      // Para líderes com can_view_subordinate_ninebox, dar acesso imediato
      if (profile.is_leader && profile.can_view_subordinate_ninebox) {
        setPermission({ canView: true, positionName: 'Permissão de Nine Box' });
        setLoading(false);
        return;
      }

      // Para líderes ou usuários com possível acesso especial, verificar no backend
      try {
        const result = await salaryService.checkPeopleCommitteePermission(profile.id);
        setPermission(result);
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        setPermission({ canView: false });
      }

      setLoading(false);
    };

    checkPermission();
  }, [profile]);

  // Verifica se é visualização restrita (pode ser por can_view_subordinate_ninebox ou permissão de cargo)
  const isRestrictedView = profile?.is_leader && !profile?.is_admin && !profile?.is_director && permission.canView;

  return {
    canViewPeopleCommittee: permission.canView,
    positionName: permission.positionName,
    loading,
    // Indica se é uma visualização restrita (apenas liderados) ou completa
    isRestrictedView,
  };
}
