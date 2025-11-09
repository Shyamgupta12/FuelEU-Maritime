import { Router, Request, Response } from 'express';
import { ComplianceUseCase } from '../../../../core/application/ComplianceUseCase';
import { MockComplianceRepository } from '../../../outbound/postgres/MockComplianceRepository';
import { PostgresComplianceRepository } from '../../../outbound/postgres/PostgresComplianceRepository';

const router = Router();
// Use PostgreSQL if DB_HOST is set, otherwise use mock
const complianceRepository = process.env.DB_HOST 
  ? new PostgresComplianceRepository() 
  : new MockComplianceRepository();
const complianceUseCase = new ComplianceUseCase(complianceRepository);

router.get('/compliance/cb', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    if (!year) {
      return res.status(400).json({ error: 'year query parameter is required' });
    }
    const cb = await complianceUseCase.getComplianceBalance(year);
    res.json(cb);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance balance' });
  }
});

router.get('/compliance/adjusted-cb', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    if (!year) {
      return res.status(400).json({ error: 'year query parameter is required' });
    }
    const adjustedCBs = await complianceUseCase.getAdjustedComplianceBalance(year);
    res.json(adjustedCBs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch adjusted compliance balance' });
  }
});

export default router;

