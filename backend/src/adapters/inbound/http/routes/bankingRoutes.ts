import { Router, Request, Response } from 'express';
import { BankingUseCase } from '../../../../core/application/BankingUseCase';
import { MockBankingRepository } from '../../../outbound/postgres/MockBankingRepository';
import { PostgresBankingRepository } from '../../../outbound/postgres/PostgresBankingRepository';
import { BankOperation, ApplyOperation } from '../../../../core/domain/Banking';

const router = Router();
// Use PostgreSQL if DB_HOST is set, otherwise use mock
const bankingRepository = process.env.DB_HOST 
  ? new PostgresBankingRepository() 
  : new MockBankingRepository();
const bankingUseCase = new BankingUseCase(bankingRepository);

router.post('/banking/bank', async (req: Request, res: Response) => {
  try {
    const operation: BankOperation = req.body;
    if (!operation.year || !operation.amount) {
      return res.status(400).json({ error: 'year and amount are required' });
    }
    const result = await bankingUseCase.bankSurplus(operation);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bank surplus' });
  }
});

router.post('/banking/apply', async (req: Request, res: Response) => {
  try {
    const operation: ApplyOperation = req.body;
    if (!operation.year || !operation.amount) {
      return res.status(400).json({ error: 'year and amount are required' });
    }
    const result = await bankingUseCase.applyBankedSurplus(operation);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply banked surplus' });
  }
});

export default router;

