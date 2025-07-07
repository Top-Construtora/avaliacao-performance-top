import { Router } from 'express';
import { evaluationController } from '../controllers/evaluationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de avaliação requerem autenticação
router.use(authenticateToken as any);

// Rotas de ciclos
router.get('/cycles', evaluationController.getCycles);
router.get('/cycles/current', evaluationController.getCurrentCycle);
router.post('/cycles', evaluationController.createCycle);
router.put('/cycles/:id/open', evaluationController.openCycle);
router.put('/cycles/:id/close', evaluationController.closeCycle);

// Rotas de dashboard
router.get('/cycles/:cycleId/dashboard', evaluationController.getCycleDashboard);
router.get('/cycles/:cycleId/nine-box', evaluationController.getNineBoxData);

// Rotas de avaliações
router.get('/employee/:employeeId', evaluationController.getEmployeeEvaluations);
router.get('/check', evaluationController.checkExistingEvaluation);
router.post('/self', evaluationController.createSelfEvaluation);
router.post('/leader', evaluationController.createLeaderEvaluation);

// Rotas de consenso
router.post('/consensus', evaluationController.createConsensusMeeting);
router.put('/consensus/:meetingId/complete', evaluationController.completeConsensusMeeting);

export default router;