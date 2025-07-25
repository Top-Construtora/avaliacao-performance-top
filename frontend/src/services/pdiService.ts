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
      const response = await fetch('/api/evaluations/pdi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          employeeId: params.employeeId,
          goals: [],
          actions: [],
          resources: [],
          timeline: params.periodo || 'Anual'
        })
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
    console.log('pdiService.getPDI chamado para employeeId:', employeeId);
    try {
      const url = `/api/evaluations/pdi/${employeeId}`;
      console.log('Fazendo requisição para:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('PDI não encontrado (404)');
          return null;
        }
        const error = await response.json();
        console.error('Erro na resposta:', error);
        throw new Error(error.error || 'Erro ao buscar PDI');
      }

      const result = await response.json();
      console.log('Resposta completa da API getPDI:', result);
      
      // Se a resposta tem success e data, retorna data (pode ser null)
      if (result && result.success !== undefined) {
        return result.data;
      }
      
      // Caso contrário, retorna o resultado diretamente
      return result;
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
    console.log('transformPDIDataFromAPI recebeu:', apiData);
    if (!apiData) {
      console.log('apiData é null ou undefined');
      return null;
    }
    
    const pdiData = {
      id: apiData.id,
      colaboradorId: apiData.employee_id,
      colaborador: apiData.employee?.name || '',
      cargo: apiData.employee?.position || '',
      departamento: '',
      periodo: apiData.timeline || apiData.periodo || 'Anual',
      curtosPrazos: [] as any[],
      mediosPrazos: [] as any[],
      longosPrazos: [] as any[],
      dataCriacao: apiData.created_at,
      dataAtualizacao: apiData.updated_at
    };

    // Primeiro verificar se temos o campo items (novo formato)
    if (apiData.items && Array.isArray(apiData.items)) {
      apiData.items.forEach((item: any) => {
        const itemFormatted = {
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          competencia: item.competencia || '',
          calendarizacao: item.calendarizacao || '',
          comoDesenvolver: item.comoDesenvolver || '',
          resultadosEsperados: item.resultadosEsperados || '',
          status: item.status || '1',
          observacao: item.observacao || ''
        };

        switch (item.prazo) {
          case 'curto':
            pdiData.curtosPrazos.push(itemFormatted);
            break;
          case 'medio':
            pdiData.mediosPrazos.push(itemFormatted);
            break;
          case 'longo':
            pdiData.longosPrazos.push(itemFormatted);
            break;
        }
      });
    } 
    // Se não tem items, tentar reconstruir dos campos goals/actions (formato antigo)
    else if (apiData.goals && apiData.actions) {
      apiData.goals.forEach((goal: string, index: number) => {
        const action = apiData.actions[index] || '';
        const resource = apiData.resources?.[index] || '';
        
        // Extrair prazo da string
        let prazo: 'curto' | 'medio' | 'longo' = 'curto';
        if (goal.startsWith('Curto Prazo')) prazo = 'curto';
        else if (goal.startsWith('Médio Prazo')) prazo = 'medio';
        else if (goal.startsWith('Longo Prazo')) prazo = 'longo';
        
        // Extrair competência e resultados esperados
        const goalParts = goal.replace(/^(Curto|Médio|Longo) Prazo - /, '').split(': ');
        const competencia = goalParts[0] || '';
        const resultadosEsperados = goalParts[1] || '';
        
        // Extrair como desenvolver e calendarização
        const actionParts = action.replace(/^(Curto|Médio|Longo) Prazo - /, '').match(/(.+) \(Prazo: (.+)\)/);
        const comoDesenvolver = actionParts?.[1] || action.replace(/^(Curto|Médio|Longo) Prazo - /, '');
        const calendarizacao = actionParts?.[2] || 'A definir';
        
        // Extrair observação
        const observacao = resource.replace(/^(Curto|Médio|Longo) Prazo - /, '');
        
        const item = {
          id: `item-${index}`,
          competencia,
          resultadosEsperados,
          comoDesenvolver,
          calendarizacao,
          status: '1',
          observacao
        };
        
        switch (prazo) {
          case 'curto':
            pdiData.curtosPrazos.push(item);
            break;
          case 'medio':
            pdiData.mediosPrazos.push(item);
            break;
          case 'longo':
            pdiData.longosPrazos.push(item);
            break;
        }
      });
    }

    console.log('PDI transformado final:', pdiData);
    console.log('Total de itens: curto=', pdiData.curtosPrazos.length, 'medio=', pdiData.mediosPrazos.length, 'longo=', pdiData.longosPrazos.length);
    return pdiData;
  }
};