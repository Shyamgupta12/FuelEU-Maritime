import { Pool } from '../../core/domain/Pool';
import { PoolRepository } from '../../core/ports/PoolRepository';

const pools: Pool[] = [];

export class MockPoolRepository implements PoolRepository {
  async save(pool: Pool): Promise<Pool> {
    pools.push(pool);
    return pool;
  }

  async findAll(): Promise<Pool[]> {
    return [...pools];
  }

  async findById(poolId: string): Promise<Pool | null> {
    return pools.find((p) => p.poolId === poolId) || null;
  }
}

