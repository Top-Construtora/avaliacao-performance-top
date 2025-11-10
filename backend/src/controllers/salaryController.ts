import { Request, Response, NextFunction } from 'express';
import { salaryService } from '../services/salaryService';
import { exportService } from '../services/exportService';
import { AuthRequest } from '../middleware/auth';

export const salaryController = {
  // ===== CLASSES SALARIAIS =====
  async getSalaryClasses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const classes = await salaryService.getSalaryClasses(req.supabase);
      res.json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  },

  async getSalaryClassById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const salaryClass = await salaryService.getSalaryClassById(req.supabase, id);
      res.json({ success: true, data: salaryClass });
    } catch (error) {
      next(error);
    }
  },

  async createSalaryClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newClass = await salaryService.createSalaryClass(req.supabase, req.body);
      res.status(201).json({ success: true, data: newClass });
    } catch (error) {
      next(error);
    }
  },

  async updateSalaryClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateSalaryClass(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteSalaryClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteSalaryClass(req.supabase, id);
      res.json({ success: true, message: 'Salary class deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== CARGOS =====
  async getJobPositions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const positions = await salaryService.getJobPositions(req.supabase);
      res.json({ success: true, data: positions });
    } catch (error) {
      next(error);
    }
  },

  async getJobPositionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const position = await salaryService.getJobPositionById(req.supabase, id);
      res.json({ success: true, data: position });
    } catch (error) {
      next(error);
    }
  },

  async createJobPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newPosition = await salaryService.createJobPosition(req.supabase, req.body);
      res.status(201).json({ success: true, data: newPosition });
    } catch (error) {
      next(error);
    }
  },

  async updateJobPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateJobPosition(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteJobPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteJobPosition(req.supabase, id);
      res.json({ success: true, message: 'Job position deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== INTERNÍVEIS =====
  async getSalaryLevels(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const levels = await salaryService.getSalaryLevels(req.supabase);
      res.json({ success: true, data: levels });
    } catch (error) {
      next(error);
    }
  },

  async getSalaryLevelById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const level = await salaryService.getSalaryLevelById(req.supabase, id);
      res.json({ success: true, data: level });
    } catch (error) {
      next(error);
    }
  },

  async createSalaryLevel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newLevel = await salaryService.createSalaryLevel(req.supabase, req.body);
      res.status(201).json({ success: true, data: newLevel });
    } catch (error) {
      next(error);
    }
  },

  async updateSalaryLevel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateSalaryLevel(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteSalaryLevel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteSalaryLevel(req.supabase, id);
      res.json({ success: true, message: 'Salary level deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== TRILHAS DE CARREIRA =====
  async getCareerTracks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tracks = await salaryService.getCareerTracks(req.supabase);
      res.json({ success: true, data: tracks });
    } catch (error) {
      next(error);
    }
  },

  async getCareerTrackById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const track = await salaryService.getCareerTrackById(req.supabase, id);
      res.json({ success: true, data: track });
    } catch (error) {
      next(error);
    }
  },

  async getTracksByDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.params;
      const tracks = await salaryService.getTracksByDepartment(req.supabase, departmentId);
      res.json({ success: true, data: tracks });
    } catch (error) {
      next(error);
    }
  },

  async createCareerTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newTrack = await salaryService.createCareerTrack(req.supabase, req.body);
      res.status(201).json({ success: true, data: newTrack });
    } catch (error) {
      next(error);
    }
  },

  async updateCareerTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateCareerTrack(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteCareerTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteCareerTrack(req.supabase, id);
      res.json({ success: true, message: 'Career track deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== POSIÇÕES NAS TRILHAS =====
  async getTrackPositions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const positions = await salaryService.getTrackPositions(req.supabase);
      res.json({ success: true, data: positions });
    } catch (error) {
      next(error);
    }
  },

  async getTrackPositionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const position = await salaryService.getTrackPositionById(req.supabase, id);
      res.json({ success: true, data: position });
    } catch (error) {
      next(error);
    }
  },

  async getPositionsByTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const positions = await salaryService.getPositionsByTrack(req.supabase, trackId);
      res.json({ success: true, data: positions });
    } catch (error) {
      next(error);
    }
  },

  async createTrackPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newPosition = await salaryService.createTrackPosition(req.supabase, req.body);
      res.status(201).json({ success: true, data: newPosition });
    } catch (error) {
      next(error);
    }
  },

  async updateTrackPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateTrackPosition(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteTrackPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteTrackPosition(req.supabase, id);
      res.json({ success: true, message: 'Track position deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== REGRAS DE PROGRESSÃO =====
  async getProgressionRules(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rules = await salaryService.getProgressionRules(req.supabase);
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  },

  async getProgressionRuleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rule = await salaryService.getProgressionRuleById(req.supabase, id);
      res.json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  },

  async getRulesByFromPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { positionId } = req.params;
      const rules = await salaryService.getRulesByFromPosition(req.supabase, positionId);
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  },

  async createProgressionRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const newRule = await salaryService.createProgressionRule(req.supabase, req.body);
      res.status(201).json({ success: true, data: newRule });
    } catch (error) {
      next(error);
    }
  },

  async updateProgressionRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await salaryService.updateProgressionRule(req.supabase, id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteProgressionRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await salaryService.deleteProgressionRule(req.supabase, id);
      res.json({ success: true, message: 'Progression rule deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ===== ATRIBUIÇÃO E GESTÃO DE USUÁRIOS =====
  async assignUserToTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { trackPositionId, salaryLevelId } = req.body;
      
      const updated = await salaryService.assignUserToTrack(
        req.supabase, 
        userId, 
        trackPositionId, 
        salaryLevelId
      );
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async updateUserSalaryLevel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { salaryLevelId } = req.body;
      
      const updated = await salaryService.updateUserSalaryLevel(
        req.supabase, 
        userId, 
        salaryLevelId
      );
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async getUserSalaryInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const info = await salaryService.getUserSalaryInfo(req.supabase, userId);
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  },

  async getUserPossibleProgressions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const progressions = await salaryService.getUserPossibleProgressions(req.supabase, userId);
      res.json({ success: true, data: progressions });
    } catch (error) {
      next(error);
    }
  },

  // ===== PROGRESSÃO =====
  async progressUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { toTrackPositionId, toSalaryLevelId, progressionType, reason } = req.body;
      
      const progression = await salaryService.progressUser(req.supabase, {
        userId,
        toTrackPositionId,
        toSalaryLevelId,
        progressionType,
        reason,
        approvedBy: req.user?.id
      });
      
      res.json({ success: true, data: progression });
    } catch (error) {
      next(error);
    }
  },

  async getUserProgressionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const history = await salaryService.getUserProgressionHistory(req.supabase, userId);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  // ===== RELATÓRIOS =====
  async getSalaryOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const overview = await salaryService.getSalaryOverview(req.supabase);
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  },

  async getSalaryByDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await salaryService.getSalaryByDepartment(req.supabase);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  },

  async getSalaryByPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await salaryService.getSalaryByPosition(req.supabase);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  },

  // ===== CÁLCULO =====
  async calculateSalary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { trackPositionId, salaryLevelId } = req.body;
      const calculated = await salaryService.calculateSalary(
        req.supabase,
        trackPositionId,
        salaryLevelId
      );
      res.json({ success: true, data: calculated });
    } catch (error) {
      next(error);
    }
  },

  // ===== EXPORTAÇÃO =====
  async exportTrackToPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      console.log(`[PDF Export] Iniciando exportação para trilha ${trackId}`);

      // Buscar informações da trilha para o nome do arquivo
      const track = await salaryService.getCareerTrackById(req.supabase, trackId);
      console.log(`[PDF Export] Trilha encontrada: ${track.name}`);

      const pdfBuffer = await exportService.exportTrackToPDF(req.supabase, trackId);
      console.log(`[PDF Export] PDF gerado com sucesso. Tamanho: ${pdfBuffer.length} bytes`);

      // Sanitizar o nome do arquivo
      const fileName = `trilha_${track.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      console.log(`[PDF Export] Nome do arquivo: ${fileName}`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      res.send(pdfBuffer);
      console.log(`[PDF Export] Arquivo enviado com sucesso`);
    } catch (error) {
      console.error('[PDF Export] Erro ao exportar:', error);
      next(error);
    }
  },

  async exportTrackToExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      console.log(`[Excel Export] Iniciando exportação para trilha ${trackId}`);

      // Buscar informações da trilha para o nome do arquivo
      const track = await salaryService.getCareerTrackById(req.supabase, trackId);
      console.log(`[Excel Export] Trilha encontrada: ${track.name}`);

      const excelBuffer = await exportService.exportTrackToExcel(req.supabase, trackId);
      console.log(`[Excel Export] Excel gerado com sucesso. Tamanho: ${excelBuffer.length} bytes`);

      // Sanitizar o nome do arquivo
      const fileName = `trilha_${track.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;
      console.log(`[Excel Export] Nome do arquivo: ${fileName}`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length.toString());

      res.send(excelBuffer);
      console.log(`[Excel Export] Arquivo enviado com sucesso`);
    } catch (error) {
      console.error('[Excel Export] Erro ao exportar:', error);
      next(error);
    }
  }
};