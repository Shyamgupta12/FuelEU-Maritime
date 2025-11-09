import { Router, Request, Response } from 'express';
import { PoolUseCase } from '../../../../core/application/PoolUseCase';
import { MockPoolRepository } from '../../../outbound/postgres/MockPoolRepository';
import { PostgresPoolRepository } from '../../../outbound/postgres/PostgresPoolRepository';
import { MockComplianceRepository } from '../../../outbound/postgres/MockComplianceRepository';
import { PostgresComplianceRepository } from '../../../outbound/postgres/PostgresComplianceRepository';
import { CreatePoolRequest } from '../../../../core/domain/Pool';

const router = Router();
// Use PostgreSQL if DB_HOST is set, otherwise use mock
const poolRepository = process.env.DB_HOST 
  ? new PostgresPoolRepository() 
  : new MockPoolRepository();
const complianceRepository = process.env.DB_HOST 
  ? new PostgresComplianceRepository() 
  : new MockComplianceRepository();
const poolUseCase = new PoolUseCase(poolRepository, complianceRepository);

router.post('/pools', async (req: Request, res: Response) => {
  try {
    const request: CreatePoolRequest = req.body;
    if (!request.year || !request.memberShipIds || request.memberShipIds.length === 0) {
      return res.status(400).json({ error: 'year and memberShipIds are required' });
    }
    const pool = await poolUseCase.createPool(request);
    res.json(pool);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create pool' });
  }
});

export default router;

