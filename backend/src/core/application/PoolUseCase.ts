import { Pool, CreatePoolRequest, PoolMember } from '../domain/Pool';
import { PoolRepository } from '../ports/PoolRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';

export class PoolUseCase {
  constructor(
    private poolRepository: PoolRepository,
    private complianceRepository: ComplianceRepository
  ) {}

  async createPool(request: CreatePoolRequest): Promise<Pool> {
    // Get adjusted CB for all member ships
    const adjustedCBs = await this.complianceRepository.findAdjustedComplianceBalance(request.year);
    
    const members: PoolMember[] = request.memberShipIds.map((shipId) => {
      const adjustedCB = adjustedCBs.find((cb) => cb.shipId === shipId);
      if (!adjustedCB) {
        throw new Error(`Adjusted CB not found for ship ${shipId}`);
      }
      return {
        shipId,
        adjustedCB: adjustedCB.adjustedCB,
        cbBefore: adjustedCB.adjustedCB,
        cbAfter: 0, // Will be calculated after pooling
      };
    });

    const poolSum = members.reduce((sum, member) => sum + member.adjustedCB, 0);

    if (poolSum < 0) {
      throw new Error('Cannot create pool: Sum of adjusted CBs is negative');
    }

    const pool: Pool = {
      poolId: `pool-${Date.now()}`,
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

