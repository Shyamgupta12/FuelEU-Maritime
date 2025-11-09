import { IRouteRepository } from '../../../core/ports/repositories/IRouteRepository';
import { Route, RouteComparison } from '../../../core/domain/models/Route';

const TARGET_INTENSITY = 89.3368; // gCO₂e/MJ

const mockRoutes: Route[] = [
  {
    routeId: 'R001',
    vesselType: 'Container Ship',
    fuelType: 'HFO',
    year: 2023,
    ghgIntensity: 91.5,
    fuelConsumption: 2500,
    distance: 5000,
    totalEmissions: 7500,
    isBaseline: true,
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
    isBaseline: false,
  },
  {
    routeId: 'R003',
    vesselType: 'Bulk Carrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 75.4,
    fuelConsumption: 2800,
    distance: 5500,
    totalEmissions: 6800,
    isBaseline: false,
  },
  {
    routeId: 'R004',
    vesselType: 'Container Ship',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 89.1,
    fuelConsumption: 2600,
    distance: 5200,
    totalEmissions: 7400,
    isBaseline: false,
  },
];

export class MockRouteRepository implements IRouteRepository {
  private routes: Route[] = [...mockRoutes];

  async getAllRoutes(): Promise<Route[]> {
    return [...this.routes];
  }

  async getRouteById(routeId: string): Promise<Route | null> {
    return this.routes.find(r => r.routeId === routeId) || null;
  }

  async setBaseline(routeId: string): Promise<void> {
    this.routes = this.routes.map(r => ({
      ...r,
      isBaseline: r.routeId === routeId,
    }));
  }

  async getComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]> {
    const baselineRoutes = this.routes.filter(r => r.year === baselineYear && r.isBaseline);
    const comparisonRoutes = this.routes.filter(r => r.year === comparisonYear);

    return baselineRoutes.map(baseline => {
      const comparison = comparisonRoutes.find(c => c.vesselType === baseline.vesselType) || baseline;
      const percentDifference = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const complianceStatus = comparison.ghgIntensity <= TARGET_INTENSITY ? 'compliant' : 'non-compliant';

      return {
        baseline,
        comparison,
        percentDifference,
        complianceStatus,
        targetIntensity: TARGET_INTENSITY,
      };
    });
  }

  async filterRoutes(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    let filtered = [...this.routes];

    if (filters.vesselType) {
      filtered = filtered.filter(r => r.vesselType === filters.vesselType);
    }
    if (filters.fuelType) {
      filtered = filtered.filter(r => r.fuelType === filters.fuelType);
    }
    if (filters.year) {
      filtered = filtered.filter(r => r.year === filters.year);
    }

    return filtered;
  }
}
