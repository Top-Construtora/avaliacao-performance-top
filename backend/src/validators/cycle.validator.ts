import { z } from 'zod';

const DATE_YMD = /^\d{4}-\d{2}-\d{2}/; // aceita "YYYY-MM-DD" ou ISO com hora

/**
 * Schema de criação de ciclo de avaliação — rota de referência do padrão.
 * Espelha exatamente os campos aceitos por `evaluationService.createCycle`.
 */
export const createCycleSchema = z
  .object({
    title: z.string().trim().min(1, 'Título é obrigatório').max(150, 'Título muito longo'),
    description: z.string().trim().max(1000, 'Descrição muito longa').optional().nullable(),
    start_date: z.string().regex(DATE_YMD, 'Data de início inválida (use YYYY-MM-DD)'),
    end_date: z.string().regex(DATE_YMD, 'Data de término inválida (use YYYY-MM-DD)'),
    status: z.enum(['draft', 'open', 'closed']).optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'A data de término deve ser igual ou posterior à data de início',
    path: ['end_date'],
  });

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
