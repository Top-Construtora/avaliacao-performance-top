import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluationService';
import { AuthRequest } from '../middleware/auth';

export const evaluationController = {
  // Buscar todos os ciclos
  async getCycles(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const cycles = await evaluationService.getEvaluationCycles(authReq.supabase);
      
      res.json({
        success: true,
        data: cycles
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar ciclo atual
  async getCurrentCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const currentCycle = await evaluationService.getCurrentCycle(authReq.supabase);
      
      res.json({
        success: true,
        data: currentCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar ciclo
  async createCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const cycleData = req.body;
      
      
      const newCycle = await evaluationService.createCycle(authReq.supabase, {
        ...cycleData,
        created_by: authReq.user?.id
      });
      
      res.json({
        success: true,
        data: newCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Abrir ciclo
  async openCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
            
      const updatedCycle = await evaluationService.updateCycleStatus(
        authReq.supabase,
        id,
        'open'
      );
      
      res.json({
        success: true,
        data: updatedCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Fechar ciclo
  async closeCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
            
      const updatedCycle = await evaluationService.updateCycleStatus(
        authReq.supabase,
        id,
        'closed'
      );
      
      res.json({
        success: true,
        data: updatedCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Dashboard do ciclo
  async getCycleDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;
            
      // Por enquanto, retornar array vazio
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Dados NineBox
  async getNineBoxData(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;
            
      // Por enquanto, retornar array vazio
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar avaliações do funcionário
  async getEmployeeEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      const { cycleId } = req.query;
            
      const evaluations = await evaluationService.getEmployeeEvaluations(
        authReq.supabase,
        employeeId
      );
      
      res.json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Verificar avaliação existente
  async checkExistingEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId, employeeId, type } = req.query;
            
      // Por enquanto, sempre retornar false
      res.json({
        success: true,
        data: false
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar autoavaliação
  async createSelfEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const evaluation = await evaluationService.createSelfEvaluation(
        authReq.supabase,
        req.body
      );
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar avaliação do líder
  async createLeaderEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;      
      // Por enquanto, retornar sucesso
      res.json({
        success: true,
        data: { id: 'temp-id' }
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar reunião de consenso
  async createConsensusMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      // Por enquanto, retornar sucesso
      res.json({
        success: true,
        data: { id: 'temp-id' }
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Completar consenso
  async completeConsensusMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { meetingId } = req.params;
            
      res.json({
        success: true,
        data: { message: 'Consensus completed' }
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  }
};