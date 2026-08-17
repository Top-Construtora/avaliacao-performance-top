import { Router } from 'express';
import { learningController } from '../controllers/learningController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const adminOnly = authorizeRoles(['admin', 'director']) as any;

/**
 * Treinamento e desenvolvimento: o gestor cadastra o treinamento que ministrou,
 * sobe o material e inscreve quem participou — por isso o líder entra aqui.
 * O recorte de "só o que ele mesmo cadastrou" é feito no controller, não dá
 * para expressá-lo numa lista de papéis.
 *
 * Trilhas e aprovação de curso externo seguem só com RH/diretoria: são decisão
 * de catálogo, não registro do que o time fez.
 */
const gestor = authorizeRoles(['admin', 'director', 'leader']) as any;

router.use(authenticateToken as any);

// Aluno
router.get('/my-enrollments', learningController.myEnrollments);
router.get('/enrollments/:id', learningController.enrollmentDetail);
router.patch('/enrollments/:id/contents/:contentId', learningController.setContentDone);
router.get('/catalog', learningController.catalog);
router.post('/catalog/:classId/enroll', learningController.selfEnroll);

// Cursos externos
router.get('/external', learningController.myExternalCourses);
router.post('/external', learningController.submitExternalCourse);
router.get('/external/pending', adminOnly, learningController.pendingExternalCourses);
router.patch('/external/:id/review', adminOnly, learningController.reviewExternalCourse);

// Trilhas
router.get('/my-tracks', learningController.myTracks);
router.get('/tracks', adminOnly, learningController.listTracks);
router.post('/tracks', adminOnly, learningController.createTrack);
router.put('/tracks/:id/courses', adminOnly, learningController.setTrackCourses);
router.post('/tracks/:id/enroll', adminOnly, learningController.enrollInTrack);

// Upload de arquivos de curso (Storage)
router.post('/upload', gestor, learningController.uploadFile);

// Seletor de cursos (id + título): usado pelo líder ao indicar um curso na ação
// do PDI do liderado, por isso fora do adminOnly.
router.get('/course-options', learningController.courseOptions);

// Gestão de treinamentos (RH, diretoria e o gestor que ministrou)
router.get('/courses', gestor, learningController.listCourses);
router.post('/courses', gestor, learningController.createCourse);
router.get('/courses/:id', gestor, learningController.getCourseDetail);
router.put('/courses/:id', gestor, learningController.updateCourse);
router.post('/courses/:id/contents', gestor, learningController.addContent);
router.delete('/courses/:id/contents/:contentId', gestor, learningController.deleteContent);
router.post('/courses/:id/classes', gestor, learningController.createClass);
router.put('/classes/:classId', gestor, learningController.updateClass);
router.post('/classes/:classId/enroll', gestor, learningController.enroll);
router.get('/classes/:classId/overview', gestor, learningController.classOverview);

export default router;
