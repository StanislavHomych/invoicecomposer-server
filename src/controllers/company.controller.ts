import { Request, Response, NextFunction } from 'express';
import * as companyService from '../services/company.service';
import { companySchema } from '../validators/company.validator';

export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companyService.getCompanyByUserId(req.user!.id);
    res.json(company || null);
  } catch (error) {
    next(error);
  }
}

export async function upsertCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const data = companySchema.parse(req.body);
    const company = await companyService.upsertCompany(req.user!.id, data);
    res.json(company);
  } catch (error) {
    next(error);
  }
}
