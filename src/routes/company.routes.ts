import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', companyController.getCompany);
router.put('/', companyController.upsertCompany);

export default router;
