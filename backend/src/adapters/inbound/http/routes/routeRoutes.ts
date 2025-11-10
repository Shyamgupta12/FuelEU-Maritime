import { Router, Request, Response } from 'express';
import { RouteUseCase } from '../../../../core/application/RouteUseCase';
import { MockRouteRepository } from '../../../outbound/postgres/MockRouteRepository';
import { PostgresRouteRepository } from '../../../outbound/postgres/PostgresRouteRepository';
import { Baseline } from '../../../../core/domain/Route';

const router = Router();
// Use PostgreSQL if DB_HOST is set, otherwise use mock
const routeRepository = process.env.DB_HOST 
  ? new PostgresRouteRepository() 
  : new MockRouteRepository();
const routeUseCase = new RouteUseCase(routeRepository);

router.get('/routes', async (req: Request, res: Response) => {
  try {
    const routes = await routeUseCase.getAllRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

router.post('/routes/:routeId/baseline', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    
    // Get the route first to ensure we have all required data
    const existingRoute = await routeRepository.findByRouteId(routeId);
    
    if (!existingRoute) {
      return res.status(404).json({ error: `Route ${routeId} not found` });
    }
    
    // Create baseline with route data, allowing request body to override
    const baseline: Baseline = {
      routeId,
      year: req.body.year || existingRoute.year,
      ghgIntensity: req.body.ghgIntensity || existingRoute.ghgIntensity,
      fuelConsumption: req.body.fuelConsumption || existingRoute.fuelConsumption,
      distance: req.body.distance || existingRoute.distance,
      totalEmissions: req.body.totalEmissions || existingRoute.totalEmissions,
    };
    
    // Validate required fields
    if (!baseline.year || baseline.ghgIntensity === undefined || baseline.fuelConsumption === undefined || 
        baseline.distance === undefined || baseline.totalEmissions === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields. Provide year, ghgIntensity, fuelConsumption, distance, and totalEmissions' 
      });
    }
    
    const savedBaseline = await routeUseCase.setBaseline(routeId, baseline);
    res.json(savedBaseline);
  } catch (error: any) {
    console.error('Error setting baseline:', error);
    res.status(500).json({ error: error.message || 'Failed to set baseline' });
  }
});

router.get('/routes/comparison', async (req: Request, res: Response) => {
  try {
    const routeId = req.query.routeId as string;
    const year = req.query.year as string;
    
    // If routeId is provided, do single route comparison (backward compatibility)
    if (routeId && routeId.trim() !== '') {
      if (!year || year.trim() === '') {
        return res.status(400).json({ 
          error: 'year query parameter is required when routeId is provided',
          example: '/api/routes/comparison?routeId=R001&year=2024'
        });
      }
      
      const yearNum = parseInt(year.trim());
      if (isNaN(yearNum)) {
        return res.status(400).json({ 
          error: 'year must be a valid number',
          received: year
        });
      }
      
      const comparison = await routeUseCase.getComparison(
        routeId.trim(),
        yearNum
      );
      return res.json(comparison);
    }
    
    // If no routeId, compare all routes with baseline
    const yearNum = year ? parseInt(year.trim()) : undefined;
    if (year && isNaN(yearNum!)) {
      return res.status(400).json({ 
        error: 'year must be a valid number',
        received: year
      });
    }
    
    const comparisons = await routeUseCase.getAllComparisons(yearNum);
    res.json(comparisons);
  } catch (error: any) {
    console.error('Error getting comparison:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get comparison',
      details: error.stack
    });
  }
});

export default router;