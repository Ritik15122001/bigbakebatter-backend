import { Router } from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock,
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { productSchema, productUpdateSchema } from '../validators/productValidators.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', protect, restrictTo('admin'), validateBody(productSchema), createProduct);
router.put('/:id', protect, restrictTo('admin'), validateBody(productUpdateSchema), updateProduct);
router.patch('/:id/stock', protect, restrictTo('admin'), adjustStock);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

export default router;
