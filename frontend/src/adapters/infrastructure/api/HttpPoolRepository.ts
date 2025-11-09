import { IPoolRepository } from '../../../core/ports/repositories/IPoolRepository';
import { Pool, PoolCreationRequest, PoolMember } from '../../../core/domain/models/Pool';

const API_BASE_URL = '/api';

export class HttpPoolRepository implements IPoolRepository {
  async getAllPools(): Promise<Pool[]> {
    // Backend doesn't have a GET all pools endpoint yet, return empty for now
    // TODO: Add GET /api/pools endpoint to backend
    return [];
  }

  async getPoolById(poolId: string): Promise<Pool | null> {
    // Backend doesn't have a GET pool by ID endpoint yet
    // TODO: Add GET /api/pools/:poolId endpoint to backend
    return null;
  }

  async createPool(request: PoolCreationRequest): Promise<Pool> {
    // First, get adjusted CBs for validation
    const adjustedCBsResponse = await fetch(`${API_BASE_URL}/compliance/adjusted-cb?year=${request.year}`);
    if (!adjustedCBsResponse.ok) {
      throw new Error('Failed to fetch adjusted compliance balances');
    }
    const adjustedCBs = await adjustedCBsResponse.json();

    // Create pool members from ship IDs
    const members: PoolMember[] = request.shipIds.map(shipId => {
      const ship = adjustedCBs.find((cb: any) => cb.shipId === shipId);
      if (!ship) {
        throw new Error(`Ship ${shipId} not found or has no adjusted CB for year ${request.year}`);
      }

      return {
        shipId,
        shipName: `Ship ${shipId}`, // Backend doesn't provide ship names
        adjustedCB: ship.adjustedCB,
        cbBeforePool: ship.adjustedCB,
        cbAfterPool: 0, // Will be calculated after pool creation
      };
    });

    const totalCB = members.reduce((sum, m) => sum + m.adjustedCB, 0);

    // Call backend to create pool
    const response = await fetch(`${API_BASE_URL}/pools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year: request.year,
        memberShipIds: request.shipIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create pool');
    }

    const backendPool = await response.json();

    // Calculate average CB for distribution
    const avgCB = totalCB / members.length;
    members.forEach(m => {
      m.cbAfterPool = avgCB;
    });

    // Map backend response to frontend format
    const pool: Pool = {
      poolId: backendPool.poolId,
      name: request.name,
      year: backendPool.year,
      members,
      totalCB: backendPool.poolSum,
      isValid: backendPool.poolSum >= 0,
      createdAt: new Date(backendPool.createdAt),
    };

    return pool;
  }

  async validatePool(shipIds: string[], year: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/adjusted-cb?year=${year}`);
      if (!response.ok) {
        return false;
      }
      const adjustedCBs = await response.json();

      const totalCB = shipIds.reduce((sum, shipId) => {
        const ship = adjustedCBs.find((cb: any) => cb.shipId === shipId);
        return sum + (ship?.adjustedCB || 0);
      }, 0);

      return totalCB >= 0;
    } catch {
      return false;
    }
  }
}

