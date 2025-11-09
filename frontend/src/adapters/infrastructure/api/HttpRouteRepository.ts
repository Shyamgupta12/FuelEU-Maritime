import { IRouteRepository } from '../../../core/ports/repositories/IRouteRepository';
import { Route, RouteComparison } from '../../../core/domain/models/Route';

const API_BASE_URL = '/api';
const TARGET_INTENSITY = 89.3368; // gCO₂e/MJ

export class HttpRouteRepository implements IRouteRepository {
  async getAllRoutes(): Promise<Route[]> {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }
    const data = await response.json();
    // Map backend Route to frontend Route format
    return data.map((route: any) => ({
      routeId: route.routeId,
      vesselType: route.vesselType,
      fuelType: route.fuelType,
      year: route.year,
      ghgIntensity: route.ghgIntensity,
      fuelConsumption: route.fuelConsumption,
      distance: route.distance,
      totalEmissions: route.totalEmissions,
      isBaseline: route.isBaseline || false,
    }));
  }

  async getRouteById(routeId: string): Promise<Route | null> {
    const routes = await this.getAllRoutes();
    return routes.find(r => r.routeId === routeId) || null;
  }

  async setBaseline(routeId: string): Promise<void> {
    const route = await this.getRouteById(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    const response = await fetch(`${API_BASE_URL}/routes/${routeId}/baseline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routeId: route.routeId,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to set baseline');
    }
  }

  async getComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]> {
    // Get all routes for both years
    const allRoutes = await this.getAllRoutes();
    const baselineRoutes = allRoutes.filter(r => r.year === baselineYear && r.isBaseline);
    const comparisonRoutes = allRoutes.filter(r => r.year === comparisonYear);

    // For each baseline route, find matching comparison and create comparison object
    const comparisons: RouteComparison[] = [];

    for (const baseline of baselineRoutes) {
      // Try to find a comparison route with same vessel type
      const comparison = comparisonRoutes.find(
        c => c.vesselType === baseline.vesselType
      ) || baseline;

      const percentDifference = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const complianceStatus = comparison.ghgIntensity <= TARGET_INTENSITY ? 'compliant' : 'non-compliant';

      comparisons.push({
        baseline,
        comparison,
        percentDifference,
        complianceStatus,
        targetIntensity: TARGET_INTENSITY,
      });
    }

    // If no baselines found, create comparisons from all routes
    if (comparisons.length === 0 && allRoutes.length > 0) {
      const baseline = allRoutes.find(r => r.year === baselineYear) || allRoutes[0];
      const comparison = allRoutes.find(r => r.year === comparisonYear && r.vesselType === baseline.vesselType) || baseline;

      const percentDifference = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const complianceStatus = comparison.ghgIntensity <= TARGET_INTENSITY ? 'compliant' : 'non-compliant';

      comparisons.push({
        baseline,
        comparison,
        percentDifference,
        complianceStatus,
        targetIntensity: TARGET_INTENSITY,
      });
    }

    return comparisons;
  }

  async filterRoutes(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const allRoutes = await this.getAllRoutes();
    let filtered = [...allRoutes];

    if (filters.vesselType) {
      filtered = filtered.filter(r => 
        r.vesselType.toLowerCase().includes(filters.vesselType!.toLowerCase())
      );
    }
    if (filters.fuelType) {
      filtered = filtered.filter(r => 
        r.fuelType.toLowerCase().includes(filters.fuelType!.toLowerCase())
      );
    }
    if (filters.year) {
      filtered = filtered.filter(r => r.year === filters.year);
    }

    return filtered;
  }
}

