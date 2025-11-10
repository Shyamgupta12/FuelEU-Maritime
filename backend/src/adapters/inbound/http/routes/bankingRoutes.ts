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
    // Log request for debugging
    console.log('Bank request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          shipId: 'R001',
          year: 2024,
          amount: 10000
        }
      });
    }
    
    const { shipId, year, amount } = req.body;
    
    // Validate shipId
    if (!shipId || typeof shipId !== 'string' || shipId.trim() === '') {
      return res.status(400).json({ 
        error: 'shipId is required and must be a non-empty string',
        received: shipId,
        type: typeof shipId,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate year
    if (year === undefined || year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: year,
        type: typeof year,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: year,
        parsed: yearNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ 
        error: 'amount is required',
        received: amount,
        type: typeof amount,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'amount must be a valid positive number',
        received: amount,
        parsed: amountNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    await bankingRepository.bankSurplusForShip(shipId.trim(), yearNum, amountNum);
    const bankedAmount = await bankingRepository.getBankedAmountForShip(shipId.trim(), yearNum);
    
    res.json({
      success: true,
      shipId: shipId.trim(),
      year: yearNum,
      bankedAmount,
      message: `Successfully banked ${amountNum} gCO₂e for ship ${shipId.trim()}`,
    });
  } catch (error: any) {
    console.error('Error banking surplus:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to bank surplus',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/banking/apply
 * Apply banked surplus to a ship's CB
 * Body: { shipId: string, year: number, amount: number }
 */
router.post('/banking/apply', async (req: Request, res: Response) => {
  try {
    // Log request for debugging
    console.log('Apply request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          shipId: 'R001',
          year: 2024,
          amount: 10000
        }
      });
    }
    
    const { shipId, year, amount } = req.body;
    
    // Validate shipId
    if (!shipId || typeof shipId !== 'string' || shipId.trim() === '') {
      return res.status(400).json({ 
        error: 'shipId is required and must be a non-empty string',
        received: shipId,
        type: typeof shipId,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate year
    if (year === undefined || year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: year,
        type: typeof year,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: year,
        parsed: yearNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ 
        error: 'amount is required',
        received: amount,
        type: typeof amount,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'amount must be a valid positive number',
        received: amount,
        parsed: amountNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    await bankingRepository.applyBankedSurplusToShip(shipId.trim(), yearNum, amountNum);
    
    res.json({
      success: true,
      shipId: shipId.trim(),
      year: yearNum,
      appliedAmount: amountNum,
      message: `Successfully applied ${amountNum} gCO₂e from banked surplus to ship ${shipId.trim()}`,
    });
  } catch (error: any) {
    console.error('Error applying banked surplus:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to apply banked surplus',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

