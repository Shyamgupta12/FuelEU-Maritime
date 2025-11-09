import { Route, Baseline } from '../../core/domain/Route';
import { RouteRepository } from '../../core/ports/RouteRepository';

// Mock data
const mockRoutes: Route[] = [
  {
    routeId: 'route-001',
    vesselType: 'Container Ship',
    fuelType: 'MGO',
    year: 2024,
    ghgIntensity: 85.5,
    fuelConsumption: 5000000,
    distance: 1200,
    totalEmissions: 427500000,
  },
  {
    routeId: 'route-002',
    vesselType: 'Bulk Carrier',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 92.3,
    fuelConsumption: 8000000,
    distance: 2000,
    totalEmissions: 738400000,
  },
  {
    routeId: 'route-003',
    vesselType: 'Tanker',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 78.2,
    fuelConsumption: 6000000,
    distance: 1500,
    totalEmissions: 469200000,
  },
  {
    routeId: 'R001',
    vesselType: 'Container Ship',
    fuelType: 'HFO',
    year: 2023,
    ghgIntensity: 91.5,
    fuelConsumption: 2500,
    distance: 5000,
    totalEmissions: 7500,
  },
  {
    routeId: 'R002',
    vesselType: 'Tanker',
    fuelType: 'VLSFO',
    year: 2023,
    ghgIntensity: 88.2,
    fuelConsumption: 3200,
    distance: 6500,
    totalEmissions: 9200,
  },
];

const baselines: Map<string, Baseline> = new Map();
const baselineRouteIds: Set<string> = new Set(); // Track which routes are baselines

export class MockRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    // Add isBaseline flag to routes for frontend compatibility
    return mockRoutes.map(route => {
      const routeWithBaseline = { ...route } as any;
      routeWithBaseline.isBaseline = baselineRouteIds.has(route.routeId);
      return routeWithBaseline;
    });
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return mockRoutes.find((r) => r.routeId === routeId) || null;
  }

  async saveBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    baselines.set(`${routeId}-${baseline.year}`, baseline);
    baselineRouteIds.add(routeId); // Mark this route as a baseline
    return baseline;
  }

  async findBaseline(routeId: string, year: number): Promise<Baseline | null> {
    return baselines.get(`${routeId}-${year}`) || null;
  }
}

