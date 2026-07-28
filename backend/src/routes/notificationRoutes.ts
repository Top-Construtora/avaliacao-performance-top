import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/archive', notificationController.archive);
router.post('/delete', notificationController.deleteNotifications);

export default router;
