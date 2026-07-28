import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Diagnóstico de e-mail (admin/diretoria)
router.post(
  '/test-email',
  authorizeRoles(['admin', 'director']) as any,
  notificationController.testEmail,
);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/archive', notificationController.archive);
router.post('/delete', notificationController.deleteNotifications);

export default router;
