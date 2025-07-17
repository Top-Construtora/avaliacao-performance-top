import { Request, Response, NextFunction } from 'express';
import { pdiService } from '../services/pdiService';
import { AuthRequest } from '../middleware/auth';

export const pdiController = {
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, items, cycleId, leaderEvaluationId, periodo } = req.body;

      if (!employeeId || !items) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: employeeId e items'
        });
      }

      // Validar items
      if (!pdiService.validatePDIItems(items)) {
        return res.status(400).json({
          success: false,
          error: 'Estrutura dos itens do PDI inválida'
        });
      }

      const pdi = await pdiService.savePDI(authReq.supabase, {
        employeeId,
        items,
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
      console.error('Controller error:', error);
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
      console.error('Controller error:', error);
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
      console.error('Controller error:', error);
      next(error);
    }
  }
};