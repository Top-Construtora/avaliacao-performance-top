import { Router } from 'express';
import { evaluationController } from '../controllers/evaluationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de avaliação requerem autenticação
router.use(authenticateToken as any);

// ====================================
// ROTAS DE CICLOS
// ====================================
router.get('/cycles', evaluationController.getCycles);
router.get('/cycles/current', evaluationController.getCurrentCycle);
router.post('/cycles', evaluationController.createCycle);
router.put('/cycles/:id/open', evaluationController.openCycle);
router.put('/cycles/:id/close', evaluationController.closeCycle);

// ====================================
// ROTAS DE DASHBOARD E RELATÓRIOS
// ====================================
router.get('/cycles/:cycleId/dashboard', evaluationController.getCycleDashboard);
router.get('/cycles/:cycleId/nine-box', evaluationController.getNineBoxData);

// ====================================
// ROTAS DE AVALIAÇÕES
// ====================================

// Rotas unificadas (usando a view)
router.get('/employee/:employeeId', evaluationController.getEmployeeEvaluations);
router.get('/check', evaluationController.checkExistingEvaluation);

// Rotas específicas para autoavaliações
router.get('/self-evaluations/:employeeId', evaluationController.getSelfEvaluations);
router.get('/self-evaluation/:evaluationId', evaluationController.getSelfEvaluationById);
router.post('/self', evaluationController.createSelfEvaluation);

// Rotas específicas para avaliações de líder
router.get('/leader-evaluations/:employeeId', evaluationController.getLeaderEvaluations);
router.get('/leader-evaluation/:evaluationId', evaluationController.getLeaderEvaluationById);
router.post('/leader', evaluationController.createLeaderEvaluation);

// ====================================
// ROTAS DE PDI (NOVO)
// ====================================
router.post('/pdi', evaluationController.savePDI);
router.get('/pdi/:employeeId', evaluationController.getPDI);
router.put('/pdi/:pdiId', evaluationController.updatePDI);

export default router;