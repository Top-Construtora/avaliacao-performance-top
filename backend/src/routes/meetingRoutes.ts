import { Router } from 'express';
import { meetingController } from '../controllers/meetingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/types', meetingController.listTypes);
router.get('/', meetingController.list);
router.post('/', meetingController.create);
router.get('/:id', meetingController.getById);
router.put('/:id', meetingController.update);
router.patch('/:id/status', meetingController.setStatus);

router.post('/:id/topics', meetingController.addTopic);
router.patch('/:id/topics/:topicId', meetingController.setTopicCovered);

router.post('/:id/notes', meetingController.addNote);
router.delete('/:id/notes/:noteId', meetingController.deleteNote);

router.post('/:id/tasks', meetingController.addTask);
router.patch('/:id/tasks/:taskId', meetingController.setTaskDone);

export default router;
