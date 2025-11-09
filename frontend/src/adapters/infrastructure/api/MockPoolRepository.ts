import { IPoolRepository } from '../../../core/ports/repositories/IPoolRepository';
import { Pool, PoolCreationRequest, PoolMember } from '../../../core/domain/models/Pool';

export class MockPoolRepository implements IPoolRepository {
  private pools: Pool[] = [];
  private poolIdCounter = 1;

  private mockShips = new Map([
    ['S001', { name: 'MV Ocean Pioneer', adjustedCB: 45.3 }],
    ['S002', { name: 'MV Sea Navigator', adjustedCB: -20.1 }],
    ['S003', { name: 'MV Atlantic Trader', adjustedCB: 30.8 }],
    ['S004', { name: 'MV Pacific Spirit', adjustedCB: -15.5 }],
  ]);

  async getAllPools(): Promise<Pool[]> {
    return [...this.pools];
  }

  async getPoolById(poolId: string): Promise<Pool | null> {
    return this.pools.find(p => p.poolId === poolId) || null;
  }

  async createPool(request: PoolCreationRequest): Promise<Pool> {
    const members: PoolMember[] = request.shipIds.map(shipId => {
      const ship = this.mockShips.get(shipId);
      if (!ship) throw new Error(`Ship ${shipId} not found`);

      return {
        shipId,
        shipName: ship.name,
        adjustedCB: ship.adjustedCB,
        cbBeforePool: ship.adjustedCB,
        cbAfterPool: 0, // Will be calculated after pool creation
      };
    });

    const totalCB = members.reduce((sum, m) => sum + m.adjustedCB, 0);
    const avgCB = totalCB / members.length;

    // Distribute CB evenly
    members.forEach(m => {
      m.cbAfterPool = avgCB;
    });

    const pool: Pool = {
      poolId: `P${String(this.poolIdCounter++).padStart(3, '0')}`,
      name: request.name,
      year: request.year,
      members,
      totalCB,
      isValid: totalCB >= 0,
      createdAt: new Date(),
    };

    this.pools.push(pool);
    return pool;
  }

  async validatePool(shipIds: string[], year: number): Promise<boolean> {
    const totalCB = shipIds.reduce((sum, shipId) => {
      const ship = this.mockShips.get(shipId);
      return sum + (ship?.adjustedCB || 0);
    }, 0);

    return totalCB >= 0;
  }
}
