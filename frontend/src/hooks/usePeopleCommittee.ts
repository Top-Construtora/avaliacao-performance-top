import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salaryService, PeopleCommitteePermission } from '../services/salary.service';

/**
 * Hook para verificar se o usuário atual tem permissão para visualizar o Comitê de Gente
 *
 * Regras:
 * - Admin e Director: sempre podem ver (todos os dados)
 * - Leader: pode ver apenas se seu cargo (job_position) tiver can_view_people_committee = true
 *           e visualiza apenas seus liderados
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

      // Para líderes, verificar o cargo
      if (profile.is_leader && profile.position_id) {
        try {
          const result = await salaryService.checkPeopleCommitteePermission(profile.id);
          setPermission(result);
        } catch (error) {
          console.error('Erro ao verificar permissão:', error);
          setPermission({ canView: false });
        }
      } else {
        setPermission({ canView: false });
      }

      setLoading(false);
    };

    checkPermission();
  }, [profile]);

  return {
    canViewPeopleCommittee: permission.canView,
    positionName: permission.positionName,
    loading,
    // Indica se é uma visualização restrita (apenas liderados) ou completa
    isRestrictedView: profile?.is_leader && !profile?.is_admin && !profile?.is_director && permission.canView,
  };
}
