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
    const baseline: Baseline = {
      routeId,
      ...req.body,
    };
    const savedBaseline = await routeUseCase.setBaseline(routeId, baseline);
    res.json(savedBaseline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set baseline' });
  }
});

router.get('/routes/comparison', async (req: Request, res: Response) => {
  try {
    const { routeId, year } = req.query;
    if (!routeId || !year) {
      return res.status(400).json({ error: 'routeId and year are required' });
    }
    const comparison = await routeUseCase.getComparison(
      routeId as string,
      parseInt(year as string)
    );
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get comparison' });
  }
});

export default router;

