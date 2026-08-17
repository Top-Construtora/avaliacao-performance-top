import { Router } from 'express';
import { recruitmentController } from '../controllers/recruitmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Stats
router.get(
  '/stats',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getRecruitmentStats as any,
);

// Vagas
router.get(
  '/openings',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getJobOpenings as any,
);
router.get(
  '/openings/:id',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getJobOpeningById as any,
);
router.post(
  '/openings',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.createJobOpening as any,
);
router.put(
  '/openings/:id',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.updateJobOpening as any,
);
router.delete(
  '/openings/:id',
  authorizeRoles(['director']) as any,
  recruitmentController.deleteJobOpening as any,
);

// Banco de currículos (cadastrados pelos próprios candidatos no portal)
router.get(
  '/candidate-bank',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getCandidateBank as any,
);
router.get(
  '/candidate-bank/:id',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getCandidateProfile as any,
);
router.get(
  '/candidate-bank/:id/resume-url',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getCandidateResumeUrl as any,
);

// Candidatos
router.get(
  '/candidates',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.getCandidates as any,
);
router.post(
  '/candidates',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.createCandidate as any,
);
router.put(
  '/candidates/:id',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.updateCandidate as any,
);
router.delete(
  '/candidates/:id',
  authorizeRoles(['director']) as any,
  recruitmentController.deleteCandidate as any,
);

// Entrevistas de recrutamento
router.post(
  '/interviews',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.createRecruitmentInterview as any,
);
router.put(
  '/interviews/:id',
  authorizeRoles(['director', 'leader']) as any,
  recruitmentController.updateRecruitmentInterview as any,
);

export default router;
