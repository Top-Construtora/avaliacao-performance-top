import { Router } from 'express';
import { culturalCodeController } from '../controllers/culturalCodeController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Leitura — todos autenticados (a cultura é de todos)
router.get('/', culturalCodeController.getAll as any);

// Escrita — diretores/admin
router.post(
  '/sections',
  authorizeRoles(['director']) as any,
  culturalCodeController.createSection as any,
);
router.put(
  '/sections/:id',
  authorizeRoles(['director']) as any,
  culturalCodeController.updateSection as any,
);
router.delete(
  '/sections/:id',
  authorizeRoles(['director']) as any,
  culturalCodeController.deleteSection as any,
);

router.post(
  '/items',
  authorizeRoles(['director']) as any,
  culturalCodeController.createItem as any,
);
router.put(
  '/items/:id',
  authorizeRoles(['director']) as any,
  culturalCodeController.updateItem as any,
);
router.delete(
  '/items/:id',
  authorizeRoles(['director']) as any,
  culturalCodeController.deleteItem as any,
);

export default router;
