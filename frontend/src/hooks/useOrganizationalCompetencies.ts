import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OrganizationalCompetency {
  name: string;
  description: string;
  category: 'deliveries';
}

/**
 * Hook para buscar competências organizacionais dinâmicas do banco de dados
 * Substitui o const EVALUATION_COMPETENCIES.deliveries
 */
export const useOrganizational Competencies = () => {
  const [competencies, setCompetencies] = useState<OrganizationalCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organizational_competencies')
        .select('name, description')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const mapped = data.map(comp => ({
          name: comp.name,
          description: comp.description,
          category: 'deliveries' as const
        }));
        setCompetencies(mapped);
      } else {
        // Fallback para competências padrão se não houver nenhuma no banco
        setCompetencies([
          {
            name: 'Meritocracia e Missão Compartilhada',
            description: 'Reconhecimento por mérito e alinhamento com os valores da empresa',
            category: 'deliveries' as const
          },
          {
            name: 'Espiral de Passos',
            description: 'Evolução contínua através de pequenos passos consistentes',
            category: 'deliveries' as const
          },
          {
            name: 'Planejar é Preciso',
            description: 'Valorização do planejamento e organização como fator crítico de sucesso',
            category: 'deliveries' as const
          },
          {
            name: 'Melhoria Contínua',
            description: 'Busca constante por aperfeiçoamento e inovação em processos e resultados',
            category: 'deliveries' as const
          }
        ]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar competências organizacionais:', err);
      setError(err.message || 'Erro ao carregar competências');

      // Fallback em caso de erro
      setCompetencies([
        {
          name: 'Meritocracia e Missão Compartilhada',
          description: 'Reconhecimento por mérito e alinhamento com os valores da empresa',
          category: 'deliveries' as const
        },
        {
          name: 'Espiral de Passos',
          description: 'Evolução contínua através de pequenos passos consistentes',
          category: 'deliveries' as const
        },
        {
          name: 'Planejar é Preciso',
          description: 'Valorização do planejamento e organização como fator crítico de sucesso',
          category: 'deliveries' as const
        },
        {
          name: 'Melhoria Contínua',
          description: 'Busca constante por aperfeiçoamento e inovação em processos e resultados',
          category: 'deliveries' as const
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { competencies, loading, error, reload: loadCompetencies };
};
