import { Router } from 'express';
import {
  getMyTransactions, listTransactions, getFinanceSummary, refundTransaction,
} from '../controllers/transactionController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.get('/mine', protect, getMyTransactions);
router.get('/summary', protect, restrictTo('admin'), getFinanceSummary);
router.get('/', protect, restrictTo('admin'), listTransactions);
router.patch('/:id/refund', protect, restrictTo('admin'), refundTransaction);

export default router;
