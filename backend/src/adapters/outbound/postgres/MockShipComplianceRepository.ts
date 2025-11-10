import { ShipCompliance } from '../../core/domain/ShipCompliance';
import { ShipComplianceRepository } from '../../core/ports/ShipComplianceRepository';

/**
 * Mock implementation for development/testing
 */
export class MockShipComplianceRepository implements ShipComplianceRepository {
  private shipCompliance: ShipCompliance[] = [];

  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    return this.shipCompliance.find(
      sc => sc.shipId === shipId && sc.year === year
    ) || null;
  }

  async findByYear(year: number): Promise<ShipCompliance[]> {
    return this.shipCompliance.filter(sc => sc.year === year);
  }

  async save(shipCompliance: ShipCompliance): Promise<ShipCompliance> {
    const existing = this.shipCompliance.findIndex(
      sc => sc.shipId === shipCompliance.shipId && sc.year === shipCompliance.year
    );

    if (existing >= 0) {
      this.shipCompliance[existing] = { ...shipCompliance, id: this.shipCompliance[existing].id };
      return this.shipCompliance[existing];
    } else {
      const newCompliance: ShipCompliance = {
        ...shipCompliance,
        id: this.shipCompliance.length + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.shipCompliance.push(newCompliance);
      return newCompliance;
    }
  }

  async computeAndSave(shipId: string, year: number, routeId: string): Promise<ShipCompliance> {
    // Mock computation - in real implementation, this would fetch route data
    // For now, return a mock CB value
    const mockCB = Math.random() * 1000000 - 500000; // Random value between -500k and 500k
    
    const shipCompliance: ShipCompliance = {
      shipId,
      year,
      cbGco2eq: mockCB,
    };

    return this.save(shipCompliance);
  }
}

