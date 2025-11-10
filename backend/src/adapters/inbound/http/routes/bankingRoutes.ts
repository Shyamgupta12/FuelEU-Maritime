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

/**
 * POST /api/banking/bank
 * Bank surplus for a ship (per-ship banking)
 * Body: { shipId: string, year: number, amount: number }
 */
router.post('/banking/bank', async (req: Request, res: Response) => {
  try {
    const { shipId, year, amount } = req.body;
    if (!shipId || !year || !amount) {
      return res.status(400).json({ error: 'shipId, year, and amount are required' });
    }
    
    await bankingRepository.bankSurplusForShip(shipId, year, amount);
    const bankedAmount = await bankingRepository.getBankedAmountForShip(shipId, year);
    
    res.json({
      success: true,
      shipId,
      year,
      bankedAmount,
      message: `Successfully banked ${amount} gCO₂e for ship ${shipId}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to bank surplus' });
  }
});

/**
 * POST /api/banking/apply
 * Apply banked surplus to a ship's CB
 * Body: { shipId: string, year: number, amount: number }
 */
router.post('/banking/apply', async (req: Request, res: Response) => {
  try {
    const { shipId, year, amount } = req.body;
    if (!shipId || !year || !amount) {
      return res.status(400).json({ error: 'shipId, year, and amount are required' });
    }
    
    await bankingRepository.applyBankedSurplusToShip(shipId, year, amount);
    
    res.json({
      success: true,
      shipId,
      year,
      appliedAmount: amount,
      message: `Successfully applied ${amount} gCO₂e from banked surplus to ship ${shipId}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply banked surplus' });
  }
});

/**
 * GET /api/banking/banked/:shipId/:year
 * Get banked amount for a specific ship and year
 */
router.get('/banking/banked/:shipId/:year', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.params;
    const bankedAmount = await bankingRepository.getBankedAmountForShip(shipId, parseInt(year));
    res.json({ shipId, year: parseInt(year), bankedAmount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get banked amount' });
  }
});

export default router;

