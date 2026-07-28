import { Router } from 'express';
import { learningController } from '../controllers/learningController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const adminOnly = authorizeRoles(['admin', 'director']) as any;

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

// Gestão (admin/diretoria)
router.get('/courses', adminOnly, learningController.listCourses);
router.post('/courses', adminOnly, learningController.createCourse);
router.get('/courses/:id', adminOnly, learningController.getCourseDetail);
router.put('/courses/:id', adminOnly, learningController.updateCourse);
router.post('/courses/:id/contents', adminOnly, learningController.addContent);
router.delete('/courses/:id/contents/:contentId', adminOnly, learningController.deleteContent);
router.post('/courses/:id/classes', adminOnly, learningController.createClass);
router.put('/classes/:classId', adminOnly, learningController.updateClass);
router.post('/classes/:classId/enroll', adminOnly, learningController.enroll);
router.get('/classes/:classId/overview', adminOnly, learningController.classOverview);

export default router;
