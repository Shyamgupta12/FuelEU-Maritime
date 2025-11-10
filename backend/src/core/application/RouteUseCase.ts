import { Route, Baseline, ComparisonData } from '../domain/Route';
import { RouteRepository } from '../ports/RouteRepository';

const COMPLIANCE_TARGET = 89.3368; // gCO₂e/MJ

export class RouteUseCase {
  constructor(private routeRepository: RouteRepository) {}

  async getAllRoutes(): Promise<Route[]> {
    return this.routeRepository.findAll();
  }

  async setBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    return this.routeRepository.saveBaseline(routeId, baseline);
  }

  async getComparison(routeId: string, year: number): Promise<ComparisonData> {
    // Get the route first (this should be the baseline route)
    const route = await this.routeRepository.findByRouteId(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    // Try to find baseline in baselines table for the requested year
    let baseline = await this.routeRepository.findBaseline(routeId, year);
    
    // If not found, try to find baseline for the route's own year
    if (!baseline) {
      baseline = await this.routeRepository.findBaseline(routeId, route.year);
    }
    
    // If baseline not found in baselines table, but route is marked as baseline, use route data
    if (!baseline && route.isBaseline) {
      baseline = {
        routeId: route.routeId,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
      };
    }

    if (!baseline) {
      throw new Error(`Baseline not found for route ${routeId}. Please set this route as baseline first.`);
    }

    // Use the route as comparison (current data)
    // If the route is the baseline itself, comparison will show no change
    const comparison = route;

    const percentDifference = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
    const isCompliant = comparison.ghgIntensity <= COMPLIANCE_TARGET;

    return {
      baseline,
      comparison,
      percentDifference,
      complianceTarget: COMPLIANCE_TARGET,
      isCompliant,
    };
  }

  async getAllComparisons(year?: number): Promise<ComparisonData[]> {
    // Get all routes
    const allRoutes = await this.routeRepository.findAll();
    
    // Find the baseline route
    const baselineRoute = allRoutes.find(r => r.isBaseline);
    
    if (!baselineRoute) {
      throw new Error('No baseline route found. Please set a baseline route first.');
    }

    // Get baseline data
    let baseline: Baseline | null = null;
    
    // Try to find baseline in baselines table
    if (year) {
      baseline = await this.routeRepository.findBaseline(baselineRoute.routeId, year);
    }
    
    // If not found, try to find baseline for the route's own year
    if (!baseline) {
      baseline = await this.routeRepository.findBaseline(baselineRoute.routeId, baselineRoute.year);
    }
    
    // If baseline not found in baselines table, use route data
    if (!baseline) {
      baseline = {
        routeId: baselineRoute.routeId,
        year: baselineRoute.year,
        ghgIntensity: baselineRoute.ghgIntensity,
        fuelConsumption: baselineRoute.fuelConsumption,
        distance: baselineRoute.distance,
        totalEmissions: baselineRoute.totalEmissions,
      };
    }

    // Filter routes by year if specified
    const routesToCompare = year 
      ? allRoutes.filter(r => r.year === year)
      : allRoutes;

    // Compare each route with the baseline
    const comparisons: ComparisonData[] = routesToCompare.map(route => {
      const percentDifference = ((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const isCompliant = route.ghgIntensity <= COMPLIANCE_TARGET;

      return {
        baseline,
        comparison: route,
        percentDifference,
        complianceTarget: COMPLIANCE_TARGET,
        isCompliant,
      };
    });

    return comparisons;
  }
}

