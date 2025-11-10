import { Router, Request, Response } from 'express';
import { PoolUseCase } from '../../../../core/application/PoolUseCase';
import { MockPoolRepository } from '../../../outbound/postgres/MockPoolRepository';
import { PostgresPoolRepository } from '../../../outbound/postgres/PostgresPoolRepository';
import { MockShipComplianceRepository } from '../../../outbound/postgres/MockShipComplianceRepository';
import { PostgresShipComplianceRepository } from '../../../outbound/postgres/PostgresShipComplianceRepository';
import { CreatePoolRequest } from '../../../../core/domain/Pool';

const router = Router();
// Use PostgreSQL if DB_HOST is set, otherwise use mock
const poolRepository = process.env.DB_HOST 
  ? new PostgresPoolRepository() 
  : new MockPoolRepository();
const shipComplianceRepository = process.env.DB_HOST 
  ? new PostgresShipComplianceRepository() 
  : new MockShipComplianceRepository();
const poolUseCase = new PoolUseCase(poolRepository, shipComplianceRepository);

/**
 * POST /api/pools
 * Create a new pool with member ships
 * Body: { year: number, memberShipIds: string[] }
 */
router.post('/pools', async (req: Request, res: Response) => {
  try {
    // Log request for debugging
    console.log('Create pool request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          year: 2024,
          memberShipIds: ['SHIP001', 'SHIP002']
        }
      });
    }
    
    const request: CreatePoolRequest = req.body;
    
    // Validate year
    if (request.year === undefined || request.year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: request.year,
        type: typeof request.year,
        example: { year: 2024, memberShipIds: ['SHIP001'] }
      });
    }
    
    const yearNum = typeof request.year === 'string' ? parseInt(request.year) : request.year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: request.year,
        parsed: yearNum
      });
    }
    
    // Validate memberShipIds
    if (!request.memberShipIds) {
      return res.status(400).json({ 
        error: 'memberShipIds is required and must be an array',
        received: request.memberShipIds,
        type: typeof request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    if (!Array.isArray(request.memberShipIds)) {
      return res.status(400).json({ 
        error: 'memberShipIds must be an array of strings',
        received: request.memberShipIds,
        type: typeof request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    if (request.memberShipIds.length === 0) {
      return res.status(400).json({ 
        error: 'memberShipIds must contain at least one ship ID',
        received: request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    // Validate each ship ID is a string
    const invalidShipIds = request.memberShipIds.filter(id => typeof id !== 'string' || id.trim() === '');
    if (invalidShipIds.length > 0) {
      return res.status(400).json({ 
        error: 'All memberShipIds must be non-empty strings',
        invalidShipIds: invalidShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    // Create validated request
    const validatedRequest: CreatePoolRequest = {
      name: request.name || undefined,
      year: yearNum,
      memberShipIds: request.memberShipIds.map(id => id.trim()),
    };
    
    const pool = await poolUseCase.createPool(validatedRequest);
    res.json(pool);
  } catch (error: any) {
    console.error('Error creating pool:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create pool',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/pools
 * Get all pools
 */
router.get('/pools', async (req: Request, res: Response) => {
  try {
    const pools = await poolUseCase.getAllPools();
    res.json(pools);
  } catch (error: any) {
    console.error('Error fetching pools:', error);
    
    // Provide helpful error message if table/column doesn't exist
    if (error.code === '42703' || error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database schema issue detected. Please run the schema: npm run schema',
        details: error.message,
        hint: 'The pools table may not exist or may be missing columns. Run: npm run schema'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pools',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;

