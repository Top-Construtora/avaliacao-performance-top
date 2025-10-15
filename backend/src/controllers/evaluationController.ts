import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluationService';
import { AuthRequest } from '../middleware/auth';

export const evaluationController = {
  // ====================================
  // CICLOS DE AVALIAÇÃO
  // ====================================
  
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

  // ====================================
  // DASHBOARD E RELATÓRIOS
  // ====================================
  
  // Dashboard do ciclo
  async getCycleDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;

      const dashboard = await evaluationService.getCycleDashboard(
        authReq.supabase,
        cycleId
      );

      // Debug: Log what we're sending
      console.log('Controller sending dashboard with fields:',
        dashboard.length > 0 ? Object.keys(dashboard[0]) : 'no data'
      );

      res.json({
        success: true,
        data: dashboard
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
      
      const nineBoxData = await evaluationService.getNineBoxData(
        authReq.supabase,
        cycleId
      );
      
      res.json({
        success: true,
        data: nineBoxData
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // AVALIAÇÕES
  // ====================================
  
  // Buscar avaliações do funcionário (unificado)
  async getEmployeeEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      
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

  // Buscar autoavaliações
  async getSelfEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      const { cycleId } = req.query;
      
      const evaluations = await evaluationService.getSelfEvaluations(
        authReq.supabase,
        employeeId,
        cycleId as string
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

  // Buscar avaliações de líder
  async getLeaderEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      const { cycleId } = req.query;
      
      const evaluations = await evaluationService.getLeaderEvaluations(
        authReq.supabase,
        employeeId,
        cycleId as string
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
      
      if (!cycleId || !employeeId || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: cycleId, employeeId, type'
        });
      }
      
      const exists = await evaluationService.checkExistingEvaluation(
        authReq.supabase,
        cycleId as string,
        employeeId as string,
        type as 'self' | 'leader'
      );
      
      res.json({
        success: true,
        data: exists
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
      
      const evaluation = await evaluationService.createLeaderEvaluation(
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

  // ====================================
  // PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL)
  // ====================================
  
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, goals, actions, resources, timeline, items } = req.body;
      
      if (!employeeId || (!items && (!goals || !actions))) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: employeeId e (items ou goals/actions)'
        });
      }
      
      // Se temos items, usar o novo formato
      if (items && Array.isArray(items)) {
        const pdi = await evaluationService.savePDIWithItems(
          authReq.supabase,
          {
            employeeId,
            items,
            periodo: timeline,
            createdBy: authReq.user?.id
          }
        );
        
        res.json({
          success: true,
          data: pdi
        });
      } else {
        // Usar formato antigo
        const pdi = await evaluationService.savePDI(
          authReq.supabase,
          {
            employeeId,
            goals,
            actions,
            resources,
            timeline,
            createdBy: authReq.user?.id
          }
        );
        
        res.json({
          success: true,
          data: pdi
        });
      }
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
      
      const pdi = await evaluationService.getPDI(
        authReq.supabase,
        employeeId
      );
      
      // Se não encontrou PDI, retorna null ao invés de erro
      if (!pdi) {
        return res.json({
          success: true,
          data: null
        });
      }
      
      res.json({
        success: true,
        data: pdi
      });
    } catch (error: any) {
      console.error('Controller error:', error);
      
      // Se o erro for "no rows returned", retorna null ao invés de erro 500
      if (error.message && error.message.includes('PGRST116')) {
        return res.json({
          success: true,
          data: null
        });
      }
      
      next(error);
    }
  },

  // Atualizar PDI
  async updatePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { pdiId } = req.params;
      const { goals, actions, resources, timeline } = req.body;
      
      const pdi = await evaluationService.updatePDI(
        authReq.supabase,
        pdiId,
        {
          goals,
          actions,
          resources,
          timeline
        }
      );
      
      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  }
};