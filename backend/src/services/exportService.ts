import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { salaryService } from './salaryService';

export const exportService = {
  /**
   * Exporta os dados de uma trilha para PDF
   */
  async exportTrackToPDF(supabase: SupabaseClient<Database>, trackId: string): Promise<Buffer> {
    // Buscar dados da trilha
    const track = await salaryService.getCareerTrackById(supabase, trackId);
    const positions = await salaryService.getPositionsByTrack(supabase, trackId);
    const levels = await salaryService.getSalaryLevels(supabase);

    // Buscar departamento
    let departmentName = 'N/A';
    if (track.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', track.department_id)
        .single();
      if (dept) departmentName = dept.name;
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err: Error) => reject(err));

        // Título
        doc.fontSize(20).text('Relatorio de Trilha de Carreira', { align: 'center' });
        doc.moveDown();

        // Informações da Trilha
        doc.fontSize(14).text('Informacoes da Trilha', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Nome: ${track.name || 'N/A'}`);
        doc.text(`Departamento: ${departmentName}`);
        doc.text(`Descricao: ${track.description || 'N/A'}`);
        doc.text(`Status: ${track.active ? 'Ativa' : 'Inativa'}`);
        doc.moveDown();

        // Cargos e Salários
        doc.fontSize(14).text('Cargos e Estrutura Salarial', { underline: true });
        doc.moveDown(0.5);

        if (!positions || positions.length === 0) {
          doc.fontSize(10).text('Nenhum cargo cadastrado nesta trilha.');
        } else {
          positions.forEach((position: any, index: number) => {
            // Verificar se estamos chegando ao fim da página
            if (doc.y > 700) {
              doc.addPage();
            }

            doc.fontSize(12).text(`${index + 1}. ${position.position?.name || 'Cargo nao identificado'}`);
            doc.fontSize(10);
            doc.text(`   Classe: ${position.class?.code || 'N/A'} - ${position.class?.name || ''}`);

            const baseSalary = position.base_salary || 0;
            doc.text(`   Salario Base: R$ ${baseSalary.toFixed(2).replace('.', ',')}`);

            // Níveis salariais
            doc.text('   Niveis Salariais:');
            if (levels && levels.length > 0) {
              levels.forEach((level: any) => {
                // Buscar percentage customizada ou usar a padrão
                let percentage = 0;
                if (position.custom_level_percentages && position.custom_level_percentages[level.id]) {
                  percentage = position.custom_level_percentages[level.id];
                } else if (level.percentage !== undefined && level.percentage !== null) {
                  percentage = level.percentage;
                }

                const salary = baseSalary * (1 + percentage / 100);
                doc.text(`      ${level.name}: R$ ${salary.toFixed(2).replace('.', ',')} (+${percentage}%)`);
              });
            }

            doc.moveDown(0.5);
          });
        }

        // Rodapé
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');
        doc.moveDown(2);
        doc.fontSize(8).text(
          `Gerado em: ${dateStr} as ${timeStr}`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      }
    });
  },

  /**
   * Exporta os dados de uma trilha para Excel
   */
  async exportTrackToExcel(supabase: SupabaseClient<Database>, trackId: string): Promise<Buffer> {
    try {
      // Buscar dados da trilha
      const track = await salaryService.getCareerTrackById(supabase, trackId);
      const positions = await salaryService.getPositionsByTrack(supabase, trackId);
      const levels = await salaryService.getSalaryLevels(supabase);

      // Buscar departamento
      let departmentName = 'N/A';
      if (track.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', track.department_id)
          .single();
        if (dept) departmentName = dept.name;
      }

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Avaliacao';
      workbook.created = new Date();

      // Aba única com informações da trilha e cargos
      const sheet = workbook.addWorksheet('Trilha de Carreira');

      // Adicionar informações da trilha no topo
      sheet.mergeCells('A1:D1');
      sheet.getCell('A1').value = 'INFORMACOES DA TRILHA';
      sheet.getCell('A1').font = { bold: true, size: 14 };
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      };

      sheet.getRow(2).values = ['Nome:', track.name || 'N/A'];
      sheet.getRow(3).values = ['Departamento:', departmentName];
      sheet.getRow(4).values = ['Descricao:', track.description || 'N/A'];
      sheet.getRow(5).values = ['Status:', track.active ? 'Ativa' : 'Inativa'];

      // Estilizar labels
      sheet.getCell('A2').font = { bold: true };
      sheet.getCell('A3').font = { bold: true };
      sheet.getCell('A4').font = { bold: true };
      sheet.getCell('A5').font = { bold: true };

      // Ajustar largura das colunas
      sheet.getColumn(1).width = 20;
      sheet.getColumn(2).width = 50;

      // Espaço entre informações e tabela
      const startRow = 7;

      // Cabeçalho da tabela de cargos
      sheet.mergeCells(`A${startRow}:D${startRow}`);
      sheet.getCell(`A${startRow}`).value = 'CARGOS E SALARIOS';
      sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
      sheet.getCell(`A${startRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell(`A${startRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      };

      // Definir colunas da tabela
      const headerRow = startRow + 1;
      const columns: any[] = [
        { header: 'Ordem', key: 'order', width: 10 },
        { header: 'Cargo', key: 'position_name', width: 30 },
        { header: 'Classe', key: 'class_code', width: 20 },
        { header: 'Salario Base', key: 'base_salary', width: 15 }
      ];

      // Adicionar colunas de níveis
      if (levels && levels.length > 0) {
        levels.forEach((level: any) => {
          columns.push({
            header: `Nivel ${level.name}`,
            key: `level_${level.id}`,
            width: 15
          });
        });
      }

      // Definir headers na linha correta
      const headerValues = columns.map(col => col.header);
      sheet.getRow(headerRow).values = headerValues;

      // Estilizar cabeçalho da tabela
      const tableHeaderRow = sheet.getRow(headerRow);
      tableHeaderRow.font = { bold: true, size: 11 };
      tableHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
      tableHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Ajustar larguras das colunas
      columns.forEach((col, index) => {
        sheet.getColumn(index + 1).width = col.width;
      });

      // Adicionar dados dos cargos
      let currentRow = headerRow + 1;
      if (positions && positions.length > 0) {
        positions.forEach((position: any, index: number) => {
          const rowValues: any[] = [
            position.order_index || index + 1,
            position.position?.name || 'N/A',
            `${position.class?.code || ''} - ${position.class?.name || ''}`,
            position.base_salary || 0
          ];

          // Calcular salários por nível
          if (levels && levels.length > 0) {
            levels.forEach((level: any) => {
              // Buscar percentage customizada ou usar a padrão
              let percentage = 0;
              if (position.custom_level_percentages && position.custom_level_percentages[level.id]) {
                percentage = position.custom_level_percentages[level.id];
              } else if (level.percentage !== undefined && level.percentage !== null) {
                percentage = level.percentage;
              }

              const baseSalary = position.base_salary || 0;
              const salary = baseSalary * (1 + percentage / 100);
              rowValues.push(salary);
            });
          }

          sheet.getRow(currentRow).values = rowValues;
          currentRow++;
        });
      }

      // Formatar colunas de valores monetários
      // Coluna do salário base é a 4ª coluna (índice 4)
      for (let row = headerRow + 1; row < currentRow; row++) {
        sheet.getCell(row, 4).numFmt = 'R$ #,##0.00';

        // Formatar colunas dos níveis (a partir da coluna 5)
        if (levels && levels.length > 0) {
          for (let col = 5; col < 5 + levels.length; col++) {
            sheet.getCell(row, col).numFmt = 'R$ #,##0.00';
          }
        }
      }

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      throw error;
    }
  }
};
