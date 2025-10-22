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
      console.log('🚀 Frontend - Enviando PDI para API:', params);
      console.log('📊 Total de items a enviar:', params.items?.length || 0);

      // Determinar URL base
      const apiUrl = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('vercel.app')
          ? 'https://avaliacao-performance-naue.onrender.com/api'
          : '/api');

      // Verificar a rota correta
      const response = await fetch(`${apiUrl}/pdi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          employeeId: params.employeeId,
          cycleId: params.cycleId,
          leaderEvaluationId: params.leaderEvaluationId,
          items: params.items,
          periodo: params.periodo || 'Anual'
        })
      });

      if (!response.ok) {
        // Tentar fazer parse do erro, mas se falhar, usar mensagem padrão
        let errorMessage = 'Erro ao salvar PDI';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            console.error('❌ Erro na resposta da API:', error);
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('❌ Erro na resposta (não-JSON):', text);
            errorMessage = text || `Erro HTTP ${response.status}`;
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', parseError);
          errorMessage = `Erro HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ Resposta não é JSON, usando resposta vazia');
        return { success: true };
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Resposta vazia do servidor');
        return { success: true };
      }

      const result = JSON.parse(text);
      console.log('✅ PDI salvo com sucesso:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Erro ao salvar PDI:', error);
      throw error;
    }
  },

  // Buscar PDI do colaborador
  async getPDI(employeeId: string) {
    console.log('pdiService.getPDI chamado para employeeId:', employeeId);
    try {
      // Determinar URL base
      const apiUrl = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('vercel.app')
          ? 'https://avaliacao-performance-naue.onrender.com/api'
          : '/api');

      const url = `${apiUrl}/pdi/${employeeId}`;
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

        // Tentar fazer parse do erro, mas se falhar, usar mensagem padrão
        let errorMessage = 'Erro ao buscar PDI';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            console.error('Erro na resposta:', error);
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Erro na resposta (não-JSON):', text);
            errorMessage = text || `Erro HTTP ${response.status}`;
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta de erro:', parseError);
          errorMessage = `Erro HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ Resposta não é JSON');
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Resposta vazia do servidor');
        return null;
      }

      const result = JSON.parse(text);
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
      // Determinar URL base
      const apiUrl = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('vercel.app')
          ? 'https://avaliacao-performance-naue.onrender.com/api'
          : '/api');

      const response = await fetch(`${apiUrl}/pdi/cycle/${cycleId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        // Tentar fazer parse do erro, mas se falhar, usar mensagem padrão
        let errorMessage = 'Erro ao buscar PDIs do ciclo';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || `Erro HTTP ${response.status}`;
          }
        } catch (parseError) {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ Resposta não é JSON');
        return [];
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Resposta vazia do servidor');
        return [];
      }

      const result = JSON.parse(text);
      return result.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar PDIs do ciclo:', error);
      throw error;
    }
  },

  // Transformar dados do PDI do formato do componente para o formato da API
  transformPDIDataForAPI(pdiData: any, cycleId?: string, leaderEvaluationId?: string): SavePDIParams {
    console.log('🔄 transformPDIDataForAPI - Dados de entrada:', pdiData);
    const items: PDIItem[] = [];

    // Adicionar itens de curto prazo
    if (pdiData.curtosPrazos && pdiData.curtosPrazos.length > 0) {
      console.log(`➕ Adicionando ${pdiData.curtosPrazos.length} itens de curto prazo`);
      pdiData.curtosPrazos.forEach((item: any) => {
        const pdiItem = {
          id: item.id || `curto-${Date.now()}-${Math.random()}`,
          competencia: item.competencia,
          calendarizacao: item.calendarizacao || '',
          comoDesenvolver: item.comoDesenvolver,
          resultadosEsperados: item.resultadosEsperados,
          status: item.status || '1',
          observacao: item.observacao || '',
          prazo: 'curto' as const
        };
        console.log('  Item curto prazo:', pdiItem);
        items.push(pdiItem);
      });
    }

    // Adicionar itens de médio prazo
    if (pdiData.mediosPrazos && pdiData.mediosPrazos.length > 0) {
      console.log(`➕ Adicionando ${pdiData.mediosPrazos.length} itens de médio prazo`);
      pdiData.mediosPrazos.forEach((item: any) => {
        const pdiItem = {
          id: item.id || `medio-${Date.now()}-${Math.random()}`,
          competencia: item.competencia,
          calendarizacao: item.calendarizacao || '',
          comoDesenvolver: item.comoDesenvolver,
          resultadosEsperados: item.resultadosEsperados,
          status: item.status || '1',
          observacao: item.observacao || '',
          prazo: 'medio' as const
        };
        console.log('  Item médio prazo:', pdiItem);
        items.push(pdiItem);
      });
    }

    // Adicionar itens de longo prazo
    if (pdiData.longosPrazos && pdiData.longosPrazos.length > 0) {
      console.log(`➕ Adicionando ${pdiData.longosPrazos.length} itens de longo prazo`);
      pdiData.longosPrazos.forEach((item: any) => {
        const pdiItem = {
          id: item.id || `longo-${Date.now()}-${Math.random()}`,
          competencia: item.competencia,
          calendarizacao: item.calendarizacao || '',
          comoDesenvolver: item.comoDesenvolver,
          resultadosEsperados: item.resultadosEsperados,
          status: item.status || '1',
          observacao: item.observacao || '',
          prazo: 'longo' as const
        };
        console.log('  Item longo prazo:', pdiItem);
        items.push(pdiItem);
      });
    }

    console.log('📊 Total de items processados:', items.length);
    console.log('📋 Items finais para envio:', items);

    const result = {
      employeeId: pdiData.colaboradorId,
      cycleId,
      leaderEvaluationId,
      items,
      periodo: pdiData.periodo || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    };

    console.log('📦 Payload final:', result);
    return result;
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