// ====================================
// UTILS PARA PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL)
// ====================================

import { PDIItem } from '../types/pdi.types';

export class PDIUtils {

  // Validar estrutura de um item PDI
  static validatePDIItem(item: any): boolean {
    const isValid = !!(
      item.competencia &&
      item.comoDesenvolver &&
      item.resultadosEsperados &&
      item.prazo &&
      ['curto', 'medio', 'longo'].includes(item.prazo) &&
      item.status &&
      ['1', '2', '3', '4', '5'].includes(item.status)
    );

    if (!isValid) {
      console.log('❌ Item PDI inválido:', {
        competencia: !!item.competencia,
        comoDesenvolver: !!item.comoDesenvolver,
        resultadosEsperados: !!item.resultadosEsperados,
        prazo: item.prazo,
        prazoValido: ['curto', 'medio', 'longo'].includes(item.prazo),
        status: item.status,
        statusValido: ['1', '2', '3', '4', '5'].includes(item.status)
      });
      console.log('Item completo:', item);
    }

    return isValid;
  }

  // Processar dados do PDI vindos do frontend
  static processPDIData(rawPdiData: any): PDIItem[] {
    console.log('🔄 PDIUtils.processPDIData - Entrada:', rawPdiData);

    const allItems: PDIItem[] = [];

    // Se já vem como array de items
    if (rawPdiData.items && Array.isArray(rawPdiData.items)) {
      console.log('📋 Já é um array de items, retornando direto');
      return rawPdiData.items;
    }

    // Processar curtos prazos
    if (rawPdiData.curtosPrazos && Array.isArray(rawPdiData.curtosPrazos)) {
      console.log(`➕ Adicionando ${rawPdiData.curtosPrazos.length} itens de curto prazo`);
      allItems.push(...rawPdiData.curtosPrazos.map((item: any) => ({
        id: item.id || `curto_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacao: item.observacao || '',
        prazo: 'curto' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    // Processar médios prazos
    if (rawPdiData.mediosPrazos && Array.isArray(rawPdiData.mediosPrazos)) {
      console.log(`➕ Adicionando ${rawPdiData.mediosPrazos.length} itens de médio prazo`);
      allItems.push(...rawPdiData.mediosPrazos.map((item: any) => ({
        id: item.id || `medio_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacao: item.observacao || '',
        prazo: 'medio' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    // Processar longos prazos
    if (rawPdiData.longosPrazos && Array.isArray(rawPdiData.longosPrazos)) {
      console.log(`➕ Adicionando ${rawPdiData.longosPrazos.length} itens de longo prazo`);
      allItems.push(...rawPdiData.longosPrazos.map((item: any) => ({
        id: item.id || `longo_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacao: item.observacao || '',
        prazo: 'longo' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    console.log(`📋 Total de itens antes da validação: ${allItems.length}`);
    const validItems = allItems.filter(item => this.validatePDIItem(item));
    console.log(`✅ Itens válidos após validação: ${validItems.length}`);
    return validItems;
  }

  // Organizar items por prazo para o frontend
  static organizePDIItemsByTimeframe(items: PDIItem[]) {
    return {
      curtosPrazos: items.filter(item => item.prazo === 'curto'),
      mediosPrazos: items.filter(item => item.prazo === 'medio'),
      longosPrazos: items.filter(item => item.prazo === 'longo')
    };
  }

  // Calcular estatísticas do PDI
  static calculatePDIStats(items: PDIItem[]) {
    const total = items.length;
    const naoIniciados = items.filter(item => item.status === '1').length;
    const iniciados = items.filter(item => item.status === '2').length;
    const emAndamento = items.filter(item => item.status === '3').length;
    const quaseConcluidos = items.filter(item => item.status === '4').length;
    const concluidos = items.filter(item => item.status === '5').length;

    return {
      total,
      naoIniciados,
      iniciados,
      emAndamento,
      quaseConcluidos,
      concluidos,
      percentualConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0
    };
  }
}
