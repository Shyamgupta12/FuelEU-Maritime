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
    const baseline = await this.routeRepository.findBaseline(routeId, year);
    const comparison = await this.routeRepository.findByRouteId(routeId);

    if (!baseline || !comparison) {
      throw new Error('Baseline or comparison data not found');
    }

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
}

