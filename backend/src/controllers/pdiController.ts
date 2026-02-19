import { Request, Response, NextFunction } from 'express';
import { pdiService } from '../services/pdiService';
import { AuthRequest } from '../middleware/auth';
import { PDIUtils } from '../utils/pdiUtils';

export const pdiController = {
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, cycleId, leaderEvaluationId, periodo } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Campo obrigatório: employeeId'
        });
      }

      // Processar os dados do PDI vindos do frontend
      let processedItems;
      if (req.body.items && Array.isArray(req.body.items)) {
        processedItems = req.body.items;
      } else {
        processedItems = PDIUtils.processPDIData(req.body);
      }

      if (!processedItems || processedItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'O PDI deve conter pelo menos um item'
        });
      }

      // Validar items usando o método do service
      if (!pdiService.validatePDIItems(processedItems)) {
        return res.status(400).json({
          success: false,
          error: 'Estrutura dos itens do PDI inválida'
        });
      }

      const pdi = await pdiService.savePDI(authReq.supabase, {
        employeeId,
        items: processedItems,
        cycleId,
        leaderEvaluationId,
        periodo,
        status: 'active',
        createdBy: authReq.user?.id
      });

      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      next(error);
    }
  },

  // Buscar PDI
  async getPDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;

      const pdi = await pdiService.getPDI(authReq.supabase, employeeId);

      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Erro ao buscar PDI:', error);
      next(error);
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;

      const pdis = await pdiService.getPDIsByCycle(authReq.supabase, cycleId);

      res.json({
        success: true,
        data: pdis
      });
    } catch (error) {
      console.error('Erro ao buscar PDIs por ciclo:', error);
      next(error);
    }
  }
};
