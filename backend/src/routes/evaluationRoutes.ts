import { Router } from 'express';
import { evaluationController } from '../controllers/evaluationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCycleSchema } from '../validators/cycle.validator';

const router = Router();

// Todas as rotas de avaliação requerem autenticação
router.use(authenticateToken as any);

// Gestão do ciclo de avaliação e decisões de comitê são privilégio de diretor
// (admin passa pelo bypass). As leituras/escritas por colaborador são
// controladas por ownership dentro do controller.
const requireDirector = authorizeRoles(['director']) as any;

// ====================================
// ROTAS DE CICLOS
// ====================================
router.get('/cycles', evaluationController.getCycles);
router.get('/cycles/current', evaluationController.getCurrentCycle);
router.post(
  '/cycles',
  requireDirector,
  validate({ body: createCycleSchema }),
  evaluationController.createCycle,
);
router.put('/cycles/:id/open', requireDirector, evaluationController.openCycle);
router.put('/cycles/:id/close', requireDirector, evaluationController.closeCycle);

// ====================================
// ROTAS DE DASHBOARD E RELATÓRIOS
// ====================================
router.get('/cycles/:cycleId/dashboard', evaluationController.getCycleDashboard);
router.get('/cycles/:cycleId/nine-box', evaluationController.getNineBoxData);

// ====================================
// ROTAS DE AVALIAÇÕES
// ====================================

// Histórico de avaliações por ciclo
router.get(
  '/employee/:employeeId/evaluation-history',
  evaluationController.getEmployeeEvaluationHistory,
);

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

// ====================================
// ROTAS DE PROMOÇÃO NINE BOX
// ====================================
router.post('/consensus-evaluation', requireDirector, evaluationController.createConsensus);
router.put(
  '/consensus/:consensusId/promote',
  requireDirector,
  evaluationController.promoteNineBoxQuadrant,
);

// ====================================
// ROTAS DE DELIBERAÇÕES DO COMITÊ
// ====================================
router.put(
  '/consensus/:consensusId/deliberations',
  requireDirector,
  evaluationController.saveCommitteeDeliberations,
);

export default router;
