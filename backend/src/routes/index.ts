import { Router } from 'express';
import authRoutes from './authRoutes';
import evaluationRoutes from './evaluationRoutes';
import userRoutes from './userRoutes';
import salaryRoutes from './salaryRoutes';
import departmentRoutes from './departmentRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Routes
router.use('/auth', authRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/users', userRoutes);
router.use('/salary', salaryRoutes);
router.use('/departments', departmentRoutes);

export default router;