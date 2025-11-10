import { Pool, CreatePoolRequest, PoolMember } from '../domain/Pool';
import { PoolRepository } from '../ports/PoolRepository';
import { ShipComplianceRepository } from '../ports/ShipComplianceRepository';

export class PoolUseCase {
  constructor(
    private poolRepository: PoolRepository,
    private shipComplianceRepository: ShipComplianceRepository
  ) {}

  async createPool(request: CreatePoolRequest): Promise<Pool> {
    // Get CB for all member ships
    const members: PoolMember[] = [];
    
    for (const shipId of request.memberShipIds) {
      const shipCompliance = await this.shipComplianceRepository.findByShipAndYear(shipId, request.year);
      if (!shipCompliance) {
        throw new Error(`Compliance balance not found for ship ${shipId} in year ${request.year}`);
      }
      
      members.push({
        shipId,
        adjustedCB: shipCompliance.cbGco2eq,
        cbBefore: shipCompliance.cbGco2eq,
        cbAfter: 0, // Will be calculated after pooling
      });
    }

    const poolSum = members.reduce((sum, member) => sum + member.adjustedCB, 0);

    if (poolSum < 0) {
      throw new Error('Cannot create pool: Sum of compliance balances is negative');
    }

    // Calculate CB after pooling (distribute pool sum equally, or set to 0 if negative)
    const cbAfter = poolSum >= 0 ? poolSum / members.length : 0;
    members.forEach(member => {
      member.cbAfter = cbAfter;
    });

    const pool: Pool = {
      poolId: `pool-${Date.now()}`,
      name: request.name,
      year: request.year,
      members,
      poolSum,
      createdAt: new Date(),
    };

    return this.poolRepository.save(pool);
  }

  async getAllPools(): Promise<Pool[]> {
    return this.poolRepository.findAll();
  }
}

