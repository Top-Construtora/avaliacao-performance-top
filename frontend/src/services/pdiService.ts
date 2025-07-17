import { supabase } from '../lib/supabase';
import { PDIItem } from '../types/pdi.types';

interface SavePDIParams {
  employeeId: string;
  cycleId?: string;
  leaderEvaluationId?: string;
  items: PDIItem[];
  periodo?: string;
}

export const pdiService = {
  // Salvar PDI
  async savePDI(params: SavePDIParams) {
    try {
      const response = await fetch('/api/pdi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar PDI');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao salvar PDI:', error);
      throw error;
    }
  },

  // Buscar PDI do colaborador
  async getPDI(employeeId: string) {
    try {
      const response = await fetch(`/api/pdi/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar PDI');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar PDI:', error);
      throw error;
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(cycleId: string) {
    try {
      const response = await fetch(`/api/pdi/cycle/${cycleId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar PDIs do ciclo');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar PDIs do ciclo:', error);
      throw error;
    }
  },

  // Transformar dados do PDI do formato do componente para o formato da API
  transformPDIDataForAPI(pdiData: any, cycleId?: string, leaderEvaluationId?: string): SavePDIParams {
    const items: PDIItem[] = [];

    // Adicionar itens de curto prazo
    pdiData.curtosPrazos.forEach((item: any) => {
      items.push({
        ...item,
        prazo: 'curto' as const
      });
    });

    // Adicionar itens de médio prazo
    pdiData.mediosPrazos.forEach((item: any) => {
      items.push({
        ...item,
        prazo: 'medio' as const
      });
    });

    // Adicionar itens de longo prazo
    pdiData.longosPrazos.forEach((item: any) => {
      items.push({
        ...item,
        prazo: 'longo' as const
      });
    });

    return {
      employeeId: pdiData.colaboradorId,
      cycleId,
      leaderEvaluationId,
      items,
      periodo: pdiData.periodo
    };
  },

  // Transformar dados do PDI do formato da API para o formato do componente
  transformPDIDataFromAPI(apiData: any): any {
    const pdiData = {
      id: apiData.id,
      colaboradorId: apiData.employee_id,
      colaborador: apiData.employee?.name || '',
      cargo: apiData.employee?.position || '',
      departamento: '',
      periodo: apiData.periodo || '',
      curtosPrazos: [] as any[],
      mediosPrazos: [] as any[],
      longosPrazos: [] as any[],
      dataCriacao: apiData.created_at,
      dataAtualizacao: apiData.updated_at
    };

    // Separar itens por prazo
    if (apiData.items && Array.isArray(apiData.items)) {
      apiData.items.forEach((item: PDIItem) => {
        const itemWithoutPrazo = { ...item };
        delete (itemWithoutPrazo as any).prazo;

        switch (item.prazo) {
          case 'curto':
            pdiData.curtosPrazos.push(itemWithoutPrazo);
            break;
          case 'medio':
            pdiData.mediosPrazos.push(itemWithoutPrazo);
            break;
          case 'longo':
            pdiData.longosPrazos.push(itemWithoutPrazo);
            break;
        }
      });
    }

    return pdiData;
  }
};